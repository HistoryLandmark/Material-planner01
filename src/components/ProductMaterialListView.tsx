import React, { useState, useMemo, useRef } from 'react';
import {
  Plus,
  Upload,
  Download,
  FileSpreadsheet,
  Trash2,
  Edit3,
  Check,
  AlertCircle,
  Clock,
  HelpCircle,
  ExternalLink,
  Search,
  Filter,
  Layers,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Package,
  Boxes,
  FileText,
  Copy,
  DollarSign,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { UOM, Product, RawMaterial, BOMItem } from '../types';
import {
  downloadProductMaterialTemplateExcel,
  exportProductMaterialListToExcel,
} from '../utils/export';

const UOM_OPTIONS: UOM[] = ['pcs', 'kg', 'g', 'm', 'mm', 'l', 'ml', 'set', 'roll', 'sheet'];

export const ProductMaterialListView: React.FC = () => {
  const {
    products,
    rawMaterials,
    currency,
    easyLanguageMode,
    openRephraseModalWithTerm,
    updateProductOutputAndMrp,
    addRawMaterialToProduct,
    updateProductMaterialItem,
    deleteProductMaterialItem,
    createProductWithRawMaterials,
    bulkImportProductsWithMaterials,
    updateProduct,
    deleteProduct,
    setSelectedProductId,
    setPlannedQuantity,
    setActiveTab,
    permissions,
  } = useApp();

  // Local View States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'pending_rates' | 'completed'>('all');
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(
    () => new Set(products.map((p) => p.id))
  );

  // Modals
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);

  // Editing Product Output / MRP Inline
  const [editingField, setEditingField] = useState<{
    productId: string;
    field: 'name' | 'output' | 'mrp';
    value: string;
  } | null>(null);

  // Editing Material Inline
  const [editingMaterial, setEditingMaterial] = useState<{
    productId: string;
    materialId: string;
    field: 'name' | 'qty' | 'rate' | 'uom';
    value: string;
  } | null>(null);

  // Quick Inline Add state per product (map of productId -> row inputs)
  const [inlineAddStates, setInlineAddStates] = useState<
    Record<
      string,
      {
        name: string;
        qty: number;
        rate: string;
        uom: UOM;
      }
    >
  >({});

  // Currency Formatter
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const matMap = useMemo(() => {
    return new Map<string, RawMaterial>(rawMaterials.map((m) => [m.id, m]));
  }, [rawMaterials]);

  // Aggregate Stats
  const stats = useMemo(() => {
    let totalOutputUnits = 0;
    let totalRevenue = 0;
    let totalMaterialCost = 0;
    let totalMaterialItems = 0;
    let totalPendingRates = 0;

    products.forEach((p) => {
      const output = p.requiredOutput || 100;
      const mrp = p.sellingPrice || 0;
      totalOutputUnits += output;
      totalRevenue += output * mrp;

      const activeVerId = p.activeBomVersionId || p.bomVersions[0]?.id;
      const activeVer = p.bomVersions.find((v) => v.id === activeVerId) || p.bomVersions[0];
      const items = activeVer ? activeVer.items : [];

      totalMaterialItems += items.length;

      items.forEach((it) => {
        const mat = matMap.get(it.rawMaterialId);
        const rate = mat ? mat.currentRate : 0;
        if (!rate || rate <= 0) {
          totalPendingRates++;
        }
        totalMaterialCost += it.quantityPerUnit * output * (rate || 0);
      });
    });

    return {
      productCount: products.length,
      totalOutputUnits,
      totalRevenue,
      totalMaterialCost,
      totalMaterialItems,
      totalPendingRates,
    };
  }, [products, matMap]);

  // Filter & Search Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const activeVerId = p.activeBomVersionId || p.bomVersions[0]?.id;
      const activeVer = p.bomVersions.find((v) => v.id === activeVerId) || p.bomVersions[0];
      const items = activeVer ? activeVer.items : [];

      const hasPendingRates = items.some((it) => {
        const mat = matMap.get(it.rawMaterialId);
        return !mat || !mat.currentRate || mat.currentRate <= 0;
      });

      if (filterMode === 'pending_rates' && !hasPendingRates) return false;
      if (filterMode === 'completed' && hasPendingRates) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      if (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) {
        return true;
      }

      // Check if any raw material matches
      return items.some((it) => {
        const mat = matMap.get(it.rawMaterialId);
        return (
          mat &&
          (mat.name.toLowerCase().includes(q) ||
            mat.code.toLowerCase().includes(q) ||
            mat.category.toLowerCase().includes(q))
        );
      });
    });
  }, [products, matMap, searchQuery, filterMode]);

  // Toggle Collapse
  const toggleProductExpand = (id: string) => {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => setExpandedProductIds(new Set(products.map((p) => p.id)));
  const collapseAll = () => setExpandedProductIds(new Set());

  // Handle Quick Inline Material Add
  const handleInlineAddMaterial = (productId: string) => {
    const st = inlineAddStates[productId] || { name: '', qty: 1, rate: '', uom: 'pcs' };
    if (!st.name.trim()) return;

    const rateNum = st.rate !== '' ? parseFloat(st.rate) : 0;

    addRawMaterialToProduct(productId, {
      name: st.name.trim(),
      quantityPerUnit: st.qty > 0 ? st.qty : 1,
      unitRate: isNaN(rateNum) ? 0 : rateNum,
      uom: st.uom,
    });

    // Reset inline form for this product
    setInlineAddStates((prev) => ({
      ...prev,
      [productId]: { name: '', qty: 1, rate: '', uom: 'pcs' },
    }));
  };

  // Add 4 Blank Rows (to fill in later)
  const handleAddBlankMaterialRows = (productId: string, count = 4) => {
    for (let i = 1; i <= count; i++) {
      addRawMaterialToProduct(productId, {
        name: `Raw Material Item ${i}`,
        quantityPerUnit: 1,
        unitRate: 0, // 0 signifies "fill later"
        uom: 'pcs',
      });
    }
  };

  // Switch to MRP Planner with this product
  const handleOpenInPlanner = (product: Product) => {
    setSelectedProductId(product.id);
    const output = product.requiredOutput || 100;
    setPlannedQuantity(output);
    setActiveTab('production-planner');
  };

  return (
    <div id="product-material-list-view" className="space-y-6 pb-12">
      {/* Top Header & Overview Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {easyLanguageMode ? 'Products & Needed Raw Materials' : 'Product & Material Requirements List'}
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-800 rounded-full">
                  Batch & MRP Entry
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-0.5">
                {easyLanguageMode
                  ? 'Set how many items you want to make, selling price (MRP), and 4–5 raw materials needed per product. Enter prices now or fill them later!'
                  : 'Define finished products with Required Output, End Product MRP, and nested raw material requirements (4–5 components per product) with rates to fill later.'}
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-add-finished-product"
            onClick={() => setIsAddProductModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Finished Product</span>
          </button>

          <button
            id="btn-upload-spreadsheet"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Excel / CSV</span>
          </button>

          <button
            id="btn-paste-spreadsheet"
            onClick={() => setIsPasteModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Paste tab-delimited or comma-delimited data directly from Excel"
          >
            <Copy className="w-4 h-4" />
            <span>Paste Data</span>
          </button>

          <button
            id="btn-download-template"
            onClick={downloadProductMaterialTemplateExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Download formatted Excel sample template"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Sample Template</span>
          </button>

          <button
            id="btn-export-excel"
            onClick={() => exportProductMaterialListToExcel(products, rawMaterials, currency)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Export all configured products and materials to Excel"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Metric Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">
            {easyLanguageMode ? 'Products Made' : 'Finished Products'}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900">{stats.productCount}</span>
            <span className="text-xs text-slate-400">items</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">
            {easyLanguageMode ? 'Total Target Output' : 'Total Required Output'}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-indigo-700">
              {stats.totalOutputUnits.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">units</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">
            {easyLanguageMode ? 'Raw Material Lines' : 'Total Material Items'}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-800">{stats.totalMaterialItems}</span>
            <span className="text-xs text-slate-400">rows</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">
            {easyLanguageMode ? 'Total Sales Value' : 'Total Output Value (MRP)'}
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold text-emerald-700">
              {formatCurrency(stats.totalRevenue)}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">
            {easyLanguageMode ? 'Total Material Cost' : 'Batch Material Cost'}
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold text-slate-900">
              {formatCurrency(stats.totalMaterialCost)}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-amber-700 block">
            {easyLanguageMode ? 'Rates to Fill Later' : 'Pending Rates'}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold text-amber-700">{stats.totalPendingRates}</span>
            {stats.totalPendingRates > 0 ? (
              <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded">
                <Clock className="w-3 h-3 mr-0.5" /> Fill Later
              </span>
            ) : (
              <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 rounded">
                <Check className="w-3 h-3 mr-0.5" /> All Filled
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by product name, SKU, or raw material..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-medium">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterMode === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Products ({products.length})
            </button>
            <button
              onClick={() => setFilterMode('pending_rates')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
                filterMode === 'pending_rates'
                  ? 'bg-amber-100 text-amber-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Pending Rates</span>
            </button>
            <button
              onClick={() => setFilterMode('completed')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterMode === 'completed'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Rates Filled
            </button>
          </div>

          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
            <button
              onClick={expandAll}
              className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Main List: Products with Nested Raw Materials */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No matching products found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            {searchQuery
              ? `No products or materials matched "${searchQuery}". Try changing your search query.`
              : 'Add your first finished product, or upload an Excel / CSV spreadsheet to get started.'}
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={() => setIsAddProductModalOpen(true)}
              className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              + Add Finished Product
            </button>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 text-sm font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              Upload Excel / CSV
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredProducts.map((product) => {
            const isExpanded = expandedProductIds.has(product.id);
            const activeVerId = product.activeBomVersionId || product.bomVersions[0]?.id;
            const activeVer =
              product.bomVersions.find((v) => v.id === activeVerId) || product.bomVersions[0];
            const items: BOMItem[] = activeVer ? activeVer.items : [];

            const requiredOutput = product.requiredOutput || 100;
            const mrp = product.sellingPrice || 0;
            const totalRevenue = requiredOutput * mrp;

            // Calculate material costs for this product
            let totalUnitMaterialCost = 0;
            let pendingRatesCount = 0;

            items.forEach((it) => {
              const mat = matMap.get(it.rawMaterialId);
              const rate = mat ? mat.currentRate : 0;
              if (!rate || rate <= 0) {
                pendingRatesCount++;
              }
              const wastageMult = 1 + (it.wastagePercentage || 0) / 100;
              totalUnitMaterialCost += it.quantityPerUnit * wastageMult * (rate || 0);
            });

            const totalBatchMaterialCost = totalUnitMaterialCost * requiredOutput;
            const unitMargin = mrp - totalUnitMaterialCost;
            const marginPercentage = mrp > 0 ? (unitMargin / mrp) * 100 : 0;

            const inlineForm = inlineAddStates[product.id] || {
              name: '',
              qty: 1,
              rate: '',
              uom: 'pcs',
            };

            return (
              <div
                key={product.id}
                id={`product-card-${product.id}`}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all"
              >
                {/* Product Header Row */}
                <div className="p-5 border-b border-slate-200 bg-slate-50/70">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Left: Product Name, SKU, and Expand Button */}
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleProductExpand(product.id)}
                        className="p-1.5 mt-0.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
                        title={isExpanded ? 'Collapse raw materials' : 'Expand raw materials'}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>

                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          {editingField?.productId === product.id &&
                          editingField.field === 'name' ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editingField.value}
                                onChange={(e) =>
                                  setEditingField({ ...editingField, value: e.target.value })
                                }
                                autoFocus
                                className="px-2 py-0.5 text-base font-bold text-slate-900 border border-indigo-400 rounded bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                              <button
                                onClick={() => {
                                  if (editingField.value.trim()) {
                                    updateProduct(product.id, { name: editingField.value.trim() });
                                  }
                                  setEditingField(null);
                                }}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <h2
                              onClick={() =>
                                setEditingField({
                                  productId: product.id,
                                  field: 'name',
                                  value: product.name,
                                })
                              }
                              className="text-lg font-bold text-slate-900 hover:text-indigo-600 cursor-pointer flex items-center gap-1.5 group"
                              title="Click to edit product name"
                            >
                              <span>{product.name}</span>
                              <Edit3 className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </h2>
                          )}

                          <span className="px-2 py-0.5 text-xs font-mono font-medium bg-slate-200 text-slate-700 rounded">
                            {product.sku}
                          </span>

                          <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                            {items.length} Raw Materials
                          </span>

                          {pendingRatesCount > 0 ? (
                            <span className="px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 rounded-full flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {pendingRatesCount} {pendingRatesCount === 1 ? 'rate' : 'rates'} to fill later
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              All Rates Filled
                            </span>
                          )}
                        </div>

                        {product.description && (
                          <p className="text-xs text-slate-500 mt-1 max-w-xl">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Key Financial & Batch Parameter Inputs */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Required Output Input Box */}
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-2xs">
                        <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
                          {easyLanguageMode ? 'Required Output:' : 'Batch Output:'}
                        </span>
                        <input
                          type="number"
                          min="1"
                          value={
                            editingField?.productId === product.id &&
                            editingField.field === 'output'
                              ? editingField.value
                              : requiredOutput
                          }
                          onFocus={() =>
                            setEditingField({
                              productId: product.id,
                              field: 'output',
                              value: String(requiredOutput),
                            })
                          }
                          onChange={(e) =>
                            setEditingField({
                              productId: product.id,
                              field: 'output',
                              value: e.target.value,
                            })
                          }
                          onBlur={() => {
                            if (editingField?.field === 'output') {
                              const val = parseInt(editingField.value, 10);
                              updateProductOutputAndMrp(
                                product.id,
                                !isNaN(val) && val > 0 ? val : 100,
                                product.sellingPrice
                              );
                              setEditingField(null);
                            }
                          }}
                          className="w-20 text-sm font-bold text-indigo-700 bg-transparent text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                        />
                        <span className="text-xs text-slate-400 font-medium">units</span>
                      </div>

                      {/* MRP of End Product Input Box */}
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-2xs">
                        <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
                          {easyLanguageMode ? 'Selling Price (MRP):' : 'End Product MRP:'}
                        </span>
                        <div className="flex items-center">
                          <span className="text-xs text-slate-400 font-semibold mr-1">
                            {currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : '$'}
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              editingField?.productId === product.id &&
                              editingField.field === 'mrp'
                                ? editingField.value
                                : mrp
                            }
                            onFocus={() =>
                              setEditingField({
                                productId: product.id,
                                field: 'mrp',
                                value: String(mrp),
                              })
                            }
                            onChange={(e) =>
                              setEditingField({
                                productId: product.id,
                                field: 'mrp',
                                value: e.target.value,
                              })
                            }
                            onBlur={() => {
                              if (editingField?.field === 'mrp') {
                                const val = parseFloat(editingField.value);
                                updateProductOutputAndMrp(
                                  product.id,
                                  product.requiredOutput,
                                  !isNaN(val) && val >= 0 ? val : 0
                                );
                                setEditingField(null);
                              }
                            }}
                            className="w-20 text-sm font-bold text-emerald-700 bg-transparent text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded px-1"
                          />
                        </div>
                      </div>

                      {/* Quick Actions for this Product */}
                      <div className="flex items-center gap-1 border-l border-slate-300 pl-2">
                        <button
                          onClick={() => handleOpenInPlanner(product)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Open this product in MRP Production Planner"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Are you sure you want to delete finished product "${product.name}"?`
                              )
                            ) {
                              deleteProduct(product.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete finished product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Financial Rollup Ribbon for this Product */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-200/80 text-xs">
                    <div>
                      <span className="text-slate-500 block">Total Batch Output Value:</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {formatCurrency(totalRevenue)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">Material Cost for Batch:</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {formatCurrency(totalBatchMaterialCost)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">Material Cost / Unit:</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {formatCurrency(totalUnitMaterialCost)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">Unit Gross Margin:</span>
                      {pendingRatesCount > 0 ? (
                        <span className="font-semibold text-amber-700 text-sm flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Rate Pending
                        </span>
                      ) : (
                        <span
                          className={`font-bold text-sm ${
                            unitMargin >= 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {unitMargin >= 0 ? '+' : ''}
                          {formatCurrency(unitMargin)} ({marginPercentage.toFixed(1)}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nested Raw Materials Table (Under this Product) */}
                {isExpanded && (
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800">
                          {easyLanguageMode
                            ? 'Required Raw Materials Under This Product'
                            : 'Raw Material Requirements (BOM Items)'}
                        </h4>
                        <span className="text-xs text-slate-500">
                          ({items.length} {items.length === 1 ? 'material' : 'materials'} configured)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAddBlankMaterialRows(product.id, 4)}
                          className="px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer"
                          title="Add 4 empty material rows to quickly fill names and rates later"
                        >
                          + Add 4 Blank Rows (Fill Later)
                        </button>
                      </div>
                    </div>

                    {/* The Table */}
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                            <th className="py-2.5 px-3 w-10 text-center">#</th>
                            <th className="py-2.5 px-3 min-w-[200px]">
                              {easyLanguageMode ? 'Raw Material Name' : 'Raw Material Name & Code'}
                            </th>
                            <th className="py-2.5 px-3 w-28 text-right">
                              {easyLanguageMode ? 'Qty / 1 Product' : 'Qty / Unit'}
                            </th>
                            <th className="py-2.5 px-3 w-32 text-right">
                              {easyLanguageMode
                                ? `Total Qty (${requiredOutput})`
                                : `Total for ${requiredOutput} Output`}
                            </th>
                            <th className="py-2.5 px-3 w-36 text-right">
                              {easyLanguageMode ? 'Price / Rate' : 'Price / Unit Rate'}
                            </th>
                            <th className="py-2.5 px-3 w-28 text-center">UOM</th>
                            <th className="py-2.5 px-3 w-32 text-right">Batch Line Cost</th>
                            <th className="py-2.5 px-3 w-28 text-center">Rate Status</th>
                            <th className="py-2.5 px-3 w-20 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {items.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="py-6 text-center text-slate-500 italic">
                                No raw materials added yet under {product.name}. Use the quick form
                                below or click &quot;Add 4 Blank Rows&quot; to configure materials.
                              </td>
                            </tr>
                          ) : (
                            items.map((item, idx) => {
                              const mat = matMap.get(item.rawMaterialId);
                              const rate = mat ? mat.currentRate : 0;
                              const hasFilledRate = rate > 0;
                              const totalQtyForOutput = item.quantityPerUnit * requiredOutput;
                              const lineCost = totalQtyForOutput * (rate || 0);

                              const isEditingName =
                                editingMaterial?.materialId === item.rawMaterialId &&
                                editingMaterial?.field === 'name';
                              const isEditingQty =
                                editingMaterial?.materialId === item.rawMaterialId &&
                                editingMaterial?.field === 'qty';
                              const isEditingRate =
                                editingMaterial?.materialId === item.rawMaterialId &&
                                editingMaterial?.field === 'rate';

                              return (
                                <tr
                                  key={item.id}
                                  className={`hover:bg-slate-50 transition-colors ${
                                    !hasFilledRate ? 'bg-amber-50/20' : ''
                                  }`}
                                >
                                  {/* # index */}
                                  <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                                    {idx + 1}
                                  </td>

                                  {/* Material Name & Code */}
                                  <td className="py-2.5 px-3">
                                    {isEditingName ? (
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="text"
                                          value={editingMaterial.value}
                                          onChange={(e) =>
                                            setEditingMaterial({
                                              ...editingMaterial,
                                              value: e.target.value,
                                            })
                                          }
                                          autoFocus
                                          className="px-2 py-0.5 text-xs font-semibold text-slate-900 border border-indigo-400 rounded bg-white w-full"
                                        />
                                        <button
                                          onClick={() => {
                                            if (editingMaterial.value.trim()) {
                                              updateProductMaterialItem(
                                                product.id,
                                                item.rawMaterialId,
                                                { name: editingMaterial.value.trim() }
                                              );
                                            }
                                            setEditingMaterial(null);
                                          }}
                                          className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div
                                        onClick={() =>
                                          setEditingMaterial({
                                            productId: product.id,
                                            materialId: item.rawMaterialId,
                                            field: 'name',
                                            value: mat?.name || '',
                                          })
                                        }
                                        className="cursor-pointer group flex items-center justify-between"
                                        title="Click to edit raw material name"
                                      >
                                        <div>
                                          <span className="font-semibold text-slate-900 group-hover:text-indigo-600">
                                            {mat ? mat.name : 'Unknown Raw Material'}
                                          </span>
                                          {mat?.code && (
                                            <span className="text-[10px] text-slate-400 font-mono ml-2">
                                              ({mat.code})
                                            </span>
                                          )}
                                        </div>
                                        <Edit3 className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100" />
                                      </div>
                                    )}
                                  </td>

                                  {/* Qty Per Unit */}
                                  <td className="py-2.5 px-3 text-right">
                                    {isEditingQty ? (
                                      <div className="flex items-center justify-end gap-1">
                                        <input
                                          type="number"
                                          step="any"
                                          min="0.001"
                                          value={editingMaterial.value}
                                          onChange={(e) =>
                                            setEditingMaterial({
                                              ...editingMaterial,
                                              value: e.target.value,
                                            })
                                          }
                                          autoFocus
                                          className="w-16 px-1 py-0.5 text-xs text-right border border-indigo-400 rounded bg-white font-mono"
                                        />
                                        <button
                                          onClick={() => {
                                            const val = parseFloat(editingMaterial.value);
                                            if (!isNaN(val) && val > 0) {
                                              updateProductMaterialItem(
                                                product.id,
                                                item.rawMaterialId,
                                                { quantityPerUnit: val }
                                              );
                                            }
                                            setEditingMaterial(null);
                                          }}
                                          className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <span
                                        onClick={() =>
                                          setEditingMaterial({
                                            productId: product.id,
                                            materialId: item.rawMaterialId,
                                            field: 'qty',
                                            value: String(item.quantityPerUnit),
                                          })
                                        }
                                        className="font-mono text-slate-800 cursor-pointer hover:text-indigo-600 hover:underline"
                                        title="Click to edit quantity required for 1 finished product"
                                      >
                                        {item.quantityPerUnit} {item.uom}
                                      </span>
                                    )}
                                  </td>

                                  {/* Total Qty for Required Output */}
                                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 bg-slate-50/50">
                                    {totalQtyForOutput.toLocaleString()} {item.uom}
                                  </td>

                                  {/* Price / Rate Column (Fill Later badge if pending) */}
                                  <td className="py-2.5 px-3 text-right">
                                    {isEditingRate ? (
                                      <div className="flex items-center justify-end gap-1">
                                        <input
                                          type="number"
                                          step="any"
                                          min="0"
                                          value={editingMaterial.value}
                                          onChange={(e) =>
                                            setEditingMaterial({
                                              ...editingMaterial,
                                              value: e.target.value,
                                            })
                                          }
                                          autoFocus
                                          placeholder="0.00"
                                          className="w-20 px-1 py-0.5 text-xs text-right border border-indigo-400 rounded bg-white font-mono"
                                        />
                                        <button
                                          onClick={() => {
                                            const val = parseFloat(editingMaterial.value);
                                            updateProductMaterialItem(
                                              product.id,
                                              item.rawMaterialId,
                                              { unitRate: !isNaN(val) && val >= 0 ? val : 0 }
                                            );
                                            setEditingMaterial(null);
                                          }}
                                          className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : hasFilledRate ? (
                                      <span
                                        onClick={() =>
                                          setEditingMaterial({
                                            productId: product.id,
                                            materialId: item.rawMaterialId,
                                            field: 'rate',
                                            value: String(rate),
                                          })
                                        }
                                        className="font-mono font-bold text-slate-900 cursor-pointer hover:text-indigo-600 hover:underline"
                                        title="Click to change rate"
                                      >
                                        {formatCurrency(rate)}
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() =>
                                          setEditingMaterial({
                                            productId: product.id,
                                            materialId: item.rawMaterialId,
                                            field: 'rate',
                                            value: '',
                                          })
                                        }
                                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded cursor-pointer transition-colors"
                                        title="Click to fill rate now"
                                      >
                                        <Clock className="w-3 h-3" />
                                        <span>Fill Rate</span>
                                      </button>
                                    )}
                                  </td>

                                  {/* UOM */}
                                  <td className="py-2.5 px-3 text-center">
                                    <select
                                      value={item.uom}
                                      onChange={(e) =>
                                        updateProductMaterialItem(product.id, item.rawMaterialId, {
                                          uom: e.target.value as UOM,
                                        })
                                      }
                                      className="bg-transparent border border-slate-200 hover:border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-700 cursor-pointer focus:outline-none"
                                    >
                                      {UOM_OPTIONS.map((u) => (
                                        <option key={u} value={u}>
                                          {u}
                                        </option>
                                      ))}
                                    </select>
                                  </td>

                                  {/* Batch Line Cost */}
                                  <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-800">
                                    {hasFilledRate ? (
                                      formatCurrency(lineCost)
                                    ) : (
                                      <span className="text-amber-600 italic">--</span>
                                    )}
                                  </td>

                                  {/* Rate Status */}
                                  <td className="py-2.5 px-3 text-center">
                                    {hasFilledRate ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                                        <Check className="w-2.5 h-2.5" /> Price Ready
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                                        <Clock className="w-2.5 h-2.5" /> Fill Later
                                      </span>
                                    )}
                                  </td>

                                  {/* Action */}
                                  <td className="py-2.5 px-3 text-center">
                                    <button
                                      onClick={() =>
                                        deleteProductMaterialItem(product.id, item.rawMaterialId)
                                      }
                                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                      title="Remove this raw material requirement"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Quick Inline Add Material Row (Under this Product) */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Add Another Raw Material under {product.name}:</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-5">
                          <input
                            type="text"
                            placeholder="Material Name (e.g., Milled Chassis, Battery 3500mAh...)"
                            value={inlineForm.name}
                            onChange={(e) =>
                              setInlineAddStates((prev) => ({
                                ...prev,
                                [product.id]: { ...inlineForm, name: e.target.value },
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleInlineAddMaterial(product.id);
                            }}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <input
                            type="number"
                            min="0.001"
                            step="any"
                            placeholder="Qty / unit (1)"
                            value={inlineForm.qty || ''}
                            onChange={(e) =>
                              setInlineAddStates((prev) => ({
                                ...prev,
                                [product.id]: {
                                  ...inlineForm,
                                  qty: parseFloat(e.target.value) || 1,
                                },
                              }))
                            }
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Rate (or fill later)"
                            value={inlineForm.rate}
                            onChange={(e) =>
                              setInlineAddStates((prev) => ({
                                ...prev,
                                [product.id]: { ...inlineForm, rate: e.target.value },
                              }))
                            }
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            title="Enter price/rate or leave blank to fill later"
                          />
                        </div>

                        <div className="sm:col-span-1">
                          <select
                            value={inlineForm.uom}
                            onChange={(e) =>
                              setInlineAddStates((prev) => ({
                                ...prev,
                                [product.id]: { ...inlineForm, uom: e.target.value as UOM },
                              }))
                            }
                            className="w-full px-1.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none"
                          >
                            {UOM_OPTIONS.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <button
                            onClick={() => handleInlineAddMaterial(product.id)}
                            disabled={!inlineForm.name.trim()}
                            className={`w-full py-1.5 text-xs font-semibold rounded-md transition-colors ${
                              inlineForm.name.trim()
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            + Add Material
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Add New Finished Product */}
      {isAddProductModalOpen && (
        <AddProductModal
          onClose={() => setIsAddProductModalOpen(false)}
          onSubmit={(data) => {
            createProductWithRawMaterials(data);
            setIsAddProductModalOpen(false);
          }}
          currency={currency}
          easyLanguageMode={easyLanguageMode}
        />
      )}

      {/* MODAL 2: Upload Excel / CSV Spreadsheet */}
      {isUploadModalOpen && (
        <UploadSpreadsheetModal
          onClose={() => setIsUploadModalOpen(false)}
          onImport={(rows, mode) => {
            const res = bulkImportProductsWithMaterials(rows, mode);
            setIsUploadModalOpen(false);
            alert(
              `Successfully imported ${res.productsAdded} finished products with ${res.materialsAdded} raw material requirements!`
            );
          }}
          onDownloadTemplate={downloadProductMaterialTemplateExcel}
          easyLanguageMode={easyLanguageMode}
        />
      )}

      {/* MODAL 3: Paste Data from Clipboard */}
      {isPasteModalOpen && (
        <PasteDataModal
          onClose={() => setIsPasteModalOpen(false)}
          onImport={(rows, mode) => {
            const res = bulkImportProductsWithMaterials(rows, mode);
            setIsPasteModalOpen(false);
            alert(
              `Successfully pasted and created ${res.productsAdded} finished products with ${res.materialsAdded} raw material requirements!`
            );
          }}
          easyLanguageMode={easyLanguageMode}
        />
      )}
    </div>
  );
};

/* =========================================================================
   SUB-COMPONENT: AddProductModal
   ========================================================================= */
interface AddProductModalProps {
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    sku?: string;
    requiredOutput: number;
    mrp: number;
    materials: Array<{
      name: string;
      quantityPerUnit: number;
      unitRate?: number;
      uom: UOM;
    }>;
  }) => void;
  currency: string;
  easyLanguageMode: boolean;
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  onClose,
  onSubmit,
  currency,
  easyLanguageMode,
}) => {
  const [productName, setProductName] = useState('');
  const [productSku, setProductSku] = useState(
    `SKU-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [requiredOutput, setRequiredOutput] = useState<number>(500);
  const [mrp, setMrp] = useState<string>('120.00');

  // Initial 4-5 material requirement lines
  const [materials, setMaterials] = useState<
    Array<{ id: string; name: string; qty: number; rate: string; uom: UOM }>
  >([
    { id: '1', name: 'Raw Material 1', qty: 1, rate: '15.00', uom: 'pcs' },
    { id: '2', name: 'Raw Material 2', qty: 2, rate: '4.50', uom: 'pcs' },
    { id: '3', name: 'Raw Material 3', qty: 1, rate: '', uom: 'pcs' }, // rate to fill later
    { id: '4', name: 'Raw Material 4', qty: 1, rate: '', uom: 'pcs' }, // rate to fill later
  ]);

  const addMaterialRow = () => {
    setMaterials((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: `Raw Material ${prev.length + 1}`,
        qty: 1,
        rate: '',
        uom: 'pcs',
      },
    ]);
  };

  const removeMaterialRow = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;

    const mrpNum = parseFloat(mrp);
    onSubmit({
      name: productName.trim(),
      sku: productSku.trim(),
      requiredOutput: requiredOutput > 0 ? requiredOutput : 100,
      mrp: !isNaN(mrpNum) && mrpNum >= 0 ? mrpNum : 0,
      materials: materials
        .filter((m) => m.name.trim().length > 0)
        .map((m) => ({
          name: m.name.trim(),
          quantityPerUnit: m.qty > 0 ? m.qty : 1,
          unitRate: m.rate !== '' ? parseFloat(m.rate) || 0 : 0,
          uom: m.uom,
        })),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {easyLanguageMode ? 'Create New Finished Product' : 'Add Finished Product & Material Requirements'}
              </h3>
              <p className="text-xs text-slate-500">
                Specify Required Output, MRP, and 4–5 nested raw materials with rates to fill now or later.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Finished Product Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Smart Solar Inverter 5kW"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product SKU / Code</label>
              <input
                type="text"
                placeholder="e.g., SKU-SOLAR-001"
                value={productSku}
                onChange={(e) => setProductSku(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {easyLanguageMode ? 'How many units to make (Required Output) *' : 'Target Required Output (Batch Size) *'}
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  min="1"
                  required
                  value={requiredOutput}
                  onChange={(e) => setRequiredOutput(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 text-xs font-bold text-indigo-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="ml-2 text-slate-500 font-medium">units</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {easyLanguageMode ? 'Selling Price (MRP) *' : 'MRP of End Product *'}
              </label>
              <div className="flex items-center">
                <span className="mr-1.5 font-bold text-slate-500">
                  {currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : '$'}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold text-emerald-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Nested Raw Materials under Product */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-bold text-slate-800 text-xs">
                  Raw Materials Required Under This Product (4–5 items):
                </span>
                <p className="text-[11px] text-slate-500">
                  Leave Rate blank or 0 to fill it later when you receive quotes.
                </p>
              </div>
              <button
                type="button"
                onClick={addMaterialRow}
                className="px-2 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200"
              >
                + Add Material Row
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {materials.map((mat, index) => (
                <div
                  key={mat.id}
                  className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg"
                >
                  <span className="w-5 text-center text-slate-400 font-mono font-bold">
                    {index + 1}
                  </span>

                  <input
                    type="text"
                    placeholder="Material Name"
                    value={mat.name}
                    onChange={(e) =>
                      setMaterials((prev) =>
                        prev.map((m) => (m.id === mat.id ? { ...m, name: e.target.value } : m))
                      )
                    }
                    className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />

                  <div className="w-20">
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      placeholder="Qty"
                      value={mat.qty}
                      onChange={(e) =>
                        setMaterials((prev) =>
                          prev.map((m) =>
                            m.id === mat.id
                              ? { ...m, qty: parseFloat(e.target.value) || 1 }
                              : m
                          )
                        )
                      }
                      className="w-full px-2 py-1.5 text-xs text-right border border-slate-300 rounded focus:outline-none font-mono"
                      title="Quantity needed for 1 finished product"
                    />
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Fill Later"
                      value={mat.rate}
                      onChange={(e) =>
                        setMaterials((prev) =>
                          prev.map((m) => (m.id === mat.id ? { ...m, rate: e.target.value } : m))
                        )
                      }
                      className={`w-full px-2 py-1.5 text-xs text-right border rounded focus:outline-none font-mono ${
                        mat.rate === ''
                          ? 'border-amber-300 bg-amber-50/40 text-amber-900 placeholder:text-amber-600'
                          : 'border-slate-300'
                      }`}
                      title="Rate per unit (leave blank to fill later)"
                    />
                  </div>

                  <select
                    value={mat.uom}
                    onChange={(e) =>
                      setMaterials((prev) =>
                        prev.map((m) =>
                          m.id === mat.id ? { ...m, uom: e.target.value as UOM } : m
                        )
                      )
                    }
                    className="w-16 px-1.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none"
                  >
                    {UOM_OPTIONS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => removeMaterialRow(mat.id)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!productName.trim()}
              className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors"
            >
              Create Product & Requirements
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* =========================================================================
   SUB-COMPONENT: UploadSpreadsheetModal
   ========================================================================= */
interface UploadSpreadsheetModalProps {
  onClose: () => void;
  onImport: (
    rows: Array<{
      productName: string;
      requiredOutput?: number;
      mrp?: number;
      materialName: string;
      quantity: number;
      price?: number;
      uom?: string;
    }>,
    mode: 'append' | 'replace'
  ) => void;
  onDownloadTemplate: () => void;
  easyLanguageMode: boolean;
}

const UploadSpreadsheetModal: React.FC<UploadSpreadsheetModalProps> = ({
  onClose,
  onImport,
  onDownloadTemplate,
  easyLanguageMode,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<
    Array<{
      productName: string;
      requiredOutput: number;
      mrp: number;
      materialName: string;
      quantity: number;
      price: number;
      uom: string;
    }>
  >([]);
  const [fileName, setFileName] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawJson: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rawJson.length < 2) {
          setErrorMsg('Uploaded file is empty or missing headers.');
          return;
        }

        // Detect column indices
        const headers = rawJson[0].map((h: any) => String(h || '').toLowerCase().trim());
        let prodCol = -1;
        let outputCol = -1;
        let mrpCol = -1;
        let matCol = -1;
        let qtyCol = -1;
        let priceCol = -1;
        let uomCol = -1;

        headers.forEach((h, idx) => {
          if (h.includes('product') || h.includes('fg') || h.includes('assembly')) prodCol = idx;
          else if (h.includes('output') || h.includes('batch') || h.includes('target')) outputCol = idx;
          else if (h.includes('mrp') || h.includes('selling') || (h.includes('price') && !h.includes('material') && !h.includes('unit'))) mrpCol = idx;
          else if (h.includes('material') || h.includes('component') || h.includes('raw')) matCol = idx;
          else if (h.includes('qty') || h.includes('quantity')) qtyCol = idx;
          else if (h.includes('rate') || h.includes('cost') || h.includes('price')) priceCol = idx;
          else if (h.includes('uom') || h.includes('unit')) uomCol = idx;
        });

        // Fallbacks if header names differ
        if (prodCol === -1) prodCol = 0;
        if (outputCol === -1) outputCol = 1;
        if (mrpCol === -1) mrpCol = 2;
        if (matCol === -1) matCol = 3;
        if (qtyCol === -1) qtyCol = 4;
        if (priceCol === -1) priceCol = 5;
        if (uomCol === -1) uomCol = 6;

        const results: Array<{
          productName: string;
          requiredOutput: number;
          mrp: number;
          materialName: string;
          quantity: number;
          price: number;
          uom: string;
        }> = [];

        let currentProd = 'Finished Product 1';
        let currentOut = 500;
        let currentMrp = 100;

        for (let i = 1; i < rawJson.length; i++) {
          const row = rawJson[i];
          if (!row || row.length === 0) continue;

          const pRaw = String(row[prodCol] || '').trim();
          if (pRaw) currentProd = pRaw;

          const outRaw = parseFloat(row[outputCol]);
          if (!isNaN(outRaw) && outRaw > 0) currentOut = outRaw;

          const mrpRaw = parseFloat(row[mrpCol]);
          if (!isNaN(mrpRaw) && mrpRaw >= 0) currentMrp = mrpRaw;

          const mName = String(row[matCol] || '').trim();
          if (!mName) continue; // skip blank rows

          const qty = parseFloat(row[qtyCol]) || 1;
          const price = parseFloat(row[priceCol]) || 0;
          const uom = String(row[uomCol] || 'pcs').trim().toLowerCase();

          results.push({
            productName: currentProd,
            requiredOutput: currentOut,
            mrp: currentMrp,
            materialName: mName,
            quantity: qty > 0 ? qty : 1,
            price: price >= 0 ? price : 0,
            uom: uom || 'pcs',
          });
        }

        if (results.length === 0) {
          setErrorMsg('Could not find any material rows. Please check format against the template.');
        } else {
          setParsedRows(results);
        }
      } catch (err: any) {
        setErrorMsg(`Failed to parse file: ${err?.message || 'Unknown error'}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {easyLanguageMode ? 'Upload Products & Raw Materials Spreadsheet' : 'Import Products & Material Requirements (Excel / CSV)'}
              </h3>
              <p className="text-xs text-slate-500">
                Directly upload your finished products, required outputs, MRP, and 4–5 raw materials with rates.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Drag and Drop / File Input Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/30 rounded-xl p-6 text-center cursor-pointer transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">
              {fileName ? fileName : 'Click to select or drop an Excel (.xlsx, .xls) or CSV file'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports master-detail grouping (1 product with 4–5 nested materials per product).
            </p>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-slate-700 font-medium">Need the exact column structure?</span>
            </div>
            <button
              onClick={onDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-md transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Download Sample Template</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  Preview: Found {parsedRows.length} Material Rows across finished products
                </span>

                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-medium">Mode:</span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                    />
                    <span>Append to existing</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                    />
                    <span className="text-rose-700 font-medium">Replace all</span>
                  </label>
                </div>
              </div>

              <div className="overflow-x-auto max-h-56 border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2">Product Name</th>
                      <th className="p-2 text-right">Output</th>
                      <th className="p-2 text-right">MRP</th>
                      <th className="p-2">Material Name</th>
                      <th className="p-2 text-right">Qty / Unit</th>
                      <th className="p-2 text-right">Price / Rate</th>
                      <th className="p-2 text-center">UOM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {parsedRows.slice(0, 15).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 font-semibold text-slate-800">{row.productName}</td>
                        <td className="p-2 text-right font-mono">{row.requiredOutput}</td>
                        <td className="p-2 text-right font-mono">{row.mrp.toFixed(2)}</td>
                        <td className="p-2 text-slate-900">{row.materialName}</td>
                        <td className="p-2 text-right font-mono">{row.quantity}</td>
                        <td className="p-2 text-right font-mono">
                          {row.price > 0 ? (
                            row.price.toFixed(2)
                          ) : (
                            <span className="text-amber-700 font-semibold bg-amber-50 px-1 py-0.5 rounded text-[10px]">
                              Fill Later
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-center">{row.uom}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 15 && (
                <p className="text-[11px] text-slate-500 italic">
                  Showing first 15 rows of {parsedRows.length} total rows...
                </p>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() => onImport(parsedRows, importMode)}
            disabled={parsedRows.length === 0}
            className={`px-5 py-2 text-xs font-semibold rounded-lg shadow-sm transition-colors ${
              parsedRows.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Import {parsedRows.length} Material Requirements
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   SUB-COMPONENT: PasteDataModal
   ========================================================================= */
interface PasteDataModalProps {
  onClose: () => void;
  onImport: (
    rows: Array<{
      productName: string;
      requiredOutput?: number;
      mrp?: number;
      materialName: string;
      quantity: number;
      price?: number;
      uom?: string;
    }>,
    mode: 'append' | 'replace'
  ) => void;
  easyLanguageMode: boolean;
}

const PasteDataModal: React.FC<PasteDataModalProps> = ({
  onClose,
  onImport,
  easyLanguageMode,
}) => {
  const [pasteText, setPasteText] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  const parsedRows = useMemo(() => {
    if (!pasteText.trim()) return [];

    const lines = pasteText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const results: Array<{
      productName: string;
      requiredOutput: number;
      mrp: number;
      materialName: string;
      quantity: number;
      price: number;
      uom: string;
    }> = [];

    let curProduct = 'Finished Product';
    let curOutput = 500;
    let curMrp = 100;

    lines.forEach((line, idx) => {
      // Skip header if line looks like header
      if (idx === 0 && (line.toLowerCase().includes('product') || line.toLowerCase().includes('material'))) {
        return;
      }

      // Delimit by tab or comma
      const cols = line.includes('\t') ? line.split('\t') : line.split(',');
      if (cols.length < 2) return;

      const pName = (cols[0] || '').trim();
      if (pName) curProduct = pName;

      const out = parseFloat(cols[1]);
      if (!isNaN(out) && out > 0) curOutput = out;

      const m = parseFloat(cols[2]);
      if (!isNaN(m) && m >= 0) curMrp = m;

      const matName = (cols[3] || '').trim();
      if (!matName) return;

      const qty = parseFloat(cols[4]) || 1;
      const price = parseFloat(cols[5]) || 0;
      const uom = (cols[6] || 'pcs').trim();

      results.push({
        productName: curProduct,
        requiredOutput: curOutput,
        mrp: curMrp,
        materialName: matName,
        quantity: qty > 0 ? qty : 1,
        price: price >= 0 ? price : 0,
        uom: uom || 'pcs',
      });
    });

    return results;
  }, [pasteText]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {easyLanguageMode ? 'Paste Data From Excel or Sheets' : 'Paste Tab/Comma-Delimited Data'}
              </h3>
              <p className="text-xs text-slate-500">
                Copy cells from Excel or Google Sheets and paste them directly below.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            ✕
          </button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto flex-1 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 font-mono text-[11px]">
            Expected order: Product Name | Required Output | MRP | Material Name | Qty | Rate | UOM
          </div>

          <textarea
            rows={8}
            placeholder={`Example:
Solar Inverter 5kW\t200\t450.00\tAluminum Heatsink Casing\t1\t38.50\tpcs
Solar Inverter 5kW\t200\t450.00\tIGBT Power Module 1200V\t4\t22.00\tpcs
Solar Inverter 5kW\t200\t450.00\tControl Board PCB\t1\t65.00\tpcs
Solar Inverter 5kW\t200\t450.00\tCopper Inductor\t2\t\tpcs
Solar Inverter 5kW\t200\t450.00\tWeatherproof Gasket\t1\t\tpcs`}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />

          {parsedRows.length > 0 && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
              <span className="font-semibold">
                ✓ Successfully recognized {parsedRows.length} material lines!
              </span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() => onImport(parsedRows, importMode)}
            disabled={parsedRows.length === 0}
            className={`px-5 py-2 text-xs font-semibold rounded-lg shadow-sm transition-colors ${
              parsedRows.length > 0
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Apply & Import {parsedRows.length} Rows
          </button>
        </div>
      </div>
    </div>
  );
};

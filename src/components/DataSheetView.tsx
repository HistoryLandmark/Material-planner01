import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  DataSheetRow,
  MaterialCategory,
  UOM,
} from '../types';
import {
  formatCurrency,
  formatQty,
  SUPPORTED_CURRENCIES,
} from '../utils/calculations';
import {
  Plus,
  Trash2,
  Copy,
  FileSpreadsheet,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  DollarSign,
  Package,
  Boxes,
  TrendingUp,
  X,
  ExternalLink,
  Edit3,
  Sliders,
  BookOpen,
  Lightbulb,
} from 'lucide-react';
import { RowDetailEditModal } from './RowDetailEditModal';
import { getTerm } from '../utils/easyLanguage';

const CATEGORIES: MaterialCategory[] = [
  'Electronics',
  'Metals & Hardware',
  'Plastics & Polymers',
  'Chemicals & Adhesives',
  'Packaging',
  'Assemblies & Modules',
  'Fasteners',
];

const UOMS: UOM[] = ['pcs', 'kg', 'g', 'm', 'mm', 'l', 'ml', 'set', 'roll', 'sheet'];

export const DataSheetView: React.FC = () => {
  const {
    products,
    selectedProductId,
    plannedQuantity,
    setPlannedQuantity,
    currency,
    setCurrency,
    dataSheetRows,
    addDataSheetRow,
    updateDataSheetRow,
    deleteDataSheetRow,
    bulkUpdateDataSheet,
    updateActiveProductInfo,
    clearAllData,
    loadSampleData,
    setActiveTab,
    currentCalculation,
    easyLanguageMode,
    setEasyLanguageMode,
    openRephraseModalWithTerm,
    setIsRephraseModalOpen,
  } = useApp();

  const activeProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Editable header state
  const [productName, setProductName] = useState(activeProduct?.name || 'Finished Product');
  const [productSku, setProductSku] = useState(activeProduct?.sku || 'SKU-001');
  const [selectedRowForFullEdit, setSelectedRowForFullEdit] = useState<DataSheetRow | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [pasteMode, setPasteMode] = useState<'replace' | 'append'>('replace');
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger toast
  const notify = (msg: string) => {
    setShowSuccessToast(msg);
    setTimeout(() => setShowSuccessToast(null), 3000);
  };

  // Sync header inputs when activeProduct changes
  React.useEffect(() => {
    if (activeProduct) {
      setProductName(activeProduct.name);
      setProductSku(activeProduct.sku);
    }
  }, [activeProduct]);

  // Handle product info change
  const handleProductInfoBlur = () => {
    updateActiveProductInfo(productName, productSku);
    notify('Product details updated and synced!');
  };

  // Duplicate a row
  const handleDuplicateRow = (row: DataSheetRow) => {
    addDataSheetRow({
      ...row,
      code: `${row.code}-COPY`,
      name: `${row.name} (Copy)`,
    });
    notify(`Duplicated ${row.name}`);
  };

  // Parse clipboard / pasted text (tab-delimited or comma-delimited)
  const handleApplyPastedData = () => {
    if (!pasteContent.trim()) return;

    const lines = pasteContent.trim().split(/\r?\n/);
    const parsedRows: DataSheetRow[] = [];

    // Check if first row is header
    const firstLineLower = lines[0].toLowerCase();
    const hasHeader =
      firstLineLower.includes('code') ||
      firstLineLower.includes('name') ||
      firstLineLower.includes('material') ||
      firstLineLower.includes('qty');

    const dataLines = hasHeader ? lines.slice(1) : lines;

    dataLines.forEach((line, index) => {
      // Split by tab if available, else comma
      const separator = line.includes('\t') ? '\t' : ',';
      const cols = line.split(separator).map((c) => c.trim().replace(/^["']|["']$/g, ''));

      if (cols.length === 0 || !cols[0]) return;

      const code = cols[0] || `RM-${String(index + 1).padStart(3, '0')}`;
      const name = cols[1] || `Component ${index + 1}`;
      const catCandidate = cols[2];
      const category: MaterialCategory = CATEGORIES.includes(catCandidate as MaterialCategory)
        ? (catCandidate as MaterialCategory)
        : 'Metals & Hardware';
      const uomCandidate = cols[3];
      const uom: UOM = UOMS.includes(uomCandidate as UOM) ? (uomCandidate as UOM) : 'pcs';
      const bomQuantityPerUnit = parseFloat(cols[4]) || 1;
      const wastagePercentage = parseFloat(cols[5]) || 0;
      const unitRate = parseFloat(cols[6]) || 0;
      const onHandStock = parseFloat(cols[7]) || 0;
      const allocatedStock = parseFloat(cols[8]) || 0;
      const minBufferStock = parseFloat(cols[9]) || 0;
      const supplierName = cols[10] || 'Preferred Vendor';
      const leadTimeDays = parseInt(cols[11], 10) || 7;

      parsedRows.push({
        id: `rm-${Date.now()}-${index}`,
        code,
        name,
        category,
        uom,
        bomQuantityPerUnit,
        wastagePercentage,
        unitRate,
        onHandStock,
        allocatedStock,
        minBufferStock,
        supplierName,
        leadTimeDays,
      });
    });

    if (parsedRows.length === 0) {
      alert('Could not parse valid rows. Please check format.');
      return;
    }

    if (pasteMode === 'replace') {
      bulkUpdateDataSheet(parsedRows, productName, productSku, plannedQuantity);
    } else {
      parsedRows.forEach((r) => addDataSheetRow(r));
    }

    setShowPasteModal(false);
    setPasteContent('');
    notify(`Successfully loaded ${parsedRows.length} materials into sheet!`);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Item Code',
      'Material Name',
      'Category',
      'UOM',
      'BOM Qty / Unit',
      'Wastage %',
      `Unit Rate (${currency.code})`,
      'On-Hand Stock',
      'Allocated Stock',
      'Min Buffer Stock',
      'Supplier',
      'Lead Time (Days)',
      'Gross Req',
      'Available Stock',
      'Net Shortage',
      'Total Spend',
    ];

    const csvLines = [headers.join(',')];

    dataSheetRows.forEach((row) => {
      const gross = plannedQuantity * row.bomQuantityPerUnit * (1 + row.wastagePercentage / 100);
      const available = Math.max(0, row.onHandStock - row.allocatedStock);
      const net = Math.max(0, gross - available);
      const spend = gross * row.unitRate;

      const line = [
        `"${row.code}"`,
        `"${row.name}"`,
        `"${row.category}"`,
        `"${row.uom}"`,
        row.bomQuantityPerUnit,
        row.wastagePercentage,
        row.unitRate,
        row.onHandStock,
        row.allocatedStock,
        row.minBufferStock,
        `"${row.supplierName}"`,
        row.leadTimeDays,
        gross.toFixed(2),
        available.toFixed(2),
        net.toFixed(2),
        spend.toFixed(2),
      ];
      csvLines.push(line.join(','));
    });

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${productSku}_BOM_DataSheet.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import CSV from file
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        setPasteContent(text);
        setShowPasteModal(true);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Calculated batch metrics for live summary
  const totalSpend = dataSheetRows.reduce((acc, row) => {
    const gross = plannedQuantity * row.bomQuantityPerUnit * (1 + row.wastagePercentage / 100);
    return acc + gross * row.unitRate;
  }, 0);

  const costPerFinishedUnit = plannedQuantity > 0 ? totalSpend / plannedQuantity : 0;

  const totalInventoryValuation = dataSheetRows.reduce((acc, row) => {
    return acc + row.onHandStock * row.unitRate;
  }, 0);

  const shortageItemsCount = dataSheetRows.filter((row) => {
    const gross = plannedQuantity * row.bomQuantityPerUnit * (1 + row.wastagePercentage / 100);
    const available = row.onHandStock - row.allocatedStock;
    return gross > available;
  }).length;

  return (
    <div className="space-y-5 pb-16">
      {/* Toast Notification */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{showSuccessToast}</span>
        </div>
      )}

      {/* Main Top Header: Purpose & Sync Status */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                Material Data Entry &amp; BOM Sheet
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Synced to Dashboard</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5 max-w-3xl">
              Fill in your raw materials, BOM ratios per unit, scrap allowances, unit rates, and current warehouse stock below.
              Every cell change updates the core MRP formulas instantly and reflects across the Dashboard KPIs and charts.
            </p>
          </div>

          {/* Quick Action Navigation & Language Modes */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            <button
              onClick={() => setEasyLanguageMode(!easyLanguageMode)}
              title="Toggle between technical MRP terminology and simplified, plain-English everyday terms"
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                easyLanguageMode
                  ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
              }`}
            >
              <Lightbulb className={`w-3.5 h-3.5 ${easyLanguageMode ? 'text-amber-600' : 'text-slate-500'}`} />
              <span>{easyLanguageMode ? 'Easy Words: ON' : 'Simplify Language'}</span>
            </button>

            <button
              onClick={() => setIsRephraseModalOpen(true)}
              title="Open Plain English Explainer & Rephrase Assistant"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Explain Numbers</span>
            </button>

            <button
              onClick={() => setActiveTab('product-material-list')}
              title="Open the nested Product & Material List with 4-5 materials per product, required output, and MRP"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition shadow-xs cursor-pointer"
            >
              <Boxes className="w-3.5 h-3.5 text-indigo-400" />
              <span>Product & Material List</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-xs"
            >
              <span>View On Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Configuration Bar: Product Name, SKU, Batch Qty, Currency Selector */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Target Product Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Finished Good Name
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              onBlur={handleProductInfoBlur}
              placeholder="e.g. Industrial Drone X1"
              className="w-full px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Product SKU */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Product SKU / Code
            </label>
            <input
              type="text"
              value={productSku}
              onChange={(e) => setProductSku(e.target.value)}
              onBlur={handleProductInfoBlur}
              placeholder="e.g. SKU-DRONE-01"
              className="w-full px-3 py-1.5 text-xs font-mono font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Planned Batch Production Quantity */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Planned Production Batch
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                value={plannedQuantity}
                onChange={(e) => setPlannedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 px-3 py-1.5 text-xs font-mono-num font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-500 font-medium">units</span>
              <div className="flex gap-1 ml-auto">
                {[100, 500, 1000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setPlannedQuantity(preset)}
                    className={`px-1.5 py-1 text-[10px] font-mono-num rounded-lg border ${
                      plannedQuantity === preset
                        ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Currency Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Active Currency
            </label>
            <div className="relative">
              <select
                value={currency.code}
                onChange={(e) => {
                  const selected = SUPPORTED_CURRENCIES.find((c) => c.code === e.target.value);
                  if (selected) {
                    setCurrency(selected);
                    notify(`Currency switched to ${selected.name}`);
                  }
                }}
                className="w-full px-3 py-1.5 text-xs font-semibold text-slate-900 bg-indigo-50/70 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} &nbsp;—&nbsp; {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Spreadsheet Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Add Row button */}
          <button
            onClick={() => addDataSheetRow()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Component Row</span>
          </button>

          {/* Add 5 Rows button */}
          <button
            onClick={() => {
              for (let i = 0; i < 5; i++) addDataSheetRow();
              notify('Added 5 new blank rows');
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition border border-slate-200"
          >
            <span>+5 Rows</span>
          </button>

          {/* Paste from Excel / CSV */}
          <button
            onClick={() => setShowPasteModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition border border-slate-200"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Paste from Excel / CSV</span>
          </button>

          {/* Upload CSV */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition border border-slate-200"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Upload CSV</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            accept=".csv,.tsv,.txt"
            className="hidden"
          />

          {/* Download CSV */}
          {dataSheetRows.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition border border-slate-200"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          )}
        </div>

        {/* Right tools: Load Sample Template & Clear */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadSampleData();
              notify('Loaded complete sample template data into sheet');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 transition border border-amber-200"
            title="Populate sheet with sample manufacturing data"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Load Sample Template</span>
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition border border-rose-200"
            title="Clear all rows to start fresh"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Sheet</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Clearing */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Clear all material data?</h3>
              <p className="text-xs text-slate-500 mt-1">
                This will remove all rows from this sheet and reset your workspace to clean zero-state.
                You can start fresh or load sample data anytime.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearAllData();
                  setShowClearConfirm(false);
                  notify('Sheet wiped clean. Ready for new data entry.');
                }}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Yes, Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Paste from Excel or Google Sheets
                  </h3>
                  <p className="text-xs text-slate-500">
                    Copy cells from Excel or CSV and paste below. Supports Tab or Comma delimiters.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPasteModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-800">Expected Column Order:</span>
              <div className="font-mono text-[10px] text-slate-500 mt-1 truncate">
                Code | Name | Category | UOM | BOM Qty | Scrap % | Unit Rate | On-Hand | Allocated | Min Buffer | Supplier | Lead Time
              </div>
            </div>

            <textarea
              rows={8}
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="RM-101	Chassis Frame	Metals & Hardware	pcs	1	2	45.00	150	20	50	Titan Foundry	14&#10;RM-102	Controller Board	Electronics	pcs	1	1	85.50	80	15	40	Silicon Wave	21"
              className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="pasteMode"
                    checked={pasteMode === 'replace'}
                    onChange={() => setPasteMode('replace')}
                    className="text-indigo-600"
                  />
                  <span>Replace current sheet</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="pasteMode"
                    checked={pasteMode === 'append'}
                    onChange={() => setPasteMode('append')}
                    className="text-indigo-600"
                  />
                  <span>Append to existing rows</span>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowPasteModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyPastedData}
                  disabled={!pasteContent.trim()}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs"
                >
                  Load Data Into Sheet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spreadsheet Grid Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {dataSheetRows.length === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Your Data Sheet is Empty</h3>
              <p className="text-xs text-slate-500 mt-1">
                Prefilled demo data has been cleared. Add your raw materials, quantities, unit rates, and inventory stock to see live metrics on the Dashboard.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <button
                onClick={() => addDataSheetRow()}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Component</span>
              </button>
              <button
                onClick={() => setShowPasteModal(true)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center gap-1.5"
              >
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Paste from Excel</span>
              </button>
              <button
                onClick={() => {
                  loadSampleData();
                  notify('Sample template loaded');
                }}
                className="px-4 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Load Sample Template</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[1400px]">
              {/* Table Header */}
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200 uppercase tracking-wider select-none">
                  <th className="py-3 px-2 text-center w-10 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                    #
                  </th>
                  <th className="py-3 px-3 w-32">Item Code</th>
                  <th className="py-3 px-3 w-64">Component Name</th>
                  <th className="py-3 px-2 w-36">Category</th>
                  <th className="py-3 px-2 w-20">UOM</th>
                  <th
                    onClick={() => openRephraseModalWithTerm('bomQuantityPerUnit')}
                    className="py-3 px-2 w-28 text-right bg-indigo-50/50 text-indigo-950 cursor-pointer hover:bg-indigo-100 transition-colors group/th"
                    title="Click to learn term in simple words"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{getTerm('bomQuantityPerUnit', easyLanguageMode)}</span>
                      <HelpCircle className="w-3 h-3 text-indigo-400 group-hover/th:text-indigo-700" />
                    </div>
                  </th>
                  <th
                    onClick={() => openRephraseModalWithTerm('wastagePercentage')}
                    className="py-3 px-2 w-24 text-right bg-indigo-50/50 text-indigo-950 cursor-pointer hover:bg-indigo-100 transition-colors group/th"
                    title="Click to learn term in simple words"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{getTerm('wastagePercentage', easyLanguageMode)}</span>
                      <HelpCircle className="w-3 h-3 text-indigo-400 group-hover/th:text-indigo-700" />
                    </div>
                  </th>
                  <th
                    onClick={() => openRephraseModalWithTerm('unitRate')}
                    className="py-3 px-2 w-32 text-right bg-indigo-50/50 text-indigo-950 cursor-pointer hover:bg-indigo-100 transition-colors group/th"
                    title="Click to learn term in simple words"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{getTerm('unitRate', easyLanguageMode)} ({currency.symbol})</span>
                      <HelpCircle className="w-3 h-3 text-indigo-400 group-hover/th:text-indigo-700" />
                    </div>
                  </th>
                  <th
                    onClick={() => openRephraseModalWithTerm('onHandStock')}
                    className="py-3 px-2 w-28 text-right cursor-pointer hover:bg-slate-100 transition-colors group/th"
                    title="Click to learn term in simple words"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{getTerm('onHandStock', easyLanguageMode)}</span>
                      <HelpCircle className="w-3 h-3 text-slate-400 group-hover/th:text-slate-700" />
                    </div>
                  </th>
                  <th
                    onClick={() => openRephraseModalWithTerm('allocatedStock')}
                    className="py-3 px-2 w-28 text-right cursor-pointer hover:bg-slate-100 transition-colors group/th"
                    title="Click to learn term in simple words"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{getTerm('allocatedStock', easyLanguageMode)}</span>
                      <HelpCircle className="w-3 h-3 text-slate-400 group-hover/th:text-slate-700" />
                    </div>
                  </th>
                  <th
                    onClick={() => openRephraseModalWithTerm('minBufferStock')}
                    className="py-3 px-2 w-28 text-right cursor-pointer hover:bg-slate-100 transition-colors group/th"
                    title="Click to learn term in simple words"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{getTerm('minBufferStock', easyLanguageMode)}</span>
                      <HelpCircle className="w-3 h-3 text-slate-400 group-hover/th:text-slate-700" />
                    </div>
                  </th>
                  <th className="py-3 px-3 w-40">
                    {getTerm('supplierName', easyLanguageMode)}
                  </th>
                  <th
                    onClick={() => openRephraseModalWithTerm('leadTimeDays')}
                    className="py-3 px-2 w-24 text-center cursor-pointer hover:bg-slate-100 transition-colors group/th"
                    title="Click to learn term in simple words"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{getTerm('leadTimeDays', easyLanguageMode)}</span>
                      <HelpCircle className="w-3 h-3 text-slate-400 group-hover/th:text-slate-700" />
                    </div>
                  </th>
                  {/* Real-Time Calculated MRP Columns */}
                  <th
                    onClick={() => openRephraseModalWithTerm('grossRequirement')}
                    className="py-3 px-2.5 w-32 text-right bg-slate-100 text-slate-900 font-bold cursor-pointer hover:bg-slate-200 transition-colors group/th"
                    title="Click to learn term in simple words"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{getTerm('grossRequirement', easyLanguageMode)}</span>
                      <HelpCircle className="w-3 h-3 text-indigo-500 group-hover/th:text-indigo-800" />
                    </div>
                  </th>
                  <th
                    onClick={() => openRephraseModalWithTerm('availableStock')}
                    className="py-3 px-2.5 w-32 text-right bg-slate-100 text-slate-900 font-bold cursor-pointer hover:bg-slate-200 transition-colors group/th"
                    title="Click to learn term in simple words"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{getTerm('availableStock', easyLanguageMode)}</span>
                      <HelpCircle className="w-3 h-3 text-indigo-500 group-hover/th:text-indigo-800" />
                    </div>
                  </th>
                  <th
                    onClick={() => openRephraseModalWithTerm('netRequirement')}
                    className="py-3 px-2.5 w-32 text-right bg-slate-100 text-rose-700 font-bold cursor-pointer hover:bg-rose-100 transition-colors group/th"
                    title="Click to learn term in simple words"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{getTerm('netRequirement', easyLanguageMode)}</span>
                      <HelpCircle className="w-3 h-3 text-rose-500 group-hover/th:text-rose-800" />
                    </div>
                  </th>
                  <th
                    onClick={() => openRephraseModalWithTerm('lineTotalCost')}
                    className="py-3 px-3 w-36 text-right bg-indigo-100/70 text-indigo-950 font-bold cursor-pointer hover:bg-indigo-200 transition-colors group/th"
                    title="Click to learn term in simple words"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{getTerm('lineTotalCost', easyLanguageMode)} ({currency.symbol})</span>
                      <HelpCircle className="w-3 h-3 text-indigo-600 group-hover/th:text-indigo-900" />
                    </div>
                  </th>
                  <th className="py-3 px-2 text-center w-24">Actions</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-100 font-normal">
                {dataSheetRows.map((row, index) => {
                  const gross = plannedQuantity * row.bomQuantityPerUnit * (1 + row.wastagePercentage / 100);
                  const available = row.onHandStock - row.allocatedStock;
                  const netShortage = Math.max(0, gross - available);
                  const lineTotalCost = gross * row.unitRate;

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-indigo-50/20 transition-colors group"
                    >
                      {/* Row Index */}
                      <td className="py-2 px-2 text-center text-slate-400 font-mono text-[11px] sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-200">
                        {index + 1}
                      </td>

                      {/* Code */}
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={row.code}
                          onChange={(e) => updateDataSheetRow(row.id, { code: e.target.value })}
                          className="w-full px-2 py-1 font-mono font-medium text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded border border-transparent hover:border-slate-200 text-xs"
                        />
                      </td>

                      {/* Name */}
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => updateDataSheetRow(row.id, { name: e.target.value })}
                          className="w-full px-2 py-1 font-semibold text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded border border-transparent hover:border-slate-200 text-xs"
                        />
                      </td>

                      {/* Category */}
                      <td className="py-1.5 px-2">
                        <select
                          value={row.category}
                          onChange={(e) => updateDataSheetRow(row.id, { category: e.target.value as MaterialCategory })}
                          className="w-full px-2 py-1 text-slate-700 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded border border-transparent hover:border-slate-200 text-[11px]"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* UOM */}
                      <td className="py-1.5 px-2">
                        <select
                          value={row.uom}
                          onChange={(e) => updateDataSheetRow(row.id, { uom: e.target.value as UOM })}
                          className="w-full px-1.5 py-1 text-slate-700 font-mono bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded border border-transparent hover:border-slate-200 text-[11px]"
                        >
                          {UOMS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* BOM Quantity Per Finished Unit */}
                      <td className="py-1.5 px-2 bg-indigo-50/20">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={row.bomQuantityPerUnit}
                          onChange={(e) =>
                            updateDataSheetRow(row.id, {
                              bomQuantityPerUnit: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-2 py-1 text-right font-mono-num font-bold text-indigo-900 bg-transparent hover:bg-white focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded border border-transparent hover:border-indigo-200 text-xs"
                        />
                      </td>

                      {/* Scrap / Wastage % */}
                      <td className="py-1.5 px-2 bg-indigo-50/20">
                        <div className="flex items-center justify-end">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            max="100"
                            value={row.wastagePercentage}
                            onChange={(e) =>
                              updateDataSheetRow(row.id, {
                                wastagePercentage: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-16 px-1.5 py-1 text-right font-mono-num font-medium text-indigo-800 bg-transparent hover:bg-white focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded border border-transparent hover:border-indigo-200 text-xs"
                          />
                          <span className="text-[10px] text-indigo-500 ml-0.5">%</span>
                        </div>
                      </td>

                      {/* Material Unit Rate */}
                      <td className="py-1.5 px-2 bg-indigo-50/20">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={row.unitRate}
                          onChange={(e) =>
                            updateDataSheetRow(row.id, {
                              unitRate: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-2 py-1 text-right font-mono-num font-bold text-slate-900 bg-transparent hover:bg-white focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded border border-transparent hover:border-indigo-200 text-xs"
                        />
                      </td>

                      {/* On-Hand Stock */}
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={row.onHandStock}
                          onChange={(e) =>
                            updateDataSheetRow(row.id, {
                              onHandStock: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-2 py-1 text-right font-mono-num text-slate-700 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded border border-transparent hover:border-slate-200 text-xs"
                        />
                      </td>

                      {/* Allocated Stock */}
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={row.allocatedStock}
                          onChange={(e) =>
                            updateDataSheetRow(row.id, {
                              allocatedStock: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-2 py-1 text-right font-mono-num text-slate-600 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded border border-transparent hover:border-slate-200 text-xs"
                        />
                      </td>

                      {/* Min Buffer Stock */}
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={row.minBufferStock}
                          onChange={(e) =>
                            updateDataSheetRow(row.id, {
                              minBufferStock: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-2 py-1 text-right font-mono-num text-slate-600 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded border border-transparent hover:border-slate-200 text-xs"
                        />
                      </td>

                      {/* Supplier Name */}
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={row.supplierName}
                          onChange={(e) => updateDataSheetRow(row.id, { supplierName: e.target.value })}
                          className="w-full px-2 py-1 text-slate-700 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded border border-transparent hover:border-slate-200 text-xs"
                        />
                      </td>

                      {/* Lead Time Days */}
                      <td className="py-1.5 px-2 text-center">
                        <input
                          type="number"
                          min="0"
                          value={row.leadTimeDays}
                          onChange={(e) =>
                            updateDataSheetRow(row.id, {
                              leadTimeDays: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="w-16 px-1 py-1 text-center font-mono-num text-slate-700 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded border border-transparent hover:border-slate-200 text-xs mx-auto"
                        />
                      </td>

                      {/* --- Auto-Calculated Columns --- */}
                      {/* Gross Requirement */}
                      <td className="py-2 px-2.5 text-right font-mono-num font-semibold text-slate-800 bg-slate-50/80">
                        {gross.toLocaleString('en-US', { maximumFractionDigits: 3 })}
                      </td>

                      {/* Available Stock */}
                      <td className="py-2 px-2.5 text-right font-mono-num font-medium text-slate-700 bg-slate-50/80">
                        {available.toLocaleString('en-US', { maximumFractionDigits: 3 })}
                      </td>

                      {/* Net Requirement / Deficit */}
                      <td className="py-2 px-2.5 text-right font-mono-num font-bold bg-slate-50/80">
                        {netShortage > 0 ? (
                          <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            {netShortage.toLocaleString('en-US', { maximumFractionDigits: 3 })}
                          </span>
                        ) : (
                          <span className="text-emerald-700">0</span>
                        )}
                      </td>

                      {/* Line Cost Spend */}
                      <td className="py-2 px-3 text-right font-mono-num font-bold text-indigo-900 bg-indigo-50/40">
                        {formatCurrency(lineTotalCost, currency.symbol)}
                      </td>

                      {/* Actions */}
                      <td className="py-1.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedRowForFullEdit(row)}
                            title="Edit all fields in clean detail modal"
                            className="p-1 text-indigo-600 hover:text-indigo-900 rounded hover:bg-indigo-50"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicateRow(row)}
                            title="Duplicate Row"
                            className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteDataSheetRow(row.id)}
                            title="Delete Row"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Real-time Summary Footer & Quick Reflection Link */}
      {dataSheetRows.length > 0 && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* KPI metrics row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 flex-1">
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Total Components
                </div>
                <div className="mt-1 text-xl font-bold font-mono-num text-white">
                  {dataSheetRows.length} Items
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Batch: {plannedQuantity} units
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Total Material Cost
                </div>
                <div className="mt-1 text-xl font-bold font-mono-num text-indigo-400">
                  {formatCurrency(totalSpend, currency.symbol)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Gross required spend
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Cost / Finished Good
                </div>
                <div className="mt-1 text-xl font-bold font-mono-num text-emerald-400">
                  {formatCurrency(costPerFinishedUnit, currency.symbol)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Direct unit material
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Inventory Valuation
                </div>
                <div className="mt-1 text-xl font-bold font-mono-num text-white">
                  {formatCurrency(totalInventoryValuation, currency.symbol)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {shortageItemsCount > 0 ? (
                    <span className="text-amber-400 font-semibold">
                      {shortageItemsCount} items with shortage
                    </span>
                  ) : (
                    <span className="text-emerald-400">Stock fully covers batch</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 lg:border-l lg:border-slate-800 lg:pl-6">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white transition flex items-center gap-2 shadow-sm"
              >
                <span>Check Dashboard Reflection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => addDataSheetRow()}
                className="px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                + Add Another Row
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Granular Detail Edit Modal */}
      <RowDetailEditModal
        isOpen={selectedRowForFullEdit !== null}
        onClose={() => setSelectedRowForFullEdit(null)}
        row={selectedRowForFullEdit}
        onSave={(updatedRow) => {
          updateDataSheetRow(updatedRow.id, updatedRow);
          setSelectedRowForFullEdit(null);
          notify(`Updated details for ${updatedRow.materialName || updatedRow.materialCode}`);
        }}
      />
    </div>
  );
};

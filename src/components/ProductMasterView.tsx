import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  ChevronRight,
  GitBranch,
  Trash2,
  Edit2,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { formatCurrency } from '../utils/calculations';

interface ProductMasterViewProps {
  onOpenAddProductModal: () => void;
  onEditProduct: (product: Product) => void;
}

export const ProductMasterView: React.FC<ProductMasterViewProps> = ({
  onOpenAddProductModal,
  onEditProduct,
}) => {
  const { products, deleteProduct, permissions, setSelectedProductId, setActiveTab } = useApp();
  const [search, setSearch] = useState('');

  const filteredProducts = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete product ${name}? All associated BOM versions will be removed.`)) {
      deleteProduct(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <span>Master Data</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-indigo-600 font-semibold">Product Master</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Package className="w-6 h-6 text-indigo-600" />
            <span>Finished Goods & Products Catalog</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Maintain finished product specifications, SKU identifiers, active BOM version links, and target retail prices.
          </p>
        </div>

        {permissions.canEditProducts && (
          <button
            onClick={onOpenAddProductModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Product</span>
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product SKU, model name, category..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredProducts.length} finished goods
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Product Name & Description</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-center">Active BOM Revision</th>
                <th className="py-3 px-3 text-right">Lead Time</th>
                <th className="py-3 px-3 text-right font-bold text-slate-900">Selling Price</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const activeVersion = p.bomVersions.find((v) => v.id === p.activeBomVersionId) || p.bomVersions[0];
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                        {p.sku}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 max-w-sm">
                          {p.description}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 font-medium">{p.category}</td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedProductId(p.id);
                            setActiveTab('bom-management');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                        >
                          <GitBranch className="w-3 h-3" />
                          <span>{activeVersion?.versionNumber || 'No BOM'}</span>
                          <span className="text-[10px] text-indigo-500">
                            ({activeVersion?.items.length || 0} parts)
                          </span>
                        </button>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono-num text-slate-700">
                        {p.leadTimeDays} days
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono-num font-bold text-slate-900">
                        {formatCurrency(p.sellingPrice || 0)}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Active
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedProductId(p.id);
                              setActiveTab('production-planner');
                            }}
                            className="px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          >
                            Plan Run
                          </button>
                          {permissions.canEditProducts && (
                            <>
                              <button
                                onClick={() => onEditProduct(p)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                                title="Edit Product"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(p.id, p.name)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Cpu,
  Plus,
  Search,
  ChevronRight,
  Filter,
  Edit2,
  Trash2,
  TrendingUp,
  Boxes,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RawMaterial, Supplier } from '../types';
import { formatCurrency, formatQty } from '../utils/calculations';

interface RawMaterialMasterViewProps {
  onOpenAddMaterialModal: () => void;
  onEditMaterial: (material: RawMaterial) => void;
}

export const RawMaterialMasterView: React.FC<RawMaterialMasterViewProps> = ({
  onOpenAddMaterialModal,
  onEditMaterial,
}) => {
  const { rawMaterials, suppliers, deleteRawMaterial, permissions } = useApp();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const suppliersMap = new Map<string, Supplier>(suppliers.map((s) => [s.id, s]));

  const filteredMaterials = rawMaterials.filter((m) => {
    if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q);
    }
    return true;
  });

  const categories = Array.from(new Set(rawMaterials.map((m) => m.category)));

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove raw material ${name}? Make sure it is not referenced in active BOMs.`)) {
      deleteRawMaterial(id);
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
            <span className="text-indigo-600 font-semibold">Raw Material Master</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-indigo-600" />
            <span>Raw Materials & Components Master</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Maintain item codes, engineering descriptions, standard accounting rates, and preferred supplier lead times.
          </p>
        </div>

        {permissions.canEditMaterials && (
          <button
            onClick={onOpenAddMaterialModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Raw Material</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search component code, part description..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Filter className="w-3.5 h-3.5" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
          >
            <option value="all">All Material Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Item Code</th>
                <th className="py-3 px-4">Component Name & Description</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-2">UOM</th>
                <th className="py-3 px-3 text-right">Standard Cost</th>
                <th className="py-3 px-3 text-right font-bold text-slate-900">Current Market Rate</th>
                <th className="py-3 px-3 text-right">Min Buffer</th>
                <th className="py-3 px-4">Preferred Vendor</th>
                <th className="py-3 px-3 text-right">Lead Time</th>
                <th className="py-3 px-3">Last Updated</th>
                {permissions.canEditMaterials && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    No raw materials match criteria.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((m) => {
                  const sup = suppliersMap.get(m.preferredSupplierId);
                  const rateDelta = m.currentRate - m.standardCost;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">{m.code}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{m.name}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 max-w-sm">{m.description}</div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 font-medium">{m.category}</td>
                      <td className="py-3.5 px-2 text-slate-500 font-medium">{m.uom}</td>
                      <td className="py-3.5 px-3 text-right font-mono-num text-slate-500">
                        {formatCurrency(m.standardCost)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono-num font-bold text-indigo-700">
                        {formatCurrency(m.currentRate)}
                        {Math.abs(rateDelta) > 0.001 && (
                          <div
                            className={`text-[9px] ${
                              rateDelta > 0 ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {rateDelta > 0 ? `+${formatCurrency(rateDelta)}` : formatCurrency(rateDelta)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono-num text-slate-600">
                        {formatQty(m.minBufferStock, m.uom)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium truncate max-w-[150px]">
                          {sup?.name || 'Unassigned'}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono-num text-slate-600">
                        {m.leadTimeDays}d
                      </td>
                      <td className="py-3.5 px-3 text-slate-400 font-mono text-[10px]">
                        {m.lastUpdated}
                      </td>
                      {permissions.canEditMaterials && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onEditMaterial(m)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                              title="Edit Material & Rates"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(m.id, m.name)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                              title="Delete Material"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
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

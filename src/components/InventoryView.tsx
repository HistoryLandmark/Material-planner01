import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Search,
  Filter,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  Building2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatQty, formatCurrency } from '../utils/calculations';

interface InventoryViewProps {
  onOpenStockAdjustModal?: (materialId: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ onOpenStockAdjustModal }) => {
  const { rawMaterials, inventory, permissions } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'healthy'>('all');

  const categories = useMemo(() => {
    const set = new Set<string>();
    rawMaterials.forEach((r) => set.add(r.category));
    return Array.from(set);
  }, [rawMaterials]);

  const inventoryRows = useMemo(() => {
    return rawMaterials
      .map((mat) => {
        const inv = inventory[mat.id] || {
          materialId: mat.id,
          onHandStock: 0,
          allocatedStock: 0,
          reorderLevel: mat.minBufferStock,
          warehouseLocation: 'Main Floor',
          lastStockCheck: '',
          onOrderStock: 0,
        };

        const available = Math.max(0, inv.onHandStock - inv.allocatedStock);
        const isLow = available <= inv.reorderLevel;
        const totalValuation = inv.onHandStock * mat.currentRate;

        return {
          material: mat,
          inventory: inv,
          available,
          isLow,
          totalValuation,
        };
      })
      .filter((row) => {
        if (categoryFilter !== 'all' && row.material.category !== categoryFilter) return false;
        if (statusFilter === 'low' && !row.isLow) return false;
        if (statusFilter === 'healthy' && row.isLow) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            row.material.name.toLowerCase().includes(q) ||
            row.material.code.toLowerCase().includes(q) ||
            row.inventory.warehouseLocation.toLowerCase().includes(q)
          );
        }
        return true;
      });
  }, [rawMaterials, inventory, categoryFilter, statusFilter, searchQuery]);

  const totals = useMemo(() => {
    const totalVal = inventoryRows.reduce((acc, r) => acc + r.totalValuation, 0);
    const lowCount = inventoryRows.filter((r) => r.isLow).length;
    return { totalVal, lowCount };
  }, [inventoryRows]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <span>Warehouse & Operations</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-indigo-600 font-semibold">Inventory Master</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-indigo-600" />
            <span>Raw Material Inventory & Stock Allocation</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Track physical On-Hand stock, committed production allocations, net Available stock, and warehouse bins.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Filtered Inventory Valuation</span>
          <div className="mt-1 text-2xl font-bold font-mono-num text-slate-900">
            {formatCurrency(totals.totalVal)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Across {inventoryRows.length} active inventory items
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Reorder Alert Items</span>
          <div className="mt-1 text-2xl font-bold font-mono-num text-amber-600">
            {totals.lowCount} items
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Available stock is below minimum safety buffer
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Stock Formula Rule</span>
          <div className="mt-1 text-sm font-bold font-mono-num text-indigo-600">
            Available = On Hand − Allocated
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Used directly by MRP engine to calculate Net requirements
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search material code, description, warehouse aisle..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({rawMaterials.length})
            </button>
            <button
              onClick={() => setStatusFilter('low')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === 'low'
                  ? 'bg-white text-amber-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Below Buffer
            </button>
            <button
              onClick={() => setStatusFilter('healthy')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === 'healthy'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Healthy
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Item Code</th>
                <th className="py-3 px-4">Material Description</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right font-bold text-slate-900">On-Hand</th>
                <th className="py-3 px-3 text-right text-slate-600">Allocated</th>
                <th className="py-3 px-3 text-right bg-indigo-50/50 font-bold text-indigo-950">Available</th>
                <th className="py-3 px-3 text-right">Reorder Point</th>
                <th className="py-3 px-2 text-center">Status</th>
                <th className="py-3 px-3">Warehouse Bin</th>
                <th className="py-3 px-3 text-right">Unit Rate</th>
                <th className="py-3 px-4 text-right font-bold text-slate-900">Valuation</th>
                {permissions.canAdjustStock && <th className="py-3 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventoryRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400">
                    No inventory records match the selected filter.
                  </td>
                </tr>
              ) : (
                inventoryRows.map(({ material, inventory: inv, available, isLow, totalValuation }) => (
                  <tr key={material.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">{material.code}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{material.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Last check: {inv.lastStockCheck}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{material.category}</td>
                    <td className="py-3 px-3 text-right font-mono-num font-bold text-slate-900">
                      {formatQty(inv.onHandStock, material.uom)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num text-slate-500">
                      {formatQty(inv.allocatedStock, material.uom)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num font-bold bg-indigo-50/30 text-indigo-950">
                      {formatQty(available, material.uom)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num text-slate-500">
                      {formatQty(inv.reorderLevel, material.uom)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {isLow ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Reorder
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Healthy
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-mono text-[11px]">
                      {inv.warehouseLocation}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num text-slate-600">
                      {formatCurrency(material.currentRate)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num font-bold text-slate-900">
                      {formatCurrency(totalValuation)}
                    </td>
                    {permissions.canAdjustStock && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onOpenStockAdjustModal?.(material.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          Adjust Stock
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-100/80 font-bold border-t border-slate-200 text-slate-900">
              <tr>
                <td colSpan={4} className="py-3 px-4">
                  Total Inventory Items ({inventoryRows.length} materials)
                </td>
                <td colSpan={4} className="py-3 px-2 text-center text-xs text-slate-500">
                  {totals.lowCount} items requiring supplier reorder
                </td>
                <td colSpan={2} className="py-3 px-3 text-right text-xs text-slate-500">
                  Total Valuation:
                </td>
                <td className="py-3 px-4 text-right font-mono-num text-base text-indigo-700">
                  {formatCurrency(totals.totalVal)}
                </td>
                {permissions.canAdjustStock && <td className="py-3 px-4"></td>}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

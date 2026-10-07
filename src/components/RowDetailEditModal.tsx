import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DataSheetRow, MaterialCategory, UOM } from '../types';
import { formatCurrency } from '../utils/calculations';
import { getTerm } from '../utils/easyLanguage';
import {
  X,
  Save,
  Trash2,
  Sparkles,
  Package,
  Layers,
  DollarSign,
  Truck,
  MapPin,
  FileText,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface RowDetailEditModalProps {
  row: DataSheetRow | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (rowId: string, updates: Partial<DataSheetRow & { warehouseLocation?: string; notes?: string }>) => void;
  onDelete?: (rowId: string) => void;
}

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

export const RowDetailEditModal: React.FC<RowDetailEditModalProps> = ({
  row,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const { currency, plannedQuantity, easyLanguageMode } = useApp();

  const [formData, setFormData] = useState<Partial<DataSheetRow & { warehouseLocation: string; notes: string }>>({});

  useEffect(() => {
    if (row) {
      setFormData({
        ...row,
        warehouseLocation: 'Main Warehouse — Bay A-12',
        notes: '',
      });
    }
  }, [row]);

  if (!isOpen || !row) return null;

  const gross = plannedQuantity * (formData.bomQuantityPerUnit || 0) * (1 + (formData.wastagePercentage || 0) / 100);
  const available = (formData.onHandStock || 0) - (formData.allocatedStock || 0);
  const shortage = Math.max(0, gross - available);
  const lineTotal = gross * (formData.unitRate || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (row) {
      onSave(row.id, formData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">
                  Edit Material Details &amp; Parameters
                </h3>
                <span className="font-mono text-xs text-indigo-300 bg-white/10 px-2 py-0.5 rounded-md">
                  {formData.code}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Every field below is completely customizable and recalculates live
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Calculation Preview Banner */}
        <div className="bg-indigo-50/70 border-b border-indigo-100 p-4 shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-900 opacity-60 block">
              {getTerm('grossRequirement', easyLanguageMode)}
            </span>
            <span className="text-sm font-bold font-mono text-indigo-950">
              {gross.toLocaleString('en-US', { maximumFractionDigits: 3 })} {formData.uom}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-900 opacity-60 block">
              {getTerm('availableStock', easyLanguageMode)}
            </span>
            <span className="text-sm font-bold font-mono text-indigo-950">
              {available.toLocaleString('en-US', { maximumFractionDigits: 3 })} {formData.uom}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-900 opacity-60 block">
              {getTerm('netRequirement', easyLanguageMode)}
            </span>
            <span
              className={`text-sm font-bold font-mono ${
                shortage > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {shortage > 0 ? `Missing ${shortage.toLocaleString()}` : 'Covered in Stock'}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-900 opacity-60 block">
              {getTerm('lineTotalCost', easyLanguageMode)}
            </span>
            <span className="text-sm font-bold font-mono text-indigo-950">
              {formatCurrency(lineTotal, currency.symbol)}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* General Identification */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Identity &amp; Classification</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Item Code / Part #</label>
                <input
                  type="text"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-mono font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Component / Material Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Category</label>
                <select
                  value={formData.category || 'Metals & Hardware'}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as MaterialCategory })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Unit of Measure (UOM)</label>
                <select
                  value={formData.uom || 'pcs'}
                  onChange={(e) => setFormData({ ...formData, uom: e.target.value as UOM })}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  {UOMS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {getTerm('unitRate', easyLanguageMode)} ({currency.symbol})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.unitRate ?? 0}
                  onChange={(e) => setFormData({ ...formData, unitRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 text-xs font-mono-num font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* BOM & Recipe Parameters */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>BOM Recipe &amp; Wastage Allowance</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {getTerm('bomQuantityPerUnit', easyLanguageMode)}
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.bomQuantityPerUnit ?? 1}
                  onChange={(e) =>
                    setFormData({ ...formData, bomQuantityPerUnit: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono-num font-bold bg-indigo-50/50 border border-indigo-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Amount needed per 1 finished good unit
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {getTerm('wastagePercentage', easyLanguageMode)}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    value={formData.wastagePercentage ?? 0}
                    onChange={(e) =>
                      setFormData({ ...formData, wastagePercentage: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-1.5 text-xs font-mono-num font-bold bg-indigo-50/50 border border-indigo-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 pr-7"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    %
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Additional safety cushion for cuts or damage
                </span>
              </div>
            </div>
          </div>

          {/* Warehouse & Inventory Levels */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-amber-600" />
              <span>Storage &amp; Inventory Quantities</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {getTerm('onHandStock', easyLanguageMode)}
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.onHandStock ?? 0}
                  onChange={(e) => setFormData({ ...formData, onHandStock: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 text-xs font-mono-num bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {getTerm('allocatedStock', easyLanguageMode)}
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.allocatedStock ?? 0}
                  onChange={(e) =>
                    setFormData({ ...formData, allocatedStock: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono-num bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {getTerm('minBufferStock', easyLanguageMode)}
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.minBufferStock ?? 0}
                  onChange={(e) =>
                    setFormData({ ...formData, minBufferStock: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono-num bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Supplier & Lead Times */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-purple-600" />
              <span>Procurement &amp; Vendor Information</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {getTerm('supplierName', easyLanguageMode)}
                </label>
                <input
                  type="text"
                  value={formData.supplierName || ''}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  placeholder="e.g. Apex Industrial Supplies"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {getTerm('leadTimeDays', easyLanguageMode)}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.leadTimeDays ?? 7}
                  onChange={(e) =>
                    setFormData({ ...formData, leadTimeDays: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono-num bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Storage Notes & Location */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>Warehouse Location &amp; Notes</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Bin / Location</label>
                <input
                  type="text"
                  value={formData.warehouseLocation || ''}
                  onChange={(e) => setFormData({ ...formData, warehouseLocation: e.target.value })}
                  placeholder="e.g. Rack B, Shelf 4"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Custom Notes</label>
                <input
                  type="text"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Keep dry, RoHS compliant"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete material ${row.name}?`)) {
                    onDelete(row.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Material</span>
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save All Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

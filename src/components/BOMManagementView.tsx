import React, { useState } from 'react';
import {
  GitBranch,
  Plus,
  Copy,
  CheckCircle2,
  Archive,
  FileSpreadsheet,
  Layers,
  Percent,
  Trash2,
  Calendar,
  User,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BOMItem, BOMVersion, RawMaterial } from '../types';
import { formatCurrency } from '../utils/calculations';
import { exportBOMToExcel } from '../utils/export';

interface BOMManagementViewProps {
  onOpenAddBOMItemModal?: () => void;
}

export const BOMManagementView: React.FC<BOMManagementViewProps> = ({
  onOpenAddBOMItemModal,
}) => {
  const {
    products,
    selectedProductId,
    setSelectedProductId,
    selectedBomVersionId,
    setSelectedBomVersionId,
    setActiveBOMVersion,
    cloneBOMVersion,
    addBOMVersion,
    updateBOMVersion,
    rawMaterials,
    permissions,
  } = useApp();

  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [newVersionNumber, setNewVersionNumber] = useState('');
  const [newVersionLog, setNewVersionLog] = useState('');

  const currentProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const currentVersion =
    currentProduct?.bomVersions.find((v) => v.id === selectedBomVersionId) ||
    currentProduct?.bomVersions[0];

  const rawMaterialsMap = new Map<string, RawMaterial>(rawMaterials.map((m) => [m.id, m]));

  // Calculate baseline unit cost for the current BOM
  const baselineUnitCost = (currentVersion?.items || []).reduce((acc, item) => {
    const mat = rawMaterialsMap.get(item.rawMaterialId);
    const rate = mat?.currentRate || 0;
    const wastageMult = 1 + (item.wastagePercentage || 0) / 100;
    return acc + item.quantityPerUnit * wastageMult * rate;
  }, 0);

  const handleCloneVersion = () => {
    if (!currentVersion) return;
    const nextVer = prompt(
      `Enter revision number to clone ${currentVersion.versionNumber} into:`,
      `v${(parseFloat(currentVersion.versionNumber.replace('v', '')) + 0.1).toFixed(1)}`
    );
    if (nextVer && nextVer.trim()) {
      cloneBOMVersion(currentProduct.id, currentVersion.id, nextVer.trim());
    }
  };

  const handleCreateEmptyVersion = () => {
    if (!newVersionNumber.trim()) return;
    addBOMVersion(currentProduct.id, {
      versionNumber: newVersionNumber.trim(),
      status: 'draft',
      effectiveDate: new Date().toISOString().split('T')[0],
      createdBy: 'Engineering Team',
      changeLog: newVersionLog.trim() || 'New revision initialized',
      items: [],
    });
    setIsNewVersionModalOpen(false);
    setNewVersionNumber('');
    setNewVersionLog('');
  };

  const handleExport = () => {
    if (currentProduct && currentVersion) {
      exportBOMToExcel(currentProduct, currentVersion, rawMaterials);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    if (!currentVersion) return;
    if (confirm('Remove this component from the BOM revision?')) {
      const updatedItems = currentVersion.items.filter((i) => i.id !== itemId);
      updateBOMVersion(currentProduct.id, currentVersion.id, { items: updatedItems });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <span>Engineering & Design</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-indigo-600 font-semibold">Bill of Materials Master</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <GitBranch className="w-6 h-6 text-indigo-600" />
            <span>BOM Management & Revision Control</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Maintain multi-level component trees with strict engineering change orders (ECO), scrap rates, and version lifecycle tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {permissions.canEditBOM && (
            <>
              <button
                onClick={handleCloneVersion}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Clone Version</span>
              </button>
              <button
                onClick={() => setIsNewVersionModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Revision</span>
              </button>
            </>
          )}

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export BOM</span>
          </button>
        </div>
      </div>

      {/* Product Selector & Version Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Selected Finished Product
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="text-base font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} – {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Baseline Unit Material Cost */}
          <div className="flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">Baseline Material Cost</span>
              <span className="text-xl font-bold font-mono-num text-indigo-600">
                {formatCurrency(baselineUnitCost)}
                <span className="text-xs font-normal text-slate-500"> / unit</span>
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">Total Components</span>
              <span className="text-xl font-bold font-mono-num text-slate-900">
                {currentVersion?.items.length || 0} items
              </span>
            </div>
          </div>
        </div>

        {/* Version History Tabs */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1">
              <GitBranch className="w-3.5 h-3.5" />
              Revisions:
            </span>
            {currentProduct?.bomVersions.map((v) => {
              const isSelected = v.id === currentVersion?.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedBomVersionId(v.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{v.versionNumber}</span>
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.2 rounded-full font-bold ${
                      v.status === 'active'
                        ? 'bg-emerald-500 text-white'
                        : v.status === 'draft'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-400 text-white'
                    }`}
                  >
                    {v.status}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Version Action (Make Active) */}
          {currentVersion && currentVersion.status !== 'active' && permissions.canEditBOM && (
            <button
              onClick={() => setActiveBOMVersion(currentProduct.id, currentVersion.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Set as Active Production BOM</span>
            </button>
          )}
        </div>

        {/* Active Version Metadata Callout */}
        {currentVersion && (
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Effective: <strong>{currentVersion.effectiveDate}</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Created by: <strong>{currentVersion.createdBy}</strong></span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="line-clamp-1 italic text-slate-500">
                Change Log: {currentVersion.changeLog || 'Initial validated engineering BOM'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* BOM Line Items Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Bill of Materials Components ({currentVersion?.versionNumber})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              All quantities specified per 1 finished {currentProduct?.uom || 'unit'}.
            </p>
          </div>

          {permissions.canEditBOM && (
            <button
              onClick={onOpenAddBOMItemModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Raw Material</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12">#</th>
                <th className="py-3 px-3">Item Code</th>
                <th className="py-3 px-4">Component Description</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right font-bold text-slate-900">Qty / Unit</th>
                <th className="py-3 px-2">UOM</th>
                <th className="py-3 px-3 text-right">Wastage / Scrap %</th>
                <th className="py-3 px-3 text-right">Current Rate</th>
                <th className="py-3 px-4 text-right font-bold text-slate-900">Unit Cost Contribution</th>
                <th className="py-3 px-4">Engineering Notes</th>
                {permissions.canEditBOM && <th className="py-3 px-3 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(!currentVersion?.items || currentVersion.items.length === 0) ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    No components configured for this BOM revision yet. Click "Add Raw Material" above.
                  </td>
                </tr>
              ) : (
                currentVersion.items.map((item: BOMItem, idx: number) => {
                  const mat = rawMaterialsMap.get(item.rawMaterialId);
                  const rate = mat?.currentRate || 0;
                  const wastageMult = 1 + (item.wastagePercentage || 0) / 100;
                  const lineUnitCost = item.quantityPerUnit * wastageMult * rate;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-900">
                        {mat?.code || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{mat?.name || 'Unknown Material'}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{mat?.description}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{mat?.category || 'General'}</td>
                      <td className="py-3 px-3 text-right font-mono-num font-bold text-slate-900">
                        {item.quantityPerUnit}
                      </td>
                      <td className="py-3 px-2 text-slate-500 font-medium">{item.uom}</td>
                      <td className="py-3 px-3 text-right font-mono-num text-slate-700">
                        <span className="inline-flex items-center gap-0.5 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Percent className="w-2.5 h-2.5 text-slate-400" />
                          {item.wastagePercentage}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num text-slate-600">
                        {formatCurrency(rate)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num font-bold text-indigo-600">
                        {formatCurrency(lineUnitCost)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] max-w-[200px] truncate" title={item.notes}>
                        {item.notes || '—'}
                      </td>
                      {permissions.canEditBOM && (
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove component"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-slate-100/80 font-bold border-t border-slate-200 text-slate-900">
              <tr>
                <td colSpan={4} className="py-3 px-4">
                  Total BOM Baseline ({currentVersion?.items.length || 0} component lines)
                </td>
                <td colSpan={4} className="py-3 px-3 text-right text-xs text-slate-500">
                  Total Baseline Unit Material Cost:
                </td>
                <td className="py-3 px-4 text-right font-mono-num text-base text-indigo-700">
                  {formatCurrency(baselineUnitCost)}
                </td>
                <td colSpan={2} className="py-3 px-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* New Revision Modal */}
      {isNewVersionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Create New BOM Revision</h3>
            <p className="text-xs text-slate-500">
              Initialize an empty revision for {currentProduct.name} ({currentProduct.sku}).
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Revision / Version Tag (e.g. v1.3, v2.0)
                </label>
                <input
                  type="text"
                  value={newVersionNumber}
                  onChange={(e) => setNewVersionNumber(e.target.value)}
                  placeholder="e.g. v2.0"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Engineering Change Log / Notes
                </label>
                <textarea
                  rows={3}
                  value={newVersionLog}
                  onChange={(e) => setNewVersionLog(e.target.value)}
                  placeholder="Describe reason for this engineering revision..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewVersionModalOpen(false)}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateEmptyVersion}
                disabled={!newVersionNumber.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-40"
              >
                Create Revision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

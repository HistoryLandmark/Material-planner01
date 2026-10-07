import React, { useState, useMemo } from 'react';
import {
  TableProperties,
  Sliders,
  Filter,
  Search,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  ShoppingCart,
  Boxes,
  Percent,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatQty } from '../utils/calculations';
import { exportMaterialRequirementsToExcel } from '../utils/export';
import { getTerm } from '../utils/easyLanguage';
import { Lightbulb, HelpCircle, Edit3 } from 'lucide-react';

interface MaterialRequirementSheetViewProps {
  onOpenPrintModal?: () => void;
}

export const MaterialRequirementSheetView: React.FC<MaterialRequirementSheetViewProps> = ({
  onOpenPrintModal,
}) => {
  const {
    currentCalculation,
    plannedQuantity,
    setPlannedQuantity,
    setActiveTab,
    generatePurchaseRequisitionsFromMRP,
    currency,
    easyLanguageMode,
    setEasyLanguageMode,
    openRephraseModalWithTerm,
    setIsRephraseModalOpen,
  } = useApp();

  const [filterMode, setFilterMode] = useState<'all' | 'deficit_only' | 'sufficient'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [localSearch, setLocalSearch] = useState('');
  const [wastageDelta, setWastageDelta] = useState<number>(0); // What-if simulation delta

  const categories = useMemo(() => {
    if (!currentCalculation) return [];
    const set = new Set<string>();
    currentCalculation.lines.forEach((l) => set.add(l.category));
    return Array.from(set);
  }, [currentCalculation]);

  // Apply filters and wastage what-if simulation
  const simulatedLines = useMemo(() => {
    if (!currentCalculation) return [];

    return currentCalculation.lines
      .map((line) => {
        // Apply simulated wastage percentage
        const effectiveWastage = Math.max(0, line.wastagePercentage + wastageDelta);
        const grossReq = Number(
          (plannedQuantity * line.bomQuantityPerUnit * (1 + effectiveWastage / 100)).toFixed(4)
        );
        const rawNet = grossReq - line.availableStock;
        const netReq = rawNet > 0 ? Number(rawNet.toFixed(4)) : 0;
        const lineTotal = Number((grossReq * line.unitRate).toFixed(2));
        const costPerUnit = Number(((line.bomQuantityPerUnit * (1 + effectiveWastage / 100)) * line.unitRate).toFixed(4));

        let status = line.stockStatus;
        if (netReq === 0) status = 'sufficient';
        else if (line.availableStock === 0 || netReq > line.availableStock * 2) status = 'critical_shortage';
        else status = 'low';

        return {
          ...line,
          wastagePercentage: effectiveWastage,
          grossRequirement: grossReq,
          netRequirement: netReq,
          lineTotalCost: lineTotal,
          costPerFinishedUnit: costPerUnit,
          stockStatus: status,
        };
      })
      .filter((line) => {
        if (filterMode === 'deficit_only' && line.netRequirement === 0) return false;
        if (filterMode === 'sufficient' && line.netRequirement > 0) return false;
        if (selectedCategory !== 'all' && line.category !== selectedCategory) return false;
        if (localSearch) {
          const q = localSearch.toLowerCase();
          return (
            line.materialName.toLowerCase().includes(q) ||
            line.materialCode.toLowerCase().includes(q) ||
            line.supplierName.toLowerCase().includes(q)
          );
        }
        return true;
      });
  }, [currentCalculation, plannedQuantity, wastageDelta, filterMode, selectedCategory, localSearch]);

  const simulatedTotals = useMemo(() => {
    const totalCost = simulatedLines.reduce((acc, l) => acc + l.lineTotalCost, 0);
    const deficitCount = simulatedLines.filter((l) => l.netRequirement > 0).length;
    return {
      totalCost,
      costPerUnit: plannedQuantity > 0 ? totalCost / plannedQuantity : 0,
      deficitCount,
    };
  }, [simulatedLines, plannedQuantity]);

  const handleExport = () => {
    if (currentCalculation) {
      exportMaterialRequirementsToExcel({
        ...currentCalculation,
        lines: simulatedLines,
        totalMaterialCost: simulatedTotals.totalCost,
        materialCostPerUnit: simulatedTotals.costPerUnit,
        shortageMaterialsCount: simulatedTotals.deficitCount,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <span>Production Planner</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-indigo-600 font-semibold">Material Requirement Sheet (MRP)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <TableProperties className="w-6 h-6 text-indigo-600" />
            <span>Material Requirement Sheet & What-If Simulation</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Inspect precise Gross and Net demand calculations across all BOM levels. Run what-if simulations by varying scrap tolerances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEasyLanguageMode(!easyLanguageMode)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-all ${
              easyLanguageMode
                ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
            }`}
          >
            <Lightbulb className={`w-3.5 h-3.5 ${easyLanguageMode ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>{easyLanguageMode ? 'Easy Words: ON' : 'Easy Words'}</span>
          </button>
          <button
            onClick={() => setIsRephraseModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>Explain Terms</span>
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Table</span>
          </button>
          <button
            onClick={onOpenPrintModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* Control Bar with What-If Simulation & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Search */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search component code, description, supplier..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="md:col-span-4 flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                filterMode === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Items ({currentCalculation?.lines.length || 0})
            </button>
            <button
              onClick={() => setFilterMode('deficit_only')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                filterMode === 'deficit_only' ? 'bg-white text-rose-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Shortage Only ({currentCalculation?.shortageMaterialsCount || 0})
            </button>
            <button
              onClick={() => setFilterMode('sufficient')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                filterMode === 'sufficient' ? 'bg-white text-emerald-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In Stock ({currentCalculation?.totalAvailableMaterialsCount || 0})
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-4 flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800"
            >
              <option value="all">All Material Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* What-If Wastage Simulation Slider */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-indigo-50/40 p-3 rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <span>What-If Scrap & Wastage Sensitivity Simulator</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 font-mono">
                  {wastageDelta >= 0 ? `+${wastageDelta}%` : `${wastageDelta}%`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Simulate machine scrap variances, supplier defect rates, or assembly waste impact on gross requirements and overall batch spend.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <input
              type="range"
              min="-3"
              max="10"
              step="0.5"
              value={wastageDelta}
              onChange={(e) => setWastageDelta(parseFloat(e.target.value))}
              className="w-36 accent-indigo-600 cursor-pointer"
            />
            {wastageDelta !== 0 && (
              <button
                onClick={() => setWastageDelta(0)}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 underline font-medium"
              >
                Reset
              </button>
            )}
            <div className="text-xs font-mono-num font-bold text-slate-800 bg-white px-2 py-1 rounded-lg border border-slate-200">
              Batch: {formatCurrency(simulatedTotals.totalCost, currency.symbol)}
            </div>
          </div>
        </div>
      </div>

      {/* MRP Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Item Code</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-2">Category</th>
                <th
                  onClick={() => openRephraseModalWithTerm('bomQuantityPerUnit')}
                  className="py-3 px-2 text-right cursor-pointer hover:text-indigo-600"
                  title="Click to explain in plain language"
                >
                  {getTerm('bomQuantityPerUnit', easyLanguageMode)}
                </th>
                <th
                  onClick={() => openRephraseModalWithTerm('wastagePercentage')}
                  className="py-3 px-2 text-right cursor-pointer hover:text-indigo-600"
                  title="Click to explain in plain language"
                >
                  {getTerm('wastagePercentage', easyLanguageMode)}
                </th>
                <th
                  onClick={() => openRephraseModalWithTerm('grossRequirement')}
                  className="py-3 px-3 text-right bg-slate-100/70 font-bold text-slate-900 cursor-pointer hover:text-indigo-600"
                  title="Click to explain in plain language"
                >
                  {getTerm('grossRequirement', easyLanguageMode)}
                </th>
                <th
                  onClick={() => openRephraseModalWithTerm('onHandStock')}
                  className="py-3 px-2 text-right cursor-pointer hover:text-indigo-600"
                  title="Click to explain in plain language"
                >
                  {getTerm('onHandStock', easyLanguageMode)}
                </th>
                <th
                  onClick={() => openRephraseModalWithTerm('allocatedStock')}
                  className="py-3 px-2 text-right cursor-pointer hover:text-indigo-600"
                  title="Click to explain in plain language"
                >
                  {getTerm('allocatedStock', easyLanguageMode)}
                </th>
                <th
                  onClick={() => openRephraseModalWithTerm('availableStock')}
                  className="py-3 px-3 text-right bg-indigo-50/40 font-semibold text-slate-900 cursor-pointer hover:text-indigo-600"
                  title="Click to explain in plain language"
                >
                  {getTerm('availableStock', easyLanguageMode)}
                </th>
                <th
                  onClick={() => openRephraseModalWithTerm('netRequirement')}
                  className="py-3 px-3 text-right bg-indigo-100/40 font-bold text-indigo-950 cursor-pointer hover:text-indigo-600"
                  title="Click to explain in plain language"
                >
                  {getTerm('netRequirement', easyLanguageMode)}
                </th>
                <th className="py-3 px-2 text-center">Status</th>
                <th
                  onClick={() => openRephraseModalWithTerm('unitRate')}
                  className="py-3 px-2 text-right cursor-pointer hover:text-indigo-600"
                  title="Click to explain in plain language"
                >
                  {getTerm('unitRate', easyLanguageMode)} ({currency.symbol})
                </th>
                <th
                  onClick={() => openRephraseModalWithTerm('lineTotalCost')}
                  className="py-3 px-3 text-right font-bold text-slate-900 cursor-pointer hover:text-indigo-600"
                  title="Click to explain in plain language"
                >
                  {getTerm('lineTotalCost', easyLanguageMode)} ({currency.symbol})
                </th>
                <th className="py-3 px-4">Preferred Supplier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {simulatedLines.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-slate-400">
                    No raw materials match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                simulatedLines.map((l) => (
                  <tr
                    key={l.materialId}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      l.netRequirement > 0 ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">{l.materialCode}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{l.materialName}</div>
                    </td>
                    <td className="py-3 px-2 text-slate-500">{l.category}</td>
                    <td className="py-3 px-2 text-right font-mono-num">
                      {l.bomQuantityPerUnit} <span className="text-[10px] text-slate-400">{l.uom}</span>
                    </td>
                    <td className="py-3 px-2 text-right font-mono-num text-slate-600">
                      {l.wastagePercentage}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num font-bold text-slate-900 bg-slate-100/40">
                      {formatQty(l.grossRequirement, l.uom)}
                    </td>
                    <td className="py-3 px-2 text-right font-mono-num text-slate-600">{l.onHandStock}</td>
                    <td className="py-3 px-2 text-right font-mono-num text-slate-500">{l.allocatedStock}</td>
                    <td className="py-3 px-3 text-right font-mono-num font-bold text-slate-800 bg-indigo-50/20">
                      {formatQty(l.availableStock, l.uom)}
                    </td>
                    <td className={`py-3 px-3 text-right font-mono-num font-bold bg-indigo-100/20 ${
                      l.netRequirement > 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}>
                      {l.netRequirement > 0 ? `+${formatQty(l.netRequirement, l.uom)}` : '0 (Covered)'}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {l.stockStatus === 'critical_shortage' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          Critical Deficit
                        </span>
                      )}
                      {l.stockStatus === 'low' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                          Shortage
                        </span>
                      )}
                      {l.stockStatus === 'sufficient' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                          Sufficient
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right font-mono-num text-slate-600">{formatCurrency(l.unitRate, currency.symbol)}</td>
                    <td className="py-3 px-3 text-right font-mono-num font-bold text-slate-900">
                      {formatCurrency(l.lineTotalCost, currency.symbol)}
                    </td>
                    <td className="py-3 px-4 text-slate-700 text-[11px] truncate max-w-[140px]" title={l.supplierName}>
                      {l.supplierName}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-100/90 font-bold text-slate-900 border-t border-slate-200">
              <tr>
                <td colSpan={5} className="py-3 px-4">
                  Filtered Items Total ({simulatedLines.length} materials)
                </td>
                <td colSpan={4} className="py-3 px-2 text-center text-xs text-slate-500">
                  {simulatedTotals.deficitCount} items require immediate procurement
                </td>
                <td className="py-3 px-3 text-right text-xs text-slate-500">Total Spend:</td>
                <td colSpan={2} className="py-3 px-3 text-right font-mono-num text-base text-indigo-700">
                  {formatCurrency(simulatedTotals.totalCost, currency.symbol)}
                </td>
                <td colSpan={2} className="py-3 px-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

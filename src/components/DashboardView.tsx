import React, { useMemo } from 'react';
import {
  LayoutDashboard,
  Layers,
  AlertTriangle,
  Boxes,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ShoppingCart,
  ChevronRight,
  Calculator,
  CheckCircle2,
  Clock,
  Sparkles,
  FileSpreadsheet,
  ArrowRight,
  Lightbulb,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { InventoryItem } from '../types';
import { formatCurrency, formatQty } from '../utils/calculations';
import { generatePlainEnglishSummary, getTerm } from '../utils/easyLanguage';

interface DashboardViewProps {
  onOpenNewPlanModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenNewPlanModal }) => {
  const {
    products,
    rawMaterials,
    inventory,
    productionPlans,
    currentCalculation,
    purchaseRequisitions,
    setActiveTab,
    selectedProductId,
    setSelectedProductId,
    plannedQuantity,
    setPlannedQuantity,
    generatePurchaseRequisitionsFromMRP,
    dataSheetRows,
    currency,
    loadSampleData,
    easyLanguageMode,
    setEasyLanguageMode,
    openRephraseModalWithTerm,
    setIsRephraseModalOpen,
  } = useApp();

  // Total inventory dollar value = onHand * currentRate
  const totalInventoryValuation = (Object.values(inventory) as InventoryItem[]).reduce((acc, item) => {
    const mat = rawMaterials.find((m) => m.id === item.materialId);
    return acc + (item.onHandStock * (mat?.currentRate || 0));
  }, 0);

  // Critical shortage materials across all inventory (where available < reorderLevel)
  const inventoryShortages = rawMaterials
    .map((mat) => {
      const inv = inventory[mat.id] || {
        materialId: mat.id,
        onHandStock: 0,
        allocatedStock: 0,
        reorderLevel: mat.minBufferStock,
        warehouseLocation: 'N/A',
        lastStockCheck: '',
        onOrderStock: 0,
      };
      const available = Math.max(0, inv.onHandStock - inv.allocatedStock);
      const isDeficit = available < inv.reorderLevel;
      const shortageAmount = Math.max(0, inv.reorderLevel - available);
      return {
        ...mat,
        inventory: inv,
        available,
        isDeficit,
        shortageAmount,
      };
    })
    .filter((m) => m.isDeficit)
    .sort((a, b) => b.shortageAmount - a.shortageAmount);

  const activePlans = productionPlans.filter((p) => p.status !== 'completed' && p.status !== 'cancelled');

  const activeProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const plainEnglishSummary = useMemo(() => {
    return generatePlainEnglishSummary(
      currentCalculation,
      plannedQuantity,
      activeProduct?.name || 'Finished Product',
      currency.symbol
    );
  }, [currentCalculation, plannedQuantity, activeProduct, currency.symbol]);

  return (
    <div className="space-y-6">
      {/* Welcome & High Level Metric Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <span>Enterprise Operations</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-indigo-600 font-semibold">Manufacturing Control Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <LayoutDashboard className="w-6 h-6 text-indigo-600" />
            <span>Manufacturing & Material Requirement Overview</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Unified visibility across bill of materials revisions, production work orders, raw material valuation, and shortage alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('product-material-list')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Configure finished products with required output, MRP, and 4-5 nested raw materials"
          >
            <Boxes className="w-3.5 h-3.5 text-indigo-700" />
            <span>Product & Material List</span>
          </button>
          <button
            onClick={() => setActiveTab('data-sheet')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
            <span>Open Data Sheet</span>
          </button>
          <button
            onClick={() => setActiveTab('production-planner')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Launch MRP Calculator</span>
          </button>
        </div>
      </div>

      {/* Data Sheet Live Reflection Status Banner */}
      {dataSheetRows.length > 0 ? (
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-950">
                  Data Sheet Live Reflection Active
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Live MRP Sync</span>
                </span>
              </div>
              <p className="text-xs text-indigo-700 mt-0.5">
                Dashboard figures reflect your <strong>{dataSheetRows.length} component materials</strong> for <strong>{products.find(p => p.id === selectedProductId)?.name || 'Finished Product'}</strong> in <strong>{currency.symbol} {currency.code}</strong> (Planned Batch: {plannedQuantity} units).
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('data-sheet')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition shrink-0 self-start sm:self-center shadow-xs"
          >
            <span>Edit in Data Sheet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-600 text-white shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-950">
                  Clean Workspace — No Prefilled Data Loaded
                </span>
                <span className="text-[10px] font-semibold bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full">
                  Awaiting Input
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Start by entering your raw materials, quantities, scrap rates, and current inventory stock in the <strong>Data Sheet</strong>. All calculations will immediately populate this dashboard.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <button
              onClick={() => setActiveTab('data-sheet')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition shadow-xs"
            >
              <span>Open Data Sheet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => loadSampleData()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-amber-100/50 text-amber-900 border border-amber-300 transition"
            >
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Load Sample</span>
            </button>
          </div>
        </div>
      )}

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inventory Valuation */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Warehouse Valuation</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono-num text-slate-900">
            {formatCurrency(totalInventoryValuation, currency.symbol)}
          </div>
          <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
            <span>Across</span>
            <strong className="text-slate-700 font-mono-num">{rawMaterials.length}</strong>
            <span>tracked component lines</span>
          </div>
        </div>

        {/* Critical Shortages Warning */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Low Stock / Deficits</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              inventoryShortages.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono-num text-slate-900">
            <span className={inventoryShortages.length > 0 ? 'text-rose-600' : 'text-emerald-600'}>
              {inventoryShortages.length}
            </span>
            <span className="text-sm font-normal text-slate-400"> materials</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {inventoryShortages.length > 0 ? (
              <button
                onClick={() => setActiveTab('inventory')}
                className="text-rose-700 font-medium hover:underline flex items-center gap-0.5"
              >
                <span>Below buffer threshold</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            ) : (
              <span className="text-emerald-700 font-medium">All buffer stocks healthy</span>
            )}
          </div>
        </div>

        {/* Active Production Work Orders */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Production Work Orders</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono-num text-slate-900">
            {activePlans.length} Active Runs
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {productionPlans.reduce((acc, p) => acc + p.plannedQuantity, 0)} total units in pipeline
          </div>
        </div>

        {/* Current MRP Run Batch Cost */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active MRP Calculation</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono-num text-indigo-600">
            {currentCalculation ? formatCurrency(currentCalculation.totalMaterialCost, currency.symbol) : formatCurrency(0, currency.symbol)}
          </div>
          <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
            <span>{currentCalculation ? `${formatCurrency(currentCalculation.materialCostPerUnit, currency.symbol)}/unit` : 'No run selected'}</span>
            <button
              onClick={() => setActiveTab('production-planner')}
              className="text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Open &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Easy Language Executive Briefing Card */}
      <div className={`rounded-2xl p-5 border transition-all ${
        easyLanguageMode
          ? 'bg-amber-50/80 border-amber-200 shadow-sm'
          : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl mt-0.5 ${
              easyLanguageMode ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  {plainEnglishSummary.headline}
                </h2>
                {easyLanguageMode && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 shrink-0">
                    Easy Words Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed max-w-4xl">
                {plainEnglishSummary.summaryText}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <button
              onClick={() => setEasyLanguageMode(!easyLanguageMode)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                easyLanguageMode
                  ? 'bg-amber-200 text-amber-950 border-amber-300'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200 shadow-xs'
              }`}
            >
              {easyLanguageMode ? 'Switch to Technical Terms' : 'Simplify All Terms'}
            </button>
            <button
              onClick={() => setIsRephraseModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Ask Plain Words Bot</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick MRP Simulator & Active Work Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick MRP Run Launcher Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-600" />
                <span>Quick Material Requirement Calculator</span>
              </h2>
              <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                Interactive
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select product and target volume to preview gross and net demand instantaneously.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Target Finished Good
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} – {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Planned Production Volume
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={plannedQuantity}
                  onChange={(e) => setPlannedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 px-3 py-2 text-sm font-mono-num font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
                <div className="flex gap-1">
                  {[250, 500, 1000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPlannedQuantity(preset)}
                      className={`px-2 py-1 text-xs rounded-lg border font-mono-num ${
                        plannedQuantity === preset
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Result Preview */}
            {currentCalculation && (
              <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 text-xs space-y-1.5">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Gross Materials:</span>
                  <span className="font-mono-num font-bold text-slate-900">
                    {currentCalculation.totalGrossItems} components
                  </span>
                </div>
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Shortfall Materials (Net &gt; 0):</span>
                  <span className={`font-mono-num font-bold ${
                    currentCalculation.shortageMaterialsCount > 0 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {currentCalculation.shortageMaterialsCount} items to procure
                  </span>
                </div>
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Total Estimated Spend:</span>
                  <span className="font-mono-num font-bold text-indigo-700">
                    {formatCurrency(currentCalculation.totalMaterialCost)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveTab('production-planner')}
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>View Full Material Breakdown Sheet</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Active Production Runs Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Scheduled Production Work Orders</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Current manufacturing batches in progress or queued on the factory floor.
              </p>
            </div>
            <button
              onClick={() => onOpenNewPlanModal?.()}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              + Add Plan
            </button>
          </div>

          <div className="overflow-x-auto my-3">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-2 text-right">Batch Qty</th>
                  <th className="py-2.5 px-3">Target Date</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productionPlans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No active production orders recorded.
                    </td>
                  </tr>
                ) : (
                  productionPlans.map((plan) => {
                    const prod = products.find((p) => p.id === plan.productId);
                    return (
                      <tr key={plan.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                          {plan.planNumber}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{prod?.name || 'Finished Unit'}</div>
                          <div className="text-[10px] font-mono text-slate-400">{prod?.sku}</div>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono-num font-bold text-slate-900">
                          {formatQty(plan.plannedQuantity, prod?.uom)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                          {plan.targetCompletionDate}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              plan.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-700'
                                : plan.status === 'scheduled'
                                ? 'bg-indigo-100 text-indigo-700'
                                : plan.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {plan.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Tracking {productionPlans.length} production commitments</span>
            <button
              onClick={() => setActiveTab('production-planner')}
              className="text-indigo-600 font-semibold hover:underline"
            >
              Go to Planner &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Critical Shortages Attention Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-rose-50/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Critical Inventory Shortages & Reorder Warnings
              </h2>
              <p className="text-xs text-slate-500">
                Components where available warehouse stock (On-Hand − Allocated) is below safety buffer thresholds.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('purchase-requirement')}
              className="text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 transition-colors"
            >
              Open Purchase Queue &rarr;
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Item Code</th>
                <th className="py-3 px-4">Component Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Available Stock</th>
                <th className="py-3 px-3 text-right">Buffer Threshold</th>
                <th className="py-3 px-3 text-right font-bold text-rose-600">Shortage Deficit</th>
                <th className="py-3 px-3 text-right">Current Rate</th>
                <th className="py-3 px-4">Lead Time</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {inventoryShortages.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                    All inventory levels satisfy safety buffer parameters!
                  </td>
                </tr>
              ) : (
                inventoryShortages.slice(0, 5).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">{item.code}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="text-[10px] text-slate-400">Loc: {item.inventory.warehouseLocation}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{item.category}</td>
                    <td className="py-3 px-3 text-right font-mono-num font-medium text-slate-700">
                      {formatQty(item.available, item.uom)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num text-slate-500">
                      {formatQty(item.inventory.reorderLevel, item.uom)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num font-bold text-rose-600">
                      -{formatQty(item.shortageAmount, item.uom)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num text-slate-600">
                      {formatCurrency(item.currentRate)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{item.leadTimeDays} days</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          generatePurchaseRequisitionsFromMRP();
                          setActiveTab('purchase-requirement');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                      >
                        Create Requisition
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

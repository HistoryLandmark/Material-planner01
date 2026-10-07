import React, { useState } from 'react';
import {
  Calculator,
  ArrowRight,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  FileSpreadsheet,
  Printer,
  ShoppingCart,
  Layers,
  ChevronRight,
  BookmarkCheck,
  Percent,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatQty } from '../utils/calculations';
import { exportMaterialRequirementsToExcel } from '../utils/export';
import { getTerm } from '../utils/easyLanguage';
import { Lightbulb, HelpCircle } from 'lucide-react';

interface ProductionPlannerViewProps {
  onOpenPrintModal?: () => void;
  onSavePlanModal?: () => void;
}

export const ProductionPlannerView: React.FC<ProductionPlannerViewProps> = ({
  onOpenPrintModal,
  onSavePlanModal,
}) => {
  const {
    products,
    selectedProductId,
    setSelectedProductId,
    selectedBomVersionId,
    setSelectedBomVersionId,
    plannedQuantity,
    setPlannedQuantity,
    rateType,
    setRateType,
    currentCalculation,
    generatePurchaseRequisitionsFromMRP,
    setActiveTab,
    permissions,
    currency,
    easyLanguageMode,
    setEasyLanguageMode,
    openRephraseModalWithTerm,
    setIsRephraseModalOpen,
  } = useApp();

  const [prCreatedNotice, setPrCreatedNotice] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const selectedBomVersion =
    selectedProduct?.bomVersions.find((v) => v.id === selectedBomVersionId) ||
    selectedProduct?.bomVersions[0];

  const handleGeneratePRs = () => {
    const count = generatePurchaseRequisitionsFromMRP();
    if (count > 0) {
      setPrCreatedNotice(`Successfully generated ${count} Purchase Requisitions for procurement.`);
      setTimeout(() => setPrCreatedNotice(null), 6000);
    } else {
      setPrCreatedNotice('All raw materials have sufficient available stock! No new purchase orders required.');
      setTimeout(() => setPrCreatedNotice(null), 4000);
    }
  };

  const handleExportExcel = () => {
    if (currentCalculation) {
      exportMaterialRequirementsToExcel(currentCalculation);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <span>MaterialIQ</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-indigo-600 font-semibold">Production Planner & MRP Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Calculator className="w-6 h-6 text-indigo-600" />
            <span>Raw Material Requirement & BOM Costing Calculator</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
            Select a product, choose the active BOM revision, and input planned production volume to instantly compute
            gross and net material demand using inventory availability and scrap tolerances.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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
            <span>Plain Words Bot</span>
          </button>

          {permissions.canCreatePlan && (
            <button
              onClick={onSavePlanModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>Save as Work Order</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={onOpenPrintModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {prCreatedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{prCreatedNotice}</span>
          </div>
          <button
            onClick={() => setActiveTab('purchase-requirement')}
            className="font-bold text-emerald-700 hover:text-emerald-900 underline ml-4 shrink-0"
          >
            View Requisitions &rarr;
          </button>
        </div>
      )}

      {/* Configuration & Selection Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-end">
          {/* Product Selector */}
          <div className="lg:col-span-4 space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Finished Product
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 font-medium"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} – {p.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span>Category: <strong className="text-slate-700">{selectedProduct?.category}</strong></span>
              <span>•</span>
              <span>Lead Time: <strong className="text-slate-700">{selectedProduct?.leadTimeDays}d</strong></span>
            </div>
          </div>

          {/* BOM Version Selector */}
          <div className="lg:col-span-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                BOM Version
              </label>
              <button
                onClick={() => setActiveTab('bom-management')}
                className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800"
              >
                Manage Versions
              </button>
            </div>
            <select
              value={selectedBomVersionId}
              onChange={(e) => setSelectedBomVersionId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 font-medium"
            >
              {selectedProduct?.bomVersions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.versionNumber} ({v.status.toUpperCase()}) – {v.items.length} materials
                </option>
              ))}
            </select>
            <div className="text-[11px] text-slate-500 line-clamp-1">
              Effective: {selectedBomVersion?.effectiveDate} • {selectedBomVersion?.changeLog || 'Standard release'}
            </div>
          </div>

          {/* Planned Quantity */}
          <div className="lg:col-span-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Planned Production Qty
              </label>
              <span className="text-[11px] text-slate-400 font-medium">Units to build</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="1"
                value={plannedQuantity}
                onChange={(e) => setPlannedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full pl-3 pr-12 py-2 text-sm font-mono-num font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                {selectedProduct?.uom || 'pcs'}
              </span>
            </div>
            {/* Quick Volume Preset Buttons */}
            <div className="flex items-center gap-1.5 pt-0.5">
              {[100, 250, 500, 1000, 2500].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setPlannedQuantity(qty)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border font-mono-num transition-colors ${
                    plannedQuantity === qty
                      ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {qty}
                </button>
              ))}
            </div>
          </div>

          {/* Cost Basis Toggle */}
          <div className="lg:col-span-2 space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Cost Basis
            </label>
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setRateType('latest')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  rateType === 'latest'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Latest Market
              </button>
              <button
                type="button"
                onClick={() => setRateType('standard')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  rateType === 'standard'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Standard
              </button>
            </div>
            <div className="text-[10px] text-slate-400 text-center">
              {rateType === 'latest' ? 'Current supplier purchase rate' : 'Fixed standard accounting cost'}
            </div>
          </div>
        </div>

        {/* Applied Mathematical Formula Transparency Callout */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50/70 p-3 rounded-xl">
          <div className="flex items-start gap-2">
            <div className="p-1 rounded-md bg-indigo-100 text-indigo-700 mt-0.5">
              <Percent className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-slate-800">
                {easyLanguageMode ? 'Total Needed (Gross) Formula:' : 'Gross Requirement Formula:'}
              </span>
              <div className="text-slate-600 font-mono-num text-[11px] mt-0.5">
                {easyLanguageMode
                  ? `Total Needed = Batch Size (${plannedQuantity}) × Parts/Unit × (1 + Extra for Scrap %)`
                  : `Gross = Planned Qty (${plannedQuantity}) × BOM Qty/Unit × (1 + Wastage %)`}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="p-1 rounded-md bg-emerald-100 text-emerald-700 mt-0.5">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-slate-800">
                {easyLanguageMode ? 'Amount to Buy (Net) Formula:' : 'Net Requirement Formula:'}
              </span>
              <div className="text-slate-600 font-mono-num text-[11px] mt-0.5">
                {easyLanguageMode
                  ? `To Buy = Total Needed − Ready Stock (On Hand − Already Reserved)`
                  : `Net = Gross − Available Stock (where Available = On-Hand − Allocated)`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Summary */}
      {currentCalculation && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Material Cost */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                {easyLanguageMode ? 'Total Spend Needed' : 'Total Material Cost'}
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold font-mono-num text-slate-900">
              {formatCurrency(currentCalculation.totalMaterialCost, currency.symbol)}
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
              <span>For batch run of</span>
              <strong className="text-slate-800 font-mono-num">{plannedQuantity}</strong>
              <span>units</span>
            </div>
          </div>

          {/* Unit Material Cost */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                {easyLanguageMode ? 'Cost to Make 1 Unit' : 'Material Cost / Unit'}
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold font-mono-num text-indigo-600">
              {formatCurrency(currentCalculation.materialCostPerUnit, currency.symbol)}
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
              <span>Target Sale Price:</span>
              <strong className="text-slate-800 font-mono-num">{formatCurrency(selectedProduct?.sellingPrice || 0, currency.symbol)}</strong>
              {selectedProduct?.sellingPrice && (
                <span className="text-[10px] text-emerald-600 font-semibold">
                  ({(((selectedProduct.sellingPrice - currentCalculation.materialCostPerUnit) / selectedProduct.sellingPrice) * 100).toFixed(0)}% Margin)
                </span>
              )}
            </div>
          </div>

          {/* In-Stock vs Deficit Items */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                {easyLanguageMode ? 'Items Needing Purchase' : 'Procurement Demand'}
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                currentCalculation.shortageMaterialsCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {currentCalculation.shortageMaterialsCount > 0 ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold font-mono-num text-slate-900">
              <span className={currentCalculation.shortageMaterialsCount > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                {currentCalculation.shortageMaterialsCount}
              </span>
              <span className="text-sm font-normal text-slate-400"> / {currentCalculation.totalGrossItems} materials</span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {currentCalculation.shortageMaterialsCount > 0 ? (
                <span className="text-amber-700 font-medium">Require purchase orders</span>
              ) : (
                <span className="text-emerald-700 font-medium">100% available in inventory</span>
              )}
            </div>
          </div>

          {/* Quick Procure Action */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Procurement Action</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  MRP
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Generate Purchase Requisitions for all {currentCalculation.shortageMaterialsCount} shortfall materials in 1 click.
              </div>
            </div>

            <button
              onClick={handleGeneratePRs}
              disabled={currentCalculation.shortageMaterialsCount === 0}
              className="mt-3 w-full py-2 px-3 text-xs font-semibold rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Generate Purchase Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Material Requirements Calculation Grid */}
      {currentCalculation && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Calculated Material Requirement Breakdown
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Line-by-line itemization according to BOM {currentCalculation.bomVersionNumber} specifications for {currentCalculation.plannedQuantity} finished units.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('data-sheet')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                <span>Edit Every Detail in Data Sheet</span>
              </button>
              <button
                onClick={() => setActiveTab('material-requirement-sheet')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Full MRP Sheet & Simulator</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Material Code & Name</th>
                  <th className="py-3 px-2">Category</th>
                  <th
                    onClick={() => openRephraseModalWithTerm('bomQuantityPerUnit')}
                    className="py-3 px-2 text-right cursor-pointer hover:text-indigo-600"
                    title="Click to explain"
                  >
                    {getTerm('bomQuantityPerUnit', easyLanguageMode)}
                  </th>
                  <th
                    onClick={() => openRephraseModalWithTerm('wastagePercentage')}
                    className="py-3 px-2 text-right cursor-pointer hover:text-indigo-600"
                    title="Click to explain"
                  >
                    {getTerm('wastagePercentage', easyLanguageMode)}
                  </th>
                  <th
                    onClick={() => openRephraseModalWithTerm('grossRequirement')}
                    className="py-3 px-3 text-right bg-slate-100/70 font-bold text-slate-800 cursor-pointer hover:text-indigo-600"
                    title="Click to explain"
                  >
                    {getTerm('grossRequirement', easyLanguageMode)}
                  </th>
                  <th
                    onClick={() => openRephraseModalWithTerm('availableStock')}
                    className="py-3 px-2 text-right cursor-pointer hover:text-indigo-600"
                    title="Click to explain"
                  >
                    {getTerm('availableStock', easyLanguageMode)}
                  </th>
                  <th
                    onClick={() => openRephraseModalWithTerm('netRequirement')}
                    className="py-3 px-3 text-right bg-indigo-50/50 font-bold text-indigo-900 cursor-pointer hover:text-indigo-600"
                    title="Click to explain"
                  >
                    {getTerm('netRequirement', easyLanguageMode)}
                  </th>
                  <th className="py-3 px-2 text-center">Stock Status</th>
                  <th
                    onClick={() => openRephraseModalWithTerm('unitRate')}
                    className="py-3 px-2 text-right cursor-pointer hover:text-indigo-600"
                    title="Click to explain"
                  >
                    {getTerm('unitRate', easyLanguageMode)} ({currency.symbol})
                  </th>
                  <th
                    onClick={() => openRephraseModalWithTerm('lineTotalCost')}
                    className="py-3 px-3 text-right font-bold text-slate-900 cursor-pointer hover:text-indigo-600"
                    title="Click to explain"
                  >
                    {getTerm('lineTotalCost', easyLanguageMode)} ({currency.symbol})
                  </th>
                  <th
                    onClick={() => openRephraseModalWithTerm('costPerFinishedUnit')}
                    className="py-3 px-2 text-right cursor-pointer hover:text-indigo-600"
                    title="Click to explain"
                  >
                    {getTerm('costPerFinishedUnit', easyLanguageMode)} ({currency.symbol})
                  </th>
                  <th className="py-3 px-4">Supplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {currentCalculation.lines.map((line) => {
                  const isShortage = line.netRequirement > 0;
                  return (
                    <tr
                      key={line.materialId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isShortage ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{line.materialName}</div>
                        <div className="text-[11px] font-mono text-slate-400">{line.materialCode}</div>
                      </td>
                      <td className="py-3 px-2 text-slate-600">{line.category}</td>
                      <td className="py-3 px-2 text-right font-mono-num">
                        {line.bomQuantityPerUnit} <span className="text-slate-400 text-[10px]">{line.uom}</span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono-num text-slate-500">
                        {line.wastagePercentage}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num font-bold text-slate-900 bg-slate-100/50">
                        {formatQty(line.grossRequirement, line.uom)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono-num">
                        <div>{formatQty(line.availableStock, line.uom)}</div>
                        <div className="text-[10px] text-slate-400">
                          (OH: {line.onHandStock} - Res: {line.allocatedStock})
                        </div>
                      </td>
                      <td className={`py-3 px-3 text-right font-mono-num font-bold bg-indigo-50/30 ${
                        isShortage ? 'text-rose-600' : 'text-emerald-700'
                      }`}>
                        {isShortage ? (
                          <span className="inline-flex items-center gap-1">
                            +{formatQty(line.netRequirement, line.uom)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">0.0 (Covered)</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {line.stockStatus === 'critical_shortage' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            Critical
                          </span>
                        )}
                        {line.stockStatus === 'low' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                            Deficit
                          </span>
                        )}
                        {line.stockStatus === 'sufficient' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            Sufficient
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right font-mono-num text-slate-600">
                        {formatCurrency(line.unitRate, currency.symbol)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num font-bold text-slate-900">
                        {formatCurrency(line.lineTotalCost, currency.symbol)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono-num text-slate-500">
                        {formatCurrency(line.costPerFinishedUnit, currency.symbol)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium truncate max-w-[140px]" title={line.supplierName}>
                          {line.supplierName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Lead: {line.supplierLeadTimeDays} days
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100/80 font-bold border-t border-slate-200 text-slate-900">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-slate-800">
                    Grand Total ({currentCalculation.lines.length} BOM components for {currentCalculation.plannedQuantity} units)
                  </td>
                  <td className="py-3 px-3 text-right font-mono-num text-slate-900">
                    --
                  </td>
                  <td colSpan={3} className="py-3 px-2 text-center text-xs text-slate-500">
                    {currentCalculation.shortageMaterialsCount} Shortfalls identified
                  </td>
                  <td className="py-3 px-2 text-right text-xs text-slate-500">Total:</td>
                  <td className="py-3 px-3 text-right font-mono-num text-base text-indigo-700">
                    {formatCurrency(currentCalculation.totalMaterialCost, currency.symbol)}
                  </td>
                  <td className="py-3 px-2 text-right font-mono-num text-sm text-indigo-700">
                    {formatCurrency(currentCalculation.materialCostPerUnit, currency.symbol)}/ea
                  </td>
                  <td className="py-3 px-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

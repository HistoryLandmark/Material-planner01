import React, { useState, useMemo } from 'react';
import {
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Percent,
  DollarSign,
  ChevronRight,
  Sliders,
  Sparkles,
  Lightbulb,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { RawMaterial } from '../types';
import { formatCurrency } from '../utils/calculations';

const CATEGORY_COLORS: Record<string, string> = {
  'Electronics': '#6366f1', // Indigo
  'Metals & Hardware': '#0ea5e9', // Sky
  'Assemblies & Modules': '#8b5cf6', // Violet
  'Plastics & Polymers': '#10b981', // Emerald
  'Fasteners': '#f59e0b', // Amber
  'Packaging': '#ec4899', // Pink
  'Chemicals & Adhesives': '#14b8a6', // Teal
};

export const CostAnalysisView: React.FC = () => {
  const {
    currentCalculation,
    products,
    selectedProductId,
    plannedQuantity,
    rawMaterials,
    setActiveTab,
    currency,
    easyLanguageMode,
    setEasyLanguageMode,
    setIsRephraseModalOpen,
  } = useApp();

  const [priceInflationPct, setPriceInflationPct] = useState<number>(0);
  const [selectedCategoryHighlight, setSelectedCategoryHighlight] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // 1. Category Cost Distribution Data
  const categoryData = useMemo(() => {
    if (!currentCalculation || currentCalculation.totalMaterialCost === 0) return [];
    const map: Record<string, number> = {};

    currentCalculation.lines.forEach((line) => {
      map[line.category] = (map[line.category] || 0) + line.lineTotalCost;
    });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
      percentage: Number(((value / currentCalculation.totalMaterialCost) * 100).toFixed(1)),
      color: CATEGORY_COLORS[name] || '#94a3b8',
    }));
  }, [currentCalculation]);

  // 2. Pareto 80/20 Cost Drivers Data (Ranked top down)
  const paretoData = useMemo(() => {
    if (!currentCalculation || currentCalculation.lines.length === 0) return [];
    const sorted = [...currentCalculation.lines].sort((a, b) => b.lineTotalCost - a.lineTotalCost);

    let cumulative = 0;
    const total = currentCalculation.totalMaterialCost || 1;

    return sorted.map((line) => {
      cumulative += line.lineTotalCost;
      const cumPct = Number(((cumulative / total) * 100).toFixed(1));
      return {
        name: line.materialName.length > 20 ? line.materialName.slice(0, 18) + '...' : line.materialName,
        fullName: line.materialName,
        cost: line.lineTotalCost,
        unitContribution: line.costPerFinishedUnit,
        cumPct,
        isTop80: cumPct <= 85,
        category: line.category,
      };
    });
  }, [currentCalculation]);

  // 3. Historical Version Cost Comparison
  const versionComparisonData = useMemo(() => {
    if (!selectedProduct) return [];
    const rawMap = new Map<string, RawMaterial>(rawMaterials.map((m) => [m.id, m]));

    return selectedProduct.bomVersions.map((ver) => {
      const unitCost = ver.items.reduce((acc, item) => {
        const mat = rawMap.get(item.rawMaterialId);
        const rate = mat?.currentRate || 0;
        const wastage = 1 + (item.wastagePercentage || 0) / 100;
        return acc + item.quantityPerUnit * wastage * rate;
      }, 0);

      return {
        version: ver.versionNumber,
        status: ver.status,
        unitCost: Number(unitCost.toFixed(2)),
        batchCost: Number((unitCost * plannedQuantity).toFixed(2)),
        itemCount: ver.items.length,
      };
    });
  }, [selectedProduct, rawMaterials, plannedQuantity]);

  // 4. Sensitivity Simulation Output
  const simulatedCostMetrics = useMemo(() => {
    if (!currentCalculation) return { baseUnit: 0, inflatedUnit: 0, unitDelta: 0, marginImpact: 0 };
    const mult = 1 + priceInflationPct / 100;
    const baseUnit = currentCalculation.materialCostPerUnit;
    const inflatedUnit = Number((baseUnit * mult).toFixed(2));
    const unitDelta = Number((inflatedUnit - baseUnit).toFixed(2));
    const sellingPrice = selectedProduct?.sellingPrice || baseUnit * 1.5;

    const baseMargin = ((sellingPrice - baseUnit) / sellingPrice) * 100;
    const newMargin = ((sellingPrice - inflatedUnit) / sellingPrice) * 100;
    const marginImpact = Number((newMargin - baseMargin).toFixed(1));

    return {
      baseUnit,
      inflatedUnit,
      unitDelta,
      marginImpact,
      sellingPrice,
    };
  }, [currentCalculation, priceInflationPct, selectedProduct]);

  if (!currentCalculation || currentCalculation.lines.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-xs space-y-4 my-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <PieIcon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">No Cost Breakdown Data Available</h3>
          <p className="text-xs text-slate-500 mt-1">
            Fill in your raw materials, unit rates, and BOM components in the <strong>Data Sheet</strong> to visualize Pareto 80/20 cost drivers, category allocations, and price sensitivity simulations.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('data-sheet')}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs inline-flex items-center gap-2"
        >
          <span>Open Data Sheet to Enter Materials</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const topCostDriver = paretoData[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <span>Finance & Cost Engineering</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-indigo-600 font-semibold">Cost Analysis & Pareto Drivers</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <PieIcon className="w-6 h-6 text-indigo-600" />
            <span>Manufacturing Cost Breakdown & Sensitivity Analysis</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Analyze BOM cost concentration, identify top 80/20 cost drivers, and simulate commodity price sensitivity.
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
            <span>Plain Words Bot</span>
          </button>
          <button
            onClick={() => setActiveTab('data-sheet')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
            <span>Edit in Data Sheet</span>
          </button>
        </div>
      </div>

      {/* Top Cost Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">
            {easyLanguageMode ? 'Cost to Make 1 Unit' : 'Unit Material Cost (Active BOM)'}
          </span>
          <div className="mt-1 text-2xl font-bold font-mono-num text-indigo-600">
            {formatCurrency(currentCalculation.materialCostPerUnit, currency.symbol)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Baseline production cost for {selectedProduct.name}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">
            {easyLanguageMode ? 'Most Expensive Part' : 'Top Single Cost Driver'}
          </span>
          <div className="mt-1 text-lg font-bold text-slate-900 truncate" title={topCostDriver?.fullName}>
            {topCostDriver?.fullName || 'N/A'}
          </div>
          <div className="mt-1 text-xs text-slate-500 flex items-center gap-1 font-mono-num">
            <span className="text-rose-600 font-bold">{formatCurrency(topCostDriver?.unitContribution || 0, currency.symbol)}/unit</span>
            <span>({(( (topCostDriver?.cost || 0) / currentCalculation.totalMaterialCost) * 100).toFixed(1)}% of BOM)</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">
            {easyLanguageMode ? 'Key Cost Drivers (80%)' : 'Top 80% Components'}
          </span>
          <div className="mt-1 text-2xl font-bold font-mono-num text-slate-900">
            {paretoData.filter((p) => p.isTop80).length} of {paretoData.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Pareto principle: focus negotiations on these items
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Gross Margin Buffer</span>
          <div className="mt-1 text-2xl font-bold font-mono-num text-emerald-600">
            {selectedProduct.sellingPrice
              ? `${(((selectedProduct.sellingPrice - currentCalculation.materialCostPerUnit) / selectedProduct.sellingPrice) * 100).toFixed(1)}%`
              : 'N/A'}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Target Selling Price: {formatCurrency(selectedProduct.sellingPrice || 0, currency.symbol)}
          </div>
        </div>
      </div>

      {/* Visual Charts: Category Donut & Pareto Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown Donut */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-indigo-600" />
                <span>Cost Distribution by Category</span>
              </h2>
              <span className="text-xs font-mono-num text-slate-500">
                {formatCurrency(currentCalculation.totalMaterialCost, currency.symbol)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Relative expenditure split across engineering material families.
            </p>
          </div>

          <div className="h-64 my-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((entry) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={entry.color}
                      opacity={
                        selectedCategoryHighlight && selectedCategoryHighlight !== entry.name
                          ? 0.35
                          : 1
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${formatCurrency(value, currency.symbol)}`, 'Total Cost']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom scannable category legend */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
            {categoryData.map((cat) => (
              <div
                key={cat.name}
                onMouseEnter={() => setSelectedCategoryHighlight(cat.name)}
                onMouseLeave={() => setSelectedCategoryHighlight(null)}
                className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  ></span>
                  <span className="text-slate-700 truncate">{cat.name}</span>
                </div>
                <span className="font-mono-num font-semibold text-slate-900 ml-2">
                  {cat.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Cost Drivers Bar Chart (Pareto Ranking) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>Component Cost Ranking (Pareto Curve)</span>
              </h2>
              <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                Top 8 Drivers
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Ranked by unit cost contribution per finished device.
            </p>
          </div>

          <div className="h-72 my-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={paretoData.slice(0, 8)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tickFormatter={(v) => `${currency.symbol}${v}`} stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={110} />
                <Tooltip
                  formatter={(val: number) => [`${formatCurrency(val, currency.symbol)}/unit`, 'Unit Cost']}
                  labelFormatter={(label) => `Component: ${label}`}
                />
                <Bar dataKey="unitContribution" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              The top 3 components contribute{' '}
              <strong className="text-slate-900 font-mono-num">
                {paretoData.slice(0, 3).reduce((acc, p) => acc + (p.cost / currentCalculation.totalMaterialCost) * 100, 0).toFixed(1)}%
              </strong>{' '}
              of total BOM cost. Negotiating 5% volume discounts here yields maximum margin gain.
            </span>
          </div>
        </div>
      </div>

      {/* What-If Price Inflation & Tariff Sensitivity Simulator */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Commodity & Tariff Price Sensitivity Simulator
              </h2>
              <p className="text-xs text-slate-500">
                Stress test profit margins against market price fluctuations (e.g. semiconductor shortages, aluminum tariffs, transport surcharges).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {[-10, 0, 5, 10, 20].map((preset) => (
              <button
                key={preset}
                onClick={() => setPriceInflationPct(preset)}
                className={`px-2.5 py-1 text-xs rounded-lg font-mono-num border transition-colors ${
                  priceInflationPct === preset
                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {preset > 0 ? `+${preset}%` : `${preset}%`}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
          <div className="md:col-span-6 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Adjust Component Price Shift:</span>
              <span className="font-mono-num font-bold text-indigo-600 text-sm">
                {priceInflationPct >= 0 ? `+${priceInflationPct}%` : `${priceInflationPct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="40"
              step="1"
              value={priceInflationPct}
              onChange={(e) => setPriceInflationPct(parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono-num">
              <span>-20% (Cost Reduction)</span>
              <span>0% (Baseline)</span>
              <span>+40% (Severe Shock)</span>
            </div>
          </div>

          <div className="md:col-span-6 grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Baseline Unit</span>
              <span className="text-base font-bold font-mono-num text-slate-800">
                {formatCurrency(simulatedCostMetrics.baseUnit, currency.symbol)}
              </span>
            </div>

            <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200">
              <span className="text-[10px] uppercase font-semibold text-purple-700 block">Projected Unit</span>
              <span className="text-base font-bold font-mono-num text-purple-900">
                {formatCurrency(simulatedCostMetrics.inflatedUnit, currency.symbol)}
              </span>
              <span className="text-[10px] text-purple-600 block">
                {simulatedCostMetrics.unitDelta >= 0 ? `+${formatCurrency(simulatedCostMetrics.unitDelta, currency.symbol)}` : formatCurrency(simulatedCostMetrics.unitDelta, currency.symbol)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Margin Impact</span>
              <span
                className={`text-base font-bold font-mono-num ${
                  simulatedCostMetrics.marginImpact < 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {simulatedCostMetrics.marginImpact >= 0 ? `+${simulatedCostMetrics.marginImpact}%` : `${simulatedCostMetrics.marginImpact}%`}
              </span>
              <span className="text-[10px] text-slate-400 block">Pts difference</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical BOM Revision Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            Historical BOM Revision Cost Trajectory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Engineering lifecycle tracking across previous revisions of {selectedProduct.name}.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">BOM Revision</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Components Count</th>
                <th className="py-3 px-4 text-right font-bold text-slate-900">Baseline Unit Cost</th>
                <th className="py-3 px-4 text-right font-bold text-slate-900">Batch Cost ({plannedQuantity} units)</th>
                <th className="py-3 px-4">Cost Variance vs Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {versionComparisonData.map((ver) => {
                const diff = ver.unitCost - currentCalculation.materialCostPerUnit;
                return (
                  <tr key={ver.version} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{ver.version}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          ver.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ver.status === 'draft'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {ver.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num">{ver.itemCount} items</td>
                    <td className="py-3 px-4 text-right font-mono-num font-bold text-slate-900">
                      {formatCurrency(ver.unitCost, currency.symbol)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num text-slate-700">
                      {formatCurrency(ver.batchCost, currency.symbol)}
                    </td>
                    <td className="py-3 px-4 font-mono-num">
                      {Math.abs(diff) < 0.01 ? (
                        <span className="text-slate-400 text-[11px]">Current Baseline</span>
                      ) : diff > 0 ? (
                        <span className="text-rose-600 font-semibold">+{formatCurrency(diff, currency.symbol)} (+{((diff / currentCalculation.materialCostPerUnit) * 100).toFixed(1)}%)</span>
                      ) : (
                        <span className="text-emerald-600 font-semibold">{formatCurrency(diff, currency.symbol)} ({((diff / currentCalculation.materialCostPerUnit) * 100).toFixed(1)}%)</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

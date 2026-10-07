import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Calculator,
  TableProperties,
  ShoppingCart,
  GitBranch,
  PieChart,
  Boxes,
  Package,
  Cpu,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, currentCalculation, purchaseRequisitions, dataSheetRows, products } = useApp();

  const pendingPRCount = purchaseRequisitions.filter((pr) => pr.status === 'pending').length;
  const shortageCount = currentCalculation?.shortageMaterialsCount || 0;

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'product-material-list',
      label: 'Product & Material List',
      icon: Boxes,
      badge: `${products.length} Products`,
      badgeColor: 'bg-indigo-100 text-indigo-800 font-bold',
    },
    {
      id: 'data-sheet',
      label: 'Data Sheet (Input)',
      icon: FileSpreadsheet,
      badge: dataSheetRows.length > 0 ? `${dataSheetRows.length} Items` : 'Fill Data',
      badgeColor: dataSheetRows.length > 0 ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-indigo-100 text-indigo-700 font-bold',
    },
    {
      id: 'production-planner',
      label: 'Production Planner',
      icon: Calculator,
      badge: shortageCount > 0 ? `${shortageCount} Shortages` : undefined,
      badgeColor: 'bg-rose-100 text-rose-700 font-semibold',
    },
    { id: 'material-requirement-sheet', label: 'Requirement Sheet', icon: TableProperties },
    {
      id: 'purchase-requirement',
      label: 'Purchase Requisitions',
      icon: ShoppingCart,
      badge: pendingPRCount > 0 ? pendingPRCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 font-bold',
    },
    { id: 'bom-management', label: 'BOM Management', icon: GitBranch },
    { id: 'cost-analysis', label: 'Cost Analysis', icon: PieChart },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'product-master', label: 'Product Master', icon: Package },
    { id: 'raw-material-master', label: 'Raw Materials', icon: Cpu },
    { id: 'supplier-master', label: 'Suppliers', icon: Building2 },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 overflow-x-auto scrollbar-none no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full flex items-center gap-0.5 ${
                      isActive ? 'bg-indigo-500 text-white font-bold' : item.badgeColor
                    }`}
                  >
                    {item.id === 'production-planner' && <AlertCircle className="w-2.5 h-2.5 inline" />}
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

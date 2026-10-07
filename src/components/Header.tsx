import React, { useState } from 'react';
import {
  Layers,
  Search,
  ShieldCheck,
  ChevronDown,
  RotateCcw,
  PlusCircle,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Coins,
  Trash2,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { exportMaterialRequirementsToExcel } from '../utils/export';
import { SUPPORTED_CURRENCIES } from '../utils/calculations';

interface HeaderProps {
  onOpenNewPlanModal?: () => void;
  onOpenPrintModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNewPlanModal, onOpenPrintModal }) => {
  const {
    role,
    setRole,
    searchTerm,
    setSearchTerm,
    currentCalculation,
    currency,
    setCurrency,
    activeTab,
    setActiveTab,
    clearAllData,
    loadSampleData,
    easyLanguageMode,
    setEasyLanguageMode,
    setIsRephraseModalOpen,
  } = useApp();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);

  const rolesList: { id: UserRole; label: string; desc: string; badgeColor: string }[] = [
    {
      id: 'admin',
      label: 'Admin',
      desc: 'Full master data, configuration & system control',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      id: 'procurement',
      label: 'Procurement',
      desc: 'Suppliers, purchase requisitions, rates & RFQs',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'production',
      label: 'Production',
      desc: 'BOM editing, work orders, MRP planning & inventory',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'management',
      label: 'Management',
      desc: 'Executive analytics, cost trends & read-only audits',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
  ];

  const currentRoleInfo = rolesList.find((r) => r.id === role) || rolesList[0];

  const handleExportExcel = () => {
    if (currentCalculation) {
      exportMaterialRequirementsToExcel(currentCalculation);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  Material<span className="text-indigo-600">IQ</span>
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  BOM & MRP
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Raw Material Requirement & Costing Calculator
              </p>
            </div>
          </div>

          {/* Center Search Input */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search materials, products, suppliers, SKUs..."
                className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Right Action Controls & Role Switcher */}
          <div className="flex items-center gap-2">
            {/* Easy Language Mode Toggle Button */}
            <button
              onClick={() => setEasyLanguageMode(!easyLanguageMode)}
              title={
                easyLanguageMode
                  ? 'Easy Words mode is ON. Click to switch to technical terms.'
                  : 'Rephrase technical manufacturing terms (BOM, Gross/Net, Lead Times) into plain, everyday language.'
              }
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                easyLanguageMode
                  ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${easyLanguageMode ? 'text-amber-600' : 'text-slate-400'}`} />
              <span>{easyLanguageMode ? 'Easy Words: ON' : 'Easy Words'}</span>
            </button>

            {/* Plain Words Explainer Modal Trigger */}
            <button
              onClick={() => setIsRephraseModalOpen(true)}
              title="Explain active numbers in plain, simple English without jargon"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span>Plain Words</span>
            </button>

            {/* Quick Data Sheet Shortcut */}
            <button
              onClick={() => setActiveTab('data-sheet')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                activeTab === 'data-sheet'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Data Sheet</span>
            </button>

            {/* Currency Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                title="Change display currency"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold font-mono text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
              >
                <Coins className="w-3.5 h-3.5 text-indigo-600" />
                <span>{currency.symbol} {currency.code}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {isCurrencyDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-80 overflow-y-auto">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Select Currency
                  </div>
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => {
                        setCurrency(c);
                        setIsCurrencyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-indigo-50 transition-colors ${
                        currency.code === c.code ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-mono font-bold w-6 text-slate-900">{c.symbol}</span>
                        <span>{c.code}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[100px]">{c.name.split('-')[1]?.trim() || ''}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Print / PDF Trigger */}
            <button
              onClick={() => onOpenPrintModal?.()}
              title="Print or Save Report as PDF"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className={`flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all ${currentRoleInfo.badgeColor}`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="font-semibold">{currentRoleInfo.label}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Switch Active Role (RBAC)
                    </div>
                  </div>
                  <div className="p-1">
                    {rolesList.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setRole(r.id);
                          setIsRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex flex-col gap-0.5 ${
                          role === r.id ? 'bg-indigo-50/80 text-indigo-950 font-medium' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{r.label}</span>
                          {role === r.id && (
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100/60 px-1.5 py-0.5 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 line-clamp-1">{r.desc}</span>
                      </button>
                    ))}
                  </div>

                  <div className="px-3 py-2 mt-1 border-t border-slate-100 space-y-1.5">
                    <button
                      onClick={() => {
                        if (confirm('Load sample manufacturing template data?')) {
                          loadSampleData();
                          setIsRoleDropdownOpen(false);
                        }
                      }}
                      className="w-full text-left text-[11px] text-amber-700 hover:text-amber-900 flex items-center gap-1.5 font-medium py-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Load Sample Template Data</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Clear all materials and start fresh with an empty sheet?')) {
                          clearAllData();
                          setIsRoleDropdownOpen(false);
                        }
                      }}
                      className="w-full text-left text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-1.5 font-medium py-1"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Clear All Data (Start Clean)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

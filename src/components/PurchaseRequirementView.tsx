import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  FileSpreadsheet,
  Plus,
  Send,
  CheckCircle,
  Truck,
  Building2,
  Calendar,
  DollarSign,
  ChevronRight,
  Filter,
  Lightbulb,
  HelpCircle,
  Edit2,
  X,
  Save,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PurchaseRequisitionItem } from '../types';
import { formatCurrency, formatQty } from '../utils/calculations';
import { exportPurchaseRequirementsToExcel } from '../utils/export';
import { getTerm } from '../utils/easyLanguage';

export const PurchaseRequirementView: React.FC = () => {
  const {
    purchaseRequisitions,
    updatePurchaseRequisitionStatus,
    updatePurchaseRequisitionItem,
    currentCalculation,
    generatePurchaseRequisitionsFromMRP,
    suppliers,
    permissions,
    currency,
    easyLanguageMode,
    setEasyLanguageMode,
    openRephraseModalWithTerm,
    setIsRephraseModalOpen,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | PurchaseRequisitionItem['status']>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [selectedPRs, setSelectedPRs] = useState<Set<string>>(new Set());
  const [editingPR, setEditingPR] = useState<PurchaseRequisitionItem | null>(null);

  const filteredRequisitions = useMemo(() => {
    return purchaseRequisitions.filter((pr) => {
      if (statusFilter !== 'all' && pr.status !== statusFilter) return false;
      if (supplierFilter !== 'all' && pr.supplierId !== supplierFilter) return false;
      return true;
    });
  }, [purchaseRequisitions, statusFilter, supplierFilter]);

  // Aggregation by Supplier
  const supplierCommitments = useMemo(() => {
    const map: Record<
      string,
      {
        supplierId: string;
        supplierName: string;
        itemCount: number;
        totalValue: number;
        maxLeadTime: number;
      }
    > = {};

    filteredRequisitions.forEach((pr) => {
      if (!map[pr.supplierId]) {
        map[pr.supplierId] = {
          supplierId: pr.supplierId,
          supplierName: pr.supplierName,
          itemCount: 0,
          totalValue: 0,
          maxLeadTime: 0,
        };
      }
      map[pr.supplierId].itemCount += 1;
      map[pr.supplierId].totalValue += pr.totalCost;
      map[pr.supplierId].maxLeadTime = Math.max(map[pr.supplierId].maxLeadTime, pr.leadTimeDays);
    });

    return Object.values(map);
  }, [filteredRequisitions]);

  const totalProcurementValue = useMemo(() => {
    return filteredRequisitions.reduce((acc, pr) => acc + pr.totalCost, 0);
  }, [filteredRequisitions]);

  const toggleSelectPR = (id: string) => {
    setSelectedPRs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkStatus = (status: PurchaseRequisitionItem['status']) => {
    selectedPRs.forEach((id) => {
      updatePurchaseRequisitionStatus(id, status);
    });
    setSelectedPRs(new Set());
  };

  const handleExport = () => {
    exportPurchaseRequirementsToExcel(filteredRequisitions);
  };

  const handleSaveEditedPR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPR) return;
    const sup = suppliers.find((s) => s.id === editingPR.supplierId);
    updatePurchaseRequisitionItem(editingPR.id, {
      orderQuantity: Number(editingPR.orderQuantity),
      unitRate: Number(editingPR.unitRate),
      supplierId: editingPR.supplierId,
      supplierName: sup ? sup.name : editingPR.supplierName,
      leadTimeDays: sup ? sup.leadTimeDays : editingPR.leadTimeDays,
      urgency: editingPR.urgency,
      status: editingPR.status,
      targetDeliveryDate: editingPR.targetDeliveryDate,
    });
    setEditingPR(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <span>Procurement & Supply Chain</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-indigo-600 font-semibold">Purchase Requisitions (PR)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-6 h-6 text-indigo-600" />
            <span>Shortfall Purchase Requirements & Requisitions</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Procurement queue automatically populated from BOM Net Shortfalls. Every detail is editable and explainable in plain language.
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

          {permissions.canProcure && currentCalculation && currentCalculation.shortageMaterialsCount > 0 && (
            <button
              onClick={() => generatePurchaseRequisitionsFromMRP()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Import Shortfalls</span>
            </button>
          )}

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export PRs</span>
          </button>
        </div>
      </div>

      {/* Supplier Commitment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {easyLanguageMode ? 'Total Projected Spend' : 'Total Purchase Commitment'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono-num text-slate-900">
            {formatCurrency(totalProcurementValue, currency.symbol)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Across {filteredRequisitions.length} required line items
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {easyLanguageMode ? 'Vendors to Buy From' : 'Suppliers Engaged'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono-num text-slate-900">
            {supplierCommitments.length} Vendors
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Max component lead time:{' '}
            <strong className="text-slate-700">
              {Math.max(0, ...supplierCommitments.map((s) => s.maxLeadTime))} days
            </strong>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {easyLanguageMode ? 'Orders Still Waiting' : 'Requisitions in Pipeline'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono-num text-slate-900">
            {purchaseRequisitions.filter((pr) => pr.status === 'pending').length} Pending
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {purchaseRequisitions.filter((pr) => pr.status === 'po_placed').length} active Purchase Orders placed
          </div>
        </div>
      </div>

      {/* Filters & Bulk Operations */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {(['all', 'pending', 'rfq_sent', 'po_placed', 'received'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-all ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status === 'all' ? 'All Statuses' : status.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="all">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Action Controls */}
        {selectedPRs.size > 0 && permissions.canProcure && (
          <div className="flex items-center gap-2 animate-in fade-in duration-150">
            <span className="text-xs font-medium text-slate-600">
              {selectedPRs.size} selected:
            </span>
            <button
              onClick={() => handleBulkStatus('rfq_sent')}
              className="px-2.5 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors flex items-center gap-1"
            >
              <Send className="w-3 h-3" />
              <span>Mark RFQ Sent</span>
            </button>
            <button
              onClick={() => handleBulkStatus('po_placed')}
              className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1"
            >
              <Truck className="w-3 h-3" />
              <span>Issue PO</span>
            </button>
          </div>
        )}
      </div>

      {/* Purchase Requisitions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-8">
                  <input
                    type="checkbox"
                    checked={
                      filteredRequisitions.length > 0 &&
                      selectedPRs.size === filteredRequisitions.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPRs(new Set(filteredRequisitions.map((r) => r.id)));
                      } else {
                        setSelectedPRs(new Set());
                      }
                    }}
                    className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="py-3 px-3">PR Number</th>
                <th className="py-3 px-3">Material Code & Item</th>
                <th
                  onClick={() => openRephraseModalWithTerm('netRequirement')}
                  className="py-3 px-2 text-right cursor-pointer hover:text-indigo-600"
                  title="Click to explain"
                >
                  {getTerm('netRequirement', easyLanguageMode)}
                </th>
                <th className="py-3 px-2 text-right font-bold text-slate-900">Order Qty</th>
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
                  Est. PO Value ({currency.symbol})
                </th>
                <th className="py-3 px-4">Supplier & Lead Time</th>
                <th className="py-3 px-2 text-center">Urgency</th>
                <th className="py-3 px-2 text-center">Status</th>
                <th className="py-3 px-4">Delivery Due</th>
                <th className="py-3 px-4 text-right">Edit & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequisitions.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400">
                    No purchase requisitions found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredRequisitions.map((pr) => {
                  const isChecked = selectedPRs.has(pr.id);
                  return (
                    <tr
                      key={pr.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isChecked ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectPR(pr.id)}
                          className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                        {pr.requisitionNumber}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{pr.materialName}</div>
                        <div className="text-[11px] font-mono text-slate-400">{pr.materialCode}</div>
                      </td>
                      <td className="py-3 px-2 text-right font-mono-num text-rose-600 font-medium">
                        {formatQty(pr.netRequirement, pr.uom)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono-num font-bold text-slate-900">
                        {formatQty(pr.orderQuantity, pr.uom)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono-num text-slate-600">
                        {formatCurrency(pr.unitRate, currency.symbol)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num font-bold text-indigo-950">
                        {formatCurrency(pr.totalCost, currency.symbol)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{pr.supplierName}</div>
                        <div className="text-[10px] text-slate-400">
                          Lead: {pr.leadTimeDays} days
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {pr.urgency === 'critical' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            Critical
                          </span>
                        ) : pr.urgency === 'high' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            High
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                            pr.status === 'received'
                              ? 'bg-emerald-100 text-emerald-800'
                              : pr.status === 'po_placed'
                              ? 'bg-blue-100 text-blue-800'
                              : pr.status === 'rfq_sent'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {pr.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {pr.targetDeliveryDate}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingPR(pr)}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md border border-indigo-200 transition"
                            title="Edit details (Order Qty, Rate, Urgency, Supplier)"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {permissions.canProcure && (
                            <select
                              value={pr.status}
                              onChange={(e) =>
                                updatePurchaseRequisitionStatus(
                                  pr.id,
                                  e.target.value as PurchaseRequisitionItem['status']
                                )
                              }
                              className="text-[11px] py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                            >
                              <option value="pending">Pending</option>
                              <option value="rfq_sent">RFQ Sent</option>
                              <option value="po_placed">PO Placed</option>
                              <option value="received">Received</option>
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-slate-100/80 font-bold border-t border-slate-200 text-slate-900">
              <tr>
                <td colSpan={4} className="py-3 px-4">
                  Total Requisitions in View ({filteredRequisitions.length} lines)
                </td>
                <td colSpan={2} className="py-3 px-2 text-right text-xs text-slate-500">
                  Total Projected PO Commitment:
                </td>
                <td className="py-3 px-3 text-right font-mono-num text-base text-indigo-700">
                  {formatCurrency(totalProcurementValue, currency.symbol)}
                </td>
                <td colSpan={5} className="py-3 px-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Edit Purchase Requisition Item Modal */}
      {editingPR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-indigo-600" />
                  <span>Edit Purchase Requisition</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  {editingPR.requisitionNumber} – {editingPR.materialName} ({editingPR.materialCode})
                </p>
              </div>
              <button
                onClick={() => setEditingPR(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedPR} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Order Quantity ({editingPR.uom})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingPR.orderQuantity}
                    onChange={(e) =>
                      setEditingPR({ ...editingPR, orderQuantity: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono-num font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit Rate ({currency.symbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingPR.unitRate}
                    onChange={(e) =>
                      setEditingPR({ ...editingPR, unitRate: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono-num font-bold"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-indigo-900">Total Purchase Value:</span>
                <span className="text-base font-bold font-mono-num text-indigo-700">
                  {formatCurrency(editingPR.orderQuantity * editingPR.unitRate, currency.symbol)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preferred Supplier
                </label>
                <select
                  value={editingPR.supplierId}
                  onChange={(e) => {
                    const found = suppliers.find((s) => s.id === e.target.value);
                    setEditingPR({
                      ...editingPR,
                      supplierId: e.target.value,
                      supplierName: found ? found.name : editingPR.supplierName,
                      leadTimeDays: found ? found.leadTimeDays : editingPR.leadTimeDays,
                    });
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.leadTimeDays}d lead time)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Urgency Level
                  </label>
                  <select
                    value={editingPR.urgency}
                    onChange={(e) =>
                      setEditingPR({
                        ...editingPR,
                        urgency: e.target.value as PurchaseRequisitionItem['urgency'],
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Order Status
                  </label>
                  <select
                    value={editingPR.status}
                    onChange={(e) =>
                      setEditingPR({
                        ...editingPR,
                        status: e.target.value as PurchaseRequisitionItem['status'],
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="rfq_sent">RFQ Sent</option>
                    <option value="po_placed">PO Placed</option>
                    <option value="received">Received</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Delivery Date
                </label>
                <input
                  type="date"
                  value={editingPR.targetDeliveryDate}
                  onChange={(e) =>
                    setEditingPR({ ...editingPR, targetDeliveryDate: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPR(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

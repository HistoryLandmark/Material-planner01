import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  ChevronRight,
  Star,
  Phone,
  Mail,
  Edit2,
  Trash2,
  Clock,
  CreditCard,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Supplier } from '../types';

interface SupplierMasterViewProps {
  onOpenAddSupplierModal: () => void;
  onEditSupplier: (supplier: Supplier) => void;
}

export const SupplierMasterView: React.FC<SupplierMasterViewProps> = ({
  onOpenAddSupplierModal,
  onEditSupplier,
}) => {
  const { suppliers, deleteSupplier, permissions, rawMaterials } = useApp();
  const [search, setSearch] = useState('');

  const filteredSuppliers = suppliers.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.contactPerson.toLowerCase().includes(q);
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove supplier ${name}?`)) {
      deleteSupplier(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <span>Procurement & Vendors</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-indigo-600 font-semibold">Supplier Master</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-indigo-600" />
            <span>Supplier & Vendor Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Maintain approved manufacturing suppliers, contractual credit terms, average lead times, and performance quality ratings.
          </p>
        </div>

        {permissions.canEditSuppliers && (
          <button
            onClick={onOpenAddSupplierModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Supplier</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search supplier code, company name, contact..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredSuppliers.length} approved vendors
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Vendor Code</th>
                <th className="py-3 px-4">Company Name & Region</th>
                <th className="py-3 px-4">Key Contact</th>
                <th className="py-3 px-3">Payment Terms</th>
                <th className="py-3 px-3 text-right">Avg Lead Time</th>
                <th className="py-3 px-3 text-center">Quality Rating</th>
                <th className="py-3 px-3 text-right">Parts Supplied</th>
                <th className="py-3 px-3 text-center">Status</th>
                {permissions.canEditSuppliers && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No suppliers match search criteria.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((s) => {
                  const partsCount = rawMaterials.filter((m) => m.preferredSupplierId === s.id).length;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">{s.code}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{s.name}</div>
                        <div className="text-[11px] text-slate-400">{s.country}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{s.contactPerson}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {s.email}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                          <CreditCard className="w-3 h-3 text-slate-400" />
                          {s.paymentTerms}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono-num text-slate-700">
                        {s.leadTimeDays} days
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                          <span>{s.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono-num font-medium text-slate-800">
                        {partsCount} materials
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Active
                        </span>
                      </td>
                      {permissions.canEditSuppliers && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onEditSupplier(s)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                              title="Edit Supplier"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(s.id, s.name)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                              title="Delete Supplier"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

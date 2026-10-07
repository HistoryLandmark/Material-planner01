import React, { useState } from 'react';
import {
  X,
  Plus,
  Package,
  Cpu,
  Building2,
  GitBranch,
  Boxes,
  Calendar,
  Percent,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  Product,
  RawMaterial,
  Supplier,
  MaterialCategory,
  UOM,
} from '../types';
import { formatCurrency, formatQty } from '../utils/calculations';

const CATEGORIES: MaterialCategory[] = [
  'Electronics',
  'Metals & Hardware',
  'Plastics & Polymers',
  'Assemblies & Modules',
  'Fasteners',
  'Packaging',
  'Chemicals & Adhesives',
];

const UOM_LIST: UOM[] = ['pcs', 'kg', 'g', 'm', 'mm', 'l', 'ml', 'set', 'roll', 'sheet'];

// 1. PRODUCT MODAL
interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, productToEdit }) => {
  const { addProduct, updateProduct } = useApp();

  const [sku, setSku] = useState(productToEdit?.sku || '');
  const [name, setName] = useState(productToEdit?.name || '');
  const [category, setCategory] = useState(productToEdit?.category || 'Industrial Electronics');
  const [uom, setUom] = useState<UOM>(productToEdit?.uom || 'pcs');
  const [description, setDescription] = useState(productToEdit?.description || '');
  const [leadTimeDays, setLeadTimeDays] = useState(productToEdit?.leadTimeDays || 14);
  const [sellingPrice, setSellingPrice] = useState(productToEdit?.sellingPrice || 100);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) return;

    if (productToEdit) {
      updateProduct(productToEdit.id, {
        sku: sku.trim(),
        name: name.trim(),
        category,
        uom,
        description,
        leadTimeDays: Number(leadTimeDays),
        sellingPrice: Number(sellingPrice),
      });
    } else {
      addProduct({
        sku: sku.trim(),
        name: name.trim(),
        category,
        uom,
        description,
        leadTimeDays: Number(leadTimeDays),
        sellingPrice: Number(sellingPrice),
        isActive: true,
        bomVersions: [
          {
            id: `bom-v1-0-${Date.now()}`,
            versionNumber: 'v1.0',
            status: 'active',
            effectiveDate: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString().split('T')[0],
            createdBy: 'Engineering User',
            changeLog: 'Initial baseline BOM',
            items: [],
          },
        ],
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              {productToEdit ? 'Edit Finished Product' : 'Add New Finished Good'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Product SKU / Code</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. PRD-4001-IOT"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <input
                type="text"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Industrial Electronics"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Product Title</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Precision Industrial Flowmeter"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Technical summary..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">UOM</label>
              <select
                value={uom}
                onChange={(e) => setUom(e.target.value as UOM)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                {UOM_LIST.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Time (Days)</label>
              <input
                type="number"
                min="1"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono-num"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              {productToEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 2. RAW MATERIAL MODAL
interface RawMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialToEdit?: RawMaterial | null;
}

export const RawMaterialModal: React.FC<RawMaterialModalProps> = ({
  isOpen,
  onClose,
  materialToEdit,
}) => {
  const { addRawMaterial, updateRawMaterial, suppliers } = useApp();

  const [code, setCode] = useState(materialToEdit?.code || '');
  const [name, setName] = useState(materialToEdit?.name || '');
  const [category, setCategory] = useState<MaterialCategory>(materialToEdit?.category || 'Electronics');
  const [uom, setUom] = useState<UOM>(materialToEdit?.uom || 'pcs');
  const [standardCost, setStandardCost] = useState(materialToEdit?.standardCost || 5.0);
  const [currentRate, setCurrentRate] = useState(materialToEdit?.currentRate || 5.25);
  const [preferredSupplierId, setPreferredSupplierId] = useState(
    materialToEdit?.preferredSupplierId || suppliers[0]?.id || ''
  );
  const [minBufferStock, setMinBufferStock] = useState(materialToEdit?.minBufferStock || 300);
  const [leadTimeDays, setLeadTimeDays] = useState(materialToEdit?.leadTimeDays || 14);
  const [description, setDescription] = useState(materialToEdit?.description || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    if (materialToEdit) {
      updateRawMaterial(materialToEdit.id, {
        code: code.trim(),
        name: name.trim(),
        category,
        uom,
        standardCost: Number(standardCost),
        currentRate: Number(currentRate),
        preferredSupplierId,
        minBufferStock: Number(minBufferStock),
        leadTimeDays: Number(leadTimeDays),
        description,
      });
    } else {
      addRawMaterial({
        code: code.trim(),
        name: name.trim(),
        category,
        uom,
        standardCost: Number(standardCost),
        currentRate: Number(currentRate),
        preferredSupplierId,
        minBufferStock: Number(minBufferStock),
        leadTimeDays: Number(leadTimeDays),
        description,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              {materialToEdit ? 'Edit Raw Material' : 'Add Raw Material'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Part / Item Code</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. RM-EL-205"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MaterialCategory)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Component Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. WiFi 6 + Bluetooth 5.2 RF Module"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">UOM</label>
              <select
                value={uom}
                onChange={(e) => setUom(e.target.value as UOM)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                {UOM_LIST.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Standard Cost ($)</label>
              <input
                type="number"
                step="0.001"
                value={standardCost}
                onChange={(e) => setStandardCost(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Rate ($)</label>
              <input
                type="number"
                step="0.001"
                value={currentRate}
                onChange={(e) => setCurrentRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono-num font-bold text-indigo-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Supplier</label>
              <select
                value={preferredSupplierId}
                onChange={(e) => setPreferredSupplierId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Min Buffer Stock</label>
              <input
                type="number"
                min="0"
                value={minBufferStock}
                onChange={(e) => setMinBufferStock(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono-num"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Technical Notes</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Package specifications, tolerances..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              {materialToEdit ? 'Save Changes' : 'Create Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 3. SUPPLIER MODAL
interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierToEdit?: Supplier | null;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({ isOpen, onClose, supplierToEdit }) => {
  const { addSupplier, updateSupplier } = useApp();

  const [code, setCode] = useState(supplierToEdit?.code || '');
  const [name, setName] = useState(supplierToEdit?.name || '');
  const [contactPerson, setContactPerson] = useState(supplierToEdit?.contactPerson || '');
  const [email, setEmail] = useState(supplierToEdit?.email || '');
  const [phone, setPhone] = useState(supplierToEdit?.phone || '');
  const [paymentTerms, setPaymentTerms] = useState(supplierToEdit?.paymentTerms || 'Net 30');
  const [leadTimeDays, setLeadTimeDays] = useState(supplierToEdit?.leadTimeDays || 14);
  const [rating, setRating] = useState(supplierToEdit?.rating || 4.5);
  const [country, setCountry] = useState(supplierToEdit?.country || 'United States');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (supplierToEdit) {
      updateSupplier(supplierToEdit.id, {
        code: code.trim(),
        name: name.trim(),
        contactPerson,
        email,
        phone,
        paymentTerms,
        leadTimeDays: Number(leadTimeDays),
        rating: Number(rating),
        country,
      });
    } else {
      addSupplier({
        code: code.trim() || `SUP-00${Math.floor(10 + Math.random() * 90)}`,
        name: name.trim(),
        contactPerson,
        email,
        phone,
        paymentTerms,
        leadTimeDays: Number(leadTimeDays),
        rating: Number(rating),
        isActive: true,
        country,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              {supplierToEdit ? 'Edit Supplier' : 'Register New Supplier'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. SUP-009"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Country / Region</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. Germany"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Supplier Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apex Precision Casting Inc."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Key account manager"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="orders@vendor.com"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
                <option value="Advance">Advance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Time (Days)</label>
              <input
                type="number"
                min="1"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rating (1-5)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={rating}
                onChange={(e) => setRating(parseFloat(e.target.value) || 5)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono-num"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              {supplierToEdit ? 'Save Changes' : 'Register Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 4. ADD BOM ITEM MODAL
interface BOMItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BOMItemModal: React.FC<BOMItemModalProps> = ({ isOpen, onClose }) => {
  const { products, selectedProductId, selectedBomVersionId, rawMaterials, updateBOMVersion } = useApp();

  const currentProduct = products.find((p) => p.id === selectedProductId);
  const currentVersion = currentProduct?.bomVersions.find((v) => v.id === selectedBomVersionId);

  const [selectedMatId, setSelectedMatId] = useState(rawMaterials[0]?.id || '');
  const [qtyPerUnit, setQtyPerUnit] = useState(1);
  const [wastagePct, setWastagePct] = useState(2.0);
  const [notes, setNotes] = useState('');

  if (!isOpen || !currentProduct || !currentVersion) return null;

  const chosenMat = rawMaterials.find((m) => m.id === selectedMatId) || rawMaterials[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosenMat) return;

    const newItem = {
      id: `bitem-${Date.now()}`,
      rawMaterialId: chosenMat.id,
      quantityPerUnit: Number(qtyPerUnit),
      uom: chosenMat.uom,
      wastagePercentage: Number(wastagePct),
      notes: notes.trim(),
    };

    const updatedItems = [...currentVersion.items, newItem];
    updateBOMVersion(currentProduct.id, currentVersion.id, { items: updatedItems });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Add Component to BOM ({currentVersion.versionNumber})
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Raw Material</label>
            <select
              value={selectedMatId}
              onChange={(e) => setSelectedMatId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
            >
              {rawMaterials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code} – {m.name} ({formatCurrency(m.currentRate)} / {m.uom})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Qty / Unit ({chosenMat?.uom})
              </label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={qtyPerUnit}
                onChange={(e) => setQtyPerUnit(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono-num font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Wastage / Scrap %
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={wastagePct}
                onChange={(e) => setWastagePct(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono-num"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assembly Notes / Placement</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. SMD location C14-C22, torque 0.8Nm"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
            Unit Cost Contribution: <strong>{formatCurrency(qtyPerUnit * (1 + wastagePct / 100) * (chosenMat?.currentRate || 0))}</strong>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              Add Component
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 5. STOCK ADJUSTMENT MODAL
interface StockAdjustmentModalProps {
  isOpen: boolean;
  materialId: string | null;
  onClose: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  materialId,
  onClose,
}) => {
  const { rawMaterials, inventory, adjustInventoryStock } = useApp();

  const [changeType, setChangeType] = useState<'add_onhand' | 'reduce_onhand' | 'adjust_allocated'>('add_onhand');
  const [qty, setQty] = useState(100);
  const [reason, setReason] = useState('Stock Intake from Supplier Delivery');

  if (!isOpen || !materialId) return null;

  const mat = rawMaterials.find((m) => m.id === materialId);
  const inv = inventory[materialId] || {
    onHandStock: 0,
    allocatedStock: 0,
    warehouseLocation: 'Main Floor',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qty <= 0) return;

    if (changeType === 'add_onhand') {
      adjustInventoryStock(materialId, qty, reason, false);
    } else if (changeType === 'reduce_onhand') {
      adjustInventoryStock(materialId, -qty, reason, false);
    } else {
      adjustInventoryStock(materialId, qty, reason, true);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Adjust Inventory Stock</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div className="font-bold text-slate-900">{mat?.name}</div>
          <div className="text-slate-500 font-mono text-[11px] mt-0.5">{mat?.code}</div>
          <div className="mt-2 grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 font-mono-num">
            <span>On-Hand: <strong>{inv.onHandStock} {mat?.uom}</strong></span>
            <span>Allocated: <strong>{inv.allocatedStock} {mat?.uom}</strong></span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Mode</label>
            <select
              value={changeType}
              onChange={(e) => setChangeType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
            >
              <option value="add_onhand">+ Receive Stock Intake (PO Delivery)</option>
              <option value="reduce_onhand">- Write-off / Scrap / Damage Consumption</option>
              <option value="adjust_allocated">Allocate to Factory Floor Work Order</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quantity to Adjust ({mat?.uom})
            </label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono-num font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Log Reason</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Batch PO #4092 received from vendor"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              Apply Stock Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 6. SAVE PRODUCTION PLAN MODAL
interface ProductionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProductionPlanModal: React.FC<ProductionPlanModalProps> = ({ isOpen, onClose }) => {
  const {
    products,
    selectedProductId,
    selectedBomVersionId,
    plannedQuantity,
    createProductionPlan,
    currentCalculation,
  } = useApp();

  const prod = products.find((p) => p.id === selectedProductId);
  const [planNum, setPlanNum] = useState(`PLN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');

  if (!isOpen || !prod) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProductionPlan({
      planNumber: planNum.trim(),
      productId: prod.id,
      bomVersionId: selectedBomVersionId,
      plannedQuantity,
      targetCompletionDate: targetDate,
      status: 'scheduled',
      notes: notes.trim(),
      createdBy: 'Production Lead',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Commit Production Work Order</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs space-y-1">
          <div className="font-bold text-indigo-950">{prod.name} ({prod.sku})</div>
          <div className="text-slate-600 font-mono-num">
            Batch Run: <strong>{plannedQuantity} units</strong> • Est. Material Spend: <strong>{formatCurrency(currentCalculation?.totalMaterialCost || 0)}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Work Order Plan #</label>
            <input
              type="text"
              required
              value={planNum}
              onChange={(e) => setPlanNum(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Completion Date</label>
            <input
              type="date"
              required
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Production Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Assembly line notes, customer batch identifier..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs"
            >
              Save Work Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 7. PRINT PREVIEW / PDF REPORT MODAL
interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ isOpen, onClose }) => {
  const { currentCalculation } = useApp();

  if (!isOpen || !currentCalculation) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 my-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Printable Material Requirement & Costing Report
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Document Body */}
        <div className="print-break-inside-avoid space-y-5 text-slate-900">
          <div className="flex justify-between items-start border-b border-slate-200 pb-4">
            <div>
              <div className="text-xl font-extrabold tracking-tight text-slate-900">
                Material<span className="text-indigo-600">IQ</span> Enterprise
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Raw Material Requirement & BOM Costing Summary
              </div>
            </div>
            <div className="text-right text-xs text-slate-500 font-mono-num">
              <div>Date: {new Date().toLocaleDateString()}</div>
              <div>Report ID: MRP-{Date.now().toString().slice(-6)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">Finished Good:</span>
              <strong className="text-slate-900">{currentCalculation.productName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">SKU / BOM Rev:</span>
              <strong className="text-slate-900">{currentCalculation.productSku} ({currentCalculation.bomVersionNumber})</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Planned Batch Qty:</span>
              <strong className="text-indigo-600 font-mono-num text-sm">{currentCalculation.plannedQuantity} units</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Batch Material Cost:</span>
              <strong className="text-indigo-600 font-mono-num text-sm">{formatCurrency(currentCalculation.totalMaterialCost)}</strong>
            </div>
          </div>

          <div className="text-[11px] text-slate-600 bg-slate-100/60 p-2.5 rounded-lg">
            <strong>Calculation Formulae:</strong> Gross Requirement = Planned Qty × BOM Qty/Unit × (1 + Wastage %) • Net Requirement = Gross Requirement − Available Stock
          </div>

          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600">
              <tr>
                <th className="p-2 border-b">Part #</th>
                <th className="p-2 border-b">Material</th>
                <th className="p-2 text-right border-b">BOM Qty</th>
                <th className="p-2 text-right border-b">Wastage</th>
                <th className="p-2 text-right border-b font-bold">Gross Req</th>
                <th className="p-2 text-right border-b">Available</th>
                <th className="p-2 text-right border-b font-bold">Net Req</th>
                <th className="p-2 text-right border-b">Rate</th>
                <th className="p-2 text-right border-b font-bold">Total Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {currentCalculation.lines.map((l) => (
                <tr key={l.materialId}>
                  <td className="p-2 font-mono">{l.materialCode}</td>
                  <td className="p-2 font-medium">{l.materialName}</td>
                  <td className="p-2 text-right font-mono-num">{l.bomQuantityPerUnit} {l.uom}</td>
                  <td className="p-2 text-right font-mono-num">{l.wastagePercentage}%</td>
                  <td className="p-2 text-right font-mono-num font-bold">{formatQty(l.grossRequirement, l.uom)}</td>
                  <td className="p-2 text-right font-mono-num">{formatQty(l.availableStock, l.uom)}</td>
                  <td className={`p-2 text-right font-mono-num font-bold ${l.netRequirement > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {l.netRequirement > 0 ? formatQty(l.netRequirement, l.uom) : '0'}
                  </td>
                  <td className="p-2 text-right font-mono-num">{formatCurrency(l.unitRate)}</td>
                  <td className="p-2 text-right font-mono-num font-bold">{formatCurrency(l.lineTotalCost)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-xs">
              <tr>
                <td colSpan={6} className="p-2">Summary ({currentCalculation.lines.length} BOM lines)</td>
                <td colSpan={2} className="p-2 text-right">Total Material Spend:</td>
                <td className="p-2 text-right font-mono-num text-sm text-indigo-700">
                  {formatCurrency(currentCalculation.totalMaterialCost)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export type UserRole = 'admin' | 'procurement' | 'production' | 'management';

export interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
  title: string;
  department: string;
}

export type MaterialCategory = 
  | 'Electronics'
  | 'Metals & Hardware'
  | 'Plastics & Polymers'
  | 'Chemicals & Adhesives'
  | 'Packaging'
  | 'Assemblies & Modules'
  | 'Fasteners';

export type UOM = 'pcs' | 'kg' | 'g' | 'm' | 'mm' | 'l' | 'ml' | 'set' | 'roll' | 'sheet';

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  paymentTerms: string; // e.g. "Net 30", "Net 45", "Advance"
  leadTimeDays: number;
  rating: number; // 1-5
  isActive: boolean;
  country: string;
}

export interface MaterialRateRecord {
  id: string;
  materialId: string;
  supplierId: string;
  ratePerUnit: number;
  currency: string;
  effectiveDate: string;
  isContractRate: boolean;
}

export interface RawMaterial {
  id: string;
  code: string;
  name: string;
  category: MaterialCategory;
  uom: UOM;
  standardCost: number; // reference standard cost
  currentRate: number; // current market / latest rate
  preferredSupplierId: string;
  minBufferStock: number;
  leadTimeDays: number;
  description?: string;
  specifications?: string;
  lastUpdated: string;
}

export interface InventoryItem {
  materialId: string;
  onHandStock: number;
  allocatedStock: number; // Reserved for existing production
  // Available Stock = Math.max(0, onHandStock - allocatedStock)
  reorderLevel: number;
  warehouseLocation: string;
  lastStockCheck: string;
  onOrderStock: number; // incoming from POs
}

export interface BOMItem {
  id: string;
  rawMaterialId: string;
  quantityPerUnit: number;
  uom: UOM;
  wastagePercentage: number; // e.g., 2.5 for 2.5%
  notes?: string;
}

export interface BOMVersion {
  id: string;
  versionNumber: string; // e.g. "v1.0", "v1.1", "v2.0"
  status: 'draft' | 'active' | 'archived';
  effectiveDate: string;
  createdAt: string;
  createdBy: string;
  changeLog?: string;
  items: BOMItem[];
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  uom: UOM;
  description: string;
  leadTimeDays: number;
  isActive: boolean;
  sellingPrice?: number; // MRP of End Product
  requiredOutput?: number; // Target Required Output (Batch Size)
  activeBomVersionId?: string;
  bomVersions: BOMVersion[];
  createdAt: string;
}

export interface ProductionPlan {
  id: string;
  planNumber: string;
  productId: string;
  bomVersionId: string;
  plannedQuantity: number;
  targetCompletionDate: string;
  status: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  createdDate: string;
  createdBy: string;
  approvedBy?: string;
}

// Line calculation for MRP
export interface MaterialRequirementLine {
  materialId: string;
  materialCode: string;
  materialName: string;
  category: MaterialCategory;
  uom: UOM;
  bomQuantityPerUnit: number;
  wastagePercentage: number;
  // Exact Formula: Gross Requirement = Production Quantity × BOM Quantity per Unit × (1 + Wastage %)
  grossRequirement: number;
  onHandStock: number;
  allocatedStock: number;
  availableStock: number; // onHandStock - allocatedStock
  // Exact Formula: Net Requirement = Gross Requirement − Available Stock (if > 0, else 0)
  netRequirement: number;
  surplusStock: number; // if available > gross, how much remains
  stockStatus: 'sufficient' | 'low' | 'critical_shortage';
  unitRate: number;
  currency: string;
  preferredSupplierId: string;
  supplierName: string;
  supplierLeadTimeDays: number;
  // Total line material cost = grossRequirement * unitRate
  lineTotalCost: number;
  // Base unit contribution = (bomQuantityPerUnit * (1 + wastage)) * unitRate
  costPerFinishedUnit: number;
}

export interface ProductionCalculationSummary {
  productId: string;
  productName: string;
  productSku: string;
  bomVersionNumber: string;
  plannedQuantity: number;
  totalGrossItems: number;
  totalNetItemsToProcure: number;
  totalAvailableMaterialsCount: number;
  shortageMaterialsCount: number;
  totalMaterialCost: number;
  materialCostPerUnit: number;
  lines: MaterialRequirementLine[];
  calculatedAt: string;
}

export interface PurchaseRequisitionItem {
  id: string;
  requisitionNumber: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  uom: UOM;
  netRequirement: number;
  orderQuantity: number; // netRequirement adjusted for pack size / MOQ
  unitRate: number;
  totalCost: number;
  supplierId: string;
  supplierName: string;
  leadTimeDays: number;
  status: 'pending' | 'rfq_sent' | 'po_placed' | 'received';
  urgency: 'critical' | 'high' | 'normal';
  targetDeliveryDate: string;
  associatedPlanNumber?: string;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
}

export interface DataSheetRow {
  id: string; // unique identifier (linked to rawMaterialId)
  code: string;
  name: string;
  category: MaterialCategory;
  uom: UOM;
  bomQuantityPerUnit: number;
  wastagePercentage: number;
  unitRate: number;
  onHandStock: number;
  allocatedStock: number;
  minBufferStock: number;
  supplierName: string;
  leadTimeDays: number;
}

export type ActiveTab = 
  | 'dashboard'
  | 'product-material-list'
  | 'data-sheet'
  | 'production-planner'
  | 'material-requirement-sheet'
  | 'purchase-requirement'
  | 'bom-management'
  | 'cost-analysis'
  | 'inventory'
  | 'product-master'
  | 'raw-material-master'
  | 'supplier-master';

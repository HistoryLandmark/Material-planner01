import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  ActiveTab,
  BOMItem,
  BOMVersion,
  CurrencyConfig,
  DataSheetRow,
  InventoryItem,
  MaterialCategory,
  Product,
  ProductionCalculationSummary,
  ProductionPlan,
  PurchaseRequisitionItem,
  RawMaterial,
  Supplier,
  UOM,
  UserRole,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_RAW_MATERIALS,
  INITIAL_SUPPLIERS,
  INITIAL_INVENTORY,
  INITIAL_PRODUCTION_PLANS,
  INITIAL_PURCHASE_REQUISITIONS,
} from '../data/mockData';
import {
  calculateMaterialRequirements,
  SUPPORTED_CURRENCIES,
  setActiveCurrencySymbol,
} from '../utils/calculations';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;

  // Currency
  currency: CurrencyConfig;
  setCurrency: (currency: CurrencyConfig) => void;

  // Data collections
  products: Product[];
  rawMaterials: RawMaterial[];
  suppliers: Supplier[];
  inventory: Record<string, InventoryItem>;
  productionPlans: ProductionPlan[];
  purchaseRequisitions: PurchaseRequisitionItem[];

  // Planner state
  selectedProductId: string;
  setSelectedProductId: (id: string) => void;
  selectedBomVersionId: string;
  setSelectedBomVersionId: (id: string) => void;
  plannedQuantity: number;
  setPlannedQuantity: (qty: number) => void;
  rateType: 'latest' | 'standard';
  setRateType: (type: 'latest' | 'standard') => void;

  // Real-time calculation output
  currentCalculation: ProductionCalculationSummary | null;

  // Data Sheet specific operations
  dataSheetRows: DataSheetRow[];
  addDataSheetRow: (initial?: Partial<DataSheetRow>) => void;
  updateDataSheetRow: (rowId: string, updates: Partial<DataSheetRow>) => void;
  deleteDataSheetRow: (rowId: string) => void;
  bulkUpdateDataSheet: (
    rows: DataSheetRow[],
    productName?: string,
    productSku?: string,
    batchQty?: number
  ) => void;
  updateActiveProductInfo: (name: string, sku: string, sellingPrice?: number) => void;

  // Standard Operations
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  addRawMaterial: (material: Omit<RawMaterial, 'id' | 'lastUpdated'>) => void;
  updateRawMaterial: (id: string, updates: Partial<RawMaterial>) => void;
  deleteRawMaterial: (id: string) => void;

  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  addBOMVersion: (productId: string, version: Omit<BOMVersion, 'id' | 'createdAt'>) => void;
  updateBOMVersion: (productId: string, versionId: string, updates: Partial<BOMVersion>) => void;
  setActiveBOMVersion: (productId: string, versionId: string) => void;
  cloneBOMVersion: (productId: string, sourceVersionId: string, newVersionNumber: string) => void;

  adjustInventoryStock: (materialId: string, changeQty: number, reason: string, isAllocatedChange?: boolean) => void;
  updateInventoryDetails: (materialId: string, updates: Partial<InventoryItem>) => void;

  createProductionPlan: (plan: Omit<ProductionPlan, 'id' | 'createdDate'>) => void;
  updateProductionPlanStatus: (planId: string, status: ProductionPlan['status']) => void;
  updateProductionPlan: (planId: string, updates: Partial<ProductionPlan>) => void;

  generatePurchaseRequisitionsFromMRP: () => number;
  updatePurchaseRequisitionStatus: (prId: string, status: PurchaseRequisitionItem['status']) => void;
  updatePurchaseRequisitionItem: (prId: string, updates: Partial<PurchaseRequisitionItem>) => void;
  updateBOMItem: (productId: string, versionId: string, bomItemId: string, updates: Partial<BOMItem>) => void;

  // Product + Raw Materials Group List Operations (Fill & Upload)
  updateProductOutputAndMrp: (productId: string, requiredOutput?: number, mrp?: number) => void;
  addRawMaterialToProduct: (
    productId: string,
    material: {
      name: string;
      code?: string;
      quantityPerUnit: number;
      unitRate?: number;
      uom?: UOM;
      category?: MaterialCategory;
      wastagePercentage?: number;
    }
  ) => void;
  updateProductMaterialItem: (
    productId: string,
    rawMaterialId: string,
    updates: {
      name?: string;
      code?: string;
      quantityPerUnit?: number;
      unitRate?: number;
      uom?: UOM;
      category?: MaterialCategory;
      wastagePercentage?: number;
    }
  ) => void;
  deleteProductMaterialItem: (productId: string, rawMaterialId: string) => void;
  createProductWithRawMaterials: (productData: {
    name: string;
    sku?: string;
    requiredOutput?: number;
    mrp?: number;
    materials?: Array<{
      name: string;
      code?: string;
      quantityPerUnit: number;
      unitRate?: number;
      uom?: UOM;
    }>;
  }) => string;
  bulkImportProductsWithMaterials: (
    importedRows: Array<{
      productName: string;
      requiredOutput?: number;
      mrp?: number;
      materialName: string;
      quantity: number;
      price?: number;
      uom?: string;
    }>,
    mode?: 'append' | 'replace'
  ) => { productsAdded: number; materialsAdded: number };

  // Easy Language & Rephrasing Mode
  easyLanguageMode: boolean;
  setEasyLanguageMode: (enabled: boolean) => void;
  isRephraseModalOpen: boolean;
  setIsRephraseModalOpen: (open: boolean) => void;
  rephraseInitialTerm: string | null;
  openRephraseModalWithTerm: (termKey?: string) => void;

  // Clean / Demo management
  clearAllData: () => void;
  loadSampleData: () => void;
  resetToDemoData: () => void;

  // Permission helpers
  permissions: {
    canEditProducts: boolean;
    canEditMaterials: boolean;
    canEditSuppliers: boolean;
    canEditBOM: boolean;
    canCreatePlan: boolean;
    canProcure: boolean;
    canAdjustStock: boolean;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Clean workspace base product (starts empty without prefilled material data)
const CLEAN_PRODUCT: Product = {
  id: 'prd-custom-1',
  sku: 'SKU-FG-001',
  name: 'Finished Product',
  category: 'Assemblies & Modules',
  uom: 'pcs',
  description: 'Primary finished goods assembly',
  leadTimeDays: 7,
  isActive: true,
  sellingPrice: 0,
  activeBomVersionId: 'bom-v1-0',
  bomVersions: [
    {
      id: 'bom-v1-0',
      versionNumber: 'v1.0',
      status: 'active',
      effectiveDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: 'Production Planner',
      changeLog: 'Initial BOM draft',
      items: [],
    },
  ],
  createdAt: new Date().toISOString().split('T')[0],
};

const STORAGE_PREFIX = 'materialiq_v2_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // User Role
  const [role, setRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}role`);
    return (saved as UserRole) || 'admin';
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  // Currency Selection (Defaults to USD $, configurable to EUR, GBP, INR, JPY, etc.)
  const [currency, setCurrencyState] = useState<CurrencyConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}currency`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return SUPPORTED_CURRENCIES[0]; // USD ($)
  });

  const setCurrency = (newCurrency: CurrencyConfig) => {
    setCurrencyState(newCurrency);
    setActiveCurrencySymbol(newCurrency.symbol);
    localStorage.setItem(`${STORAGE_PREFIX}currency`, JSON.stringify(newCurrency));
  };

  // Sync calculation utility symbol on mount/change
  useEffect(() => {
    setActiveCurrencySymbol(currency.symbol);
  }, [currency]);

  // Primary Entities with Clean Workspace Defaults (No prefilled dummy data)
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}products`);
    return saved ? JSON.parse(saved) : [CLEAN_PRODUCT];
  });

  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}rawMaterials`);
    return saved ? JSON.parse(saved) : [];
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}suppliers`);
    return saved ? JSON.parse(saved) : [];
  });

  const [inventory, setInventory] = useState<Record<string, InventoryItem>>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}inventory`);
    return saved ? JSON.parse(saved) : {};
  });

  const [productionPlans, setProductionPlans] = useState<ProductionPlan[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}productionPlans`);
    return saved ? JSON.parse(saved) : [];
  });

  const [purchaseRequisitions, setPurchaseRequisitions] = useState<PurchaseRequisitionItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}purchaseRequisitions`);
    return saved ? JSON.parse(saved) : [];
  });

  // Planner State
  const [selectedProductId, setSelectedProductId] = useState<string>(() => {
    return products[0]?.id || 'prd-custom-1';
  });

  const [selectedBomVersionId, setSelectedBomVersionId] = useState<string>(() => {
    const p = products[0];
    return p?.activeBomVersionId || p?.bomVersions[0]?.id || 'bom-v1-0';
  });

  const [plannedQuantity, setPlannedQuantity] = useState<number>(100);
  const [rateType, setRateType] = useState<'latest' | 'standard'>('latest');

  // Easy Language & Rephrasing Mode State
  const [easyLanguageMode, setEasyLanguageModeState] = useState<boolean>(() => {
    return localStorage.getItem(`${STORAGE_PREFIX}easy_language`) === 'true';
  });
  const setEasyLanguageMode = (enabled: boolean) => {
    setEasyLanguageModeState(enabled);
    localStorage.setItem(`${STORAGE_PREFIX}easy_language`, enabled ? 'true' : 'false');
  };

  const [isRephraseModalOpen, setIsRephraseModalOpen] = useState(false);
  const [rephraseInitialTerm, setRephraseInitialTerm] = useState<string | null>(null);

  const openRephraseModalWithTerm = (termKey?: string) => {
    setRephraseInitialTerm(termKey || null);
    setIsRephraseModalOpen(true);
  };

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}role`, role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}products`, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}rawMaterials`, JSON.stringify(rawMaterials));
  }, [rawMaterials]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}suppliers`, JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}inventory`, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}productionPlans`, JSON.stringify(productionPlans));
  }, [productionPlans]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}purchaseRequisitions`, JSON.stringify(purchaseRequisitions));
  }, [purchaseRequisitions]);

  // When selected product changes, synchronize selected BOM version
  useEffect(() => {
    const prod = products.find((p) => p.id === selectedProductId) || products[0];
    if (prod) {
      const activeVer = prod.bomVersions.find((v) => v.id === prod.activeBomVersionId) || prod.bomVersions[0];
      if (activeVer && activeVer.id !== selectedBomVersionId) {
        setSelectedBomVersionId(activeVer.id);
      }
    }
  }, [selectedProductId, products]);

  // Real-Time MRP & BOM Calculation (Reflects live onto Dashboard)
  const currentCalculation = useMemo(() => {
    const product = products.find((p) => p.id === selectedProductId) || products[0];
    if (!product) return null;

    const bomVersion = product.bomVersions.find((v) => v.id === selectedBomVersionId) || product.bomVersions[0];
    if (!bomVersion) return null;

    const suppliersMap = suppliers.reduce((acc, s) => {
      acc[s.id] = s;
      return acc;
    }, {} as Record<string, Supplier>);

    return calculateMaterialRequirements(
      product,
      bomVersion,
      plannedQuantity,
      rawMaterials,
      inventory,
      suppliersMap,
      rateType
    );
  }, [selectedProductId, selectedBomVersionId, plannedQuantity, rateType, products, rawMaterials, inventory, suppliers, currency]);

  // Data Sheet Rows: Unified spreadsheet view directly mapped from rawMaterials & BOM
  const dataSheetRows: DataSheetRow[] = useMemo(() => {
    const activeProduct = products.find((p) => p.id === selectedProductId) || products[0];
    const activeVer = activeProduct?.bomVersions.find((v) => v.id === selectedBomVersionId) || activeProduct?.bomVersions[0];
    const bomItems = activeVer?.items || [];
    const bomItemMap = new Map<string, BOMItem>(bomItems.map((item) => [item.rawMaterialId, item]));
    const suppliersMap = new Map<string, Supplier>(suppliers.map((s) => [s.id, s]));

    return rawMaterials.map((rm) => {
      const bomItem = bomItemMap.get(rm.id);
      const inv = inventory[rm.id] || {
        materialId: rm.id,
        onHandStock: 0,
        allocatedStock: 0,
        reorderLevel: rm.minBufferStock || 0,
        warehouseLocation: 'Main Warehouse',
        lastStockCheck: '',
        onOrderStock: 0,
      };
      const sup = rm.preferredSupplierId ? suppliersMap.get(rm.preferredSupplierId) : undefined;

      return {
        id: rm.id,
        code: rm.code,
        name: rm.name,
        category: rm.category,
        uom: rm.uom,
        bomQuantityPerUnit: bomItem ? bomItem.quantityPerUnit : 1,
        wastagePercentage: bomItem ? bomItem.wastagePercentage : 0,
        unitRate: rm.currentRate,
        onHandStock: inv.onHandStock,
        allocatedStock: inv.allocatedStock,
        minBufferStock: rm.minBufferStock,
        supplierName: sup ? sup.name : 'Preferred Supplier',
        leadTimeDays: rm.leadTimeDays,
      };
    });
  }, [products, selectedProductId, selectedBomVersionId, rawMaterials, inventory, suppliers]);

  // Add new row to Data Sheet (live updates Raw Material, BOM item, and Warehouse Stock)
  const addDataSheetRow = (initial?: Partial<DataSheetRow>) => {
    const newId = `rm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nextNum = rawMaterials.length + 1;
    const defaultCode = initial?.code || `RM-${String(nextNum).padStart(3, '0')}`;
    const defaultName = initial?.name || `Material ${nextNum}`;
    const defaultCategory: MaterialCategory = initial?.category || 'Metals & Hardware';
    const defaultUom: UOM = initial?.uom || 'pcs';
    const defaultRate = initial?.unitRate ?? 0;
    const defaultBuffer = initial?.minBufferStock ?? 0;
    const defaultLeadTime = initial?.leadTimeDays ?? 7;

    const newMaterial: RawMaterial = {
      id: newId,
      code: defaultCode,
      name: defaultName,
      category: defaultCategory,
      uom: defaultUom,
      standardCost: defaultRate,
      currentRate: defaultRate,
      preferredSupplierId: 'sup-gen',
      minBufferStock: defaultBuffer,
      leadTimeDays: defaultLeadTime,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    setRawMaterials((prev) => [...prev, newMaterial]);

    // Add to active product BOM version
    setProducts((prev) => {
      const targetProdId = selectedProductId || prev[0]?.id;
      return prev.map((p) => {
        if (p.id !== targetProdId) return p;
        const targetVerId = selectedBomVersionId || p.activeBomVersionId || p.bomVersions[0]?.id;
        const updatedVersions = p.bomVersions.map((v) => {
          if (v.id !== targetVerId && v.id !== p.bomVersions[0]?.id) return v;
          return {
            ...v,
            items: [
              ...v.items,
              {
                id: `bom-item-${Date.now()}`,
                rawMaterialId: newId,
                quantityPerUnit: initial?.bomQuantityPerUnit ?? 1,
                wastagePercentage: initial?.wastagePercentage ?? 0,
                uom: defaultUom,
              },
            ],
          };
        });
        return { ...p, bomVersions: updatedVersions };
      });
    });

    // Add to inventory
    setInventory((prev) => ({
      ...prev,
      [newId]: {
        materialId: newId,
        onHandStock: initial?.onHandStock ?? 0,
        allocatedStock: initial?.allocatedStock ?? 0,
        reorderLevel: defaultBuffer,
        warehouseLocation: 'Main Warehouse',
        lastStockCheck: new Date().toISOString().split('T')[0],
        onOrderStock: 0,
      },
    }));
  };

  // Update a row in the Data Sheet (immediately recalculates Dashboard & MRP)
  const updateDataSheetRow = (rowId: string, updates: Partial<DataSheetRow>) => {
    // 1. Update rawMaterials
    setRawMaterials((prev) =>
      prev.map((rm) => {
        if (rm.id !== rowId) return rm;
        return {
          ...rm,
          code: updates.code !== undefined ? updates.code : rm.code,
          name: updates.name !== undefined ? updates.name : rm.name,
          category: updates.category !== undefined ? updates.category : rm.category,
          uom: updates.uom !== undefined ? updates.uom : rm.uom,
          currentRate: updates.unitRate !== undefined ? updates.unitRate : rm.currentRate,
          standardCost: updates.unitRate !== undefined ? updates.unitRate : rm.standardCost,
          minBufferStock: updates.minBufferStock !== undefined ? updates.minBufferStock : rm.minBufferStock,
          leadTimeDays: updates.leadTimeDays !== undefined ? updates.leadTimeDays : rm.leadTimeDays,
          lastUpdated: new Date().toISOString().split('T')[0],
        };
      })
    );

    // 2. Update BOM Version items
    setProducts((prev) => {
      const targetProdId = selectedProductId || prev[0]?.id;
      return prev.map((p) => {
        if (p.id !== targetProdId) return p;
        const targetVerId = selectedBomVersionId || p.activeBomVersionId || p.bomVersions[0]?.id;
        const updatedVersions = p.bomVersions.map((v) => {
          if (v.id !== targetVerId && v.id !== p.bomVersions[0]?.id) return v;
          const exists = v.items.some((item) => item.rawMaterialId === rowId);
          let newItems;
          if (exists) {
            newItems = v.items.map((item) => {
              if (item.rawMaterialId !== rowId) return item;
              return {
                ...item,
                quantityPerUnit:
                  updates.bomQuantityPerUnit !== undefined ? updates.bomQuantityPerUnit : item.quantityPerUnit,
                wastagePercentage:
                  updates.wastagePercentage !== undefined ? updates.wastagePercentage : item.wastagePercentage,
                uom: updates.uom !== undefined ? updates.uom : item.uom,
              };
            });
          } else {
            newItems = [
              ...v.items,
              {
                id: `bom-item-${Date.now()}`,
                rawMaterialId: rowId,
                quantityPerUnit: updates.bomQuantityPerUnit ?? 1,
                wastagePercentage: updates.wastagePercentage ?? 0,
                uom: updates.uom ?? 'pcs',
              },
            ];
          }
          return { ...v, items: newItems };
        });
        return { ...p, bomVersions: updatedVersions };
      });
    });

    // 3. Update Inventory
    setInventory((prev) => {
      const cur = prev[rowId] || {
        materialId: rowId,
        onHandStock: 0,
        allocatedStock: 0,
        reorderLevel: 0,
        warehouseLocation: 'Main Warehouse',
        lastStockCheck: new Date().toISOString().split('T')[0],
        onOrderStock: 0,
      };
      return {
        ...prev,
        [rowId]: {
          ...cur,
          onHandStock: updates.onHandStock !== undefined ? updates.onHandStock : cur.onHandStock,
          allocatedStock: updates.allocatedStock !== undefined ? updates.allocatedStock : cur.allocatedStock,
          reorderLevel: updates.minBufferStock !== undefined ? updates.minBufferStock : cur.reorderLevel,
        },
      };
    });
  };

  // Delete row from Data Sheet
  const deleteDataSheetRow = (rowId: string) => {
    setRawMaterials((prev) => prev.filter((rm) => rm.id !== rowId));

    setProducts((prev) => {
      return prev.map((p) => {
        const updatedVersions = p.bomVersions.map((v) => ({
          ...v,
          items: v.items.filter((item) => item.rawMaterialId !== rowId),
        }));
        return { ...p, bomVersions: updatedVersions };
      });
    });

    setInventory((prev) => {
      const copy = { ...prev };
      delete copy[rowId];
      return copy;
    });
  };

  // Bulk update data sheet (e.g. from pasted spreadsheet or CSV file)
  const bulkUpdateDataSheet = (
    rows: DataSheetRow[],
    productName?: string,
    productSku?: string,
    batchQty?: number
  ) => {
    if (batchQty !== undefined && batchQty > 0) {
      setPlannedQuantity(batchQty);
    }

    const newRawMaterials: RawMaterial[] = [];
    const newInventory: Record<string, InventoryItem> = {};
    const newBomItems: any[] = [];

    rows.forEach((row, idx) => {
      const matId = row.id || `rm-${Date.now()}-${idx}`;
      newRawMaterials.push({
        id: matId,
        code: row.code || `RM-${String(idx + 1).padStart(3, '0')}`,
        name: row.name || `Component ${idx + 1}`,
        category: row.category || 'Metals & Hardware',
        uom: row.uom || 'pcs',
        standardCost: Number(row.unitRate) || 0,
        currentRate: Number(row.unitRate) || 0,
        preferredSupplierId: 'sup-gen',
        minBufferStock: Number(row.minBufferStock) || 0,
        leadTimeDays: Number(row.leadTimeDays) || 7,
        lastUpdated: new Date().toISOString().split('T')[0],
      });

      newInventory[matId] = {
        materialId: matId,
        onHandStock: Number(row.onHandStock) || 0,
        allocatedStock: Number(row.allocatedStock) || 0,
        reorderLevel: Number(row.minBufferStock) || 0,
        warehouseLocation: 'Main Warehouse',
        lastStockCheck: new Date().toISOString().split('T')[0],
        onOrderStock: 0,
      };

      newBomItems.push({
        id: `bom-item-${idx}-${Date.now()}`,
        rawMaterialId: matId,
        quantityPerUnit: Number(row.bomQuantityPerUnit) || 1,
        wastagePercentage: Number(row.wastagePercentage) || 0,
        uom: row.uom || 'pcs',
      });
    });

    setRawMaterials(newRawMaterials);
    setInventory(newInventory);

    setProducts((prev) => {
      const targetProdId = selectedProductId || prev[0]?.id;
      return prev.map((p) => {
        if (p.id !== targetProdId) return p;
        const targetVerId = selectedBomVersionId || p.activeBomVersionId || p.bomVersions[0]?.id;
        const updatedVersions = p.bomVersions.map((v) => {
          if (v.id !== targetVerId && v.id !== p.bomVersions[0]?.id) return v;
          return {
            ...v,
            items: newBomItems,
          };
        });
        return {
          ...p,
          name: productName || p.name,
          sku: productSku || p.sku,
          bomVersions: updatedVersions,
        };
      });
    });
  };

  // Update target product metadata directly from the data sheet header
  const updateActiveProductInfo = (name: string, sku: string, sellingPrice?: number) => {
    setProducts((prev) => {
      const targetProdId = selectedProductId || prev[0]?.id;
      return prev.map((p) => {
        if (p.id !== targetProdId) return p;
        return {
          ...p,
          name,
          sku,
          sellingPrice: sellingPrice !== undefined ? sellingPrice : p.sellingPrice,
        };
      });
    });
  };

  // Clear all data to start completely fresh with clean empty workspace
  const clearAllData = () => {
    setProducts([
      {
        ...CLEAN_PRODUCT,
        name: 'Finished Product',
        sku: 'SKU-001',
        bomVersions: [
          {
            ...CLEAN_PRODUCT.bomVersions[0],
            items: [],
          },
        ],
      },
    ]);
    setRawMaterials([]);
    setSuppliers([]);
    setInventory({});
    setProductionPlans([]);
    setPurchaseRequisitions([]);
    setSelectedProductId('prd-custom-1');
    setSelectedBomVersionId('bom-v1-0');
    setPlannedQuantity(100);

    localStorage.removeItem(`${STORAGE_PREFIX}products`);
    localStorage.removeItem(`${STORAGE_PREFIX}rawMaterials`);
    localStorage.removeItem(`${STORAGE_PREFIX}suppliers`);
    localStorage.removeItem(`${STORAGE_PREFIX}inventory`);
    localStorage.removeItem(`${STORAGE_PREFIX}productionPlans`);
    localStorage.removeItem(`${STORAGE_PREFIX}purchaseRequisitions`);
  };

  // Load sample dataset for testing/exploration
  const loadSampleData = () => {
    setProducts(INITIAL_PRODUCTS);
    setRawMaterials(INITIAL_RAW_MATERIALS);
    setSuppliers(INITIAL_SUPPLIERS);
    setInventory(INITIAL_INVENTORY);
    setProductionPlans(INITIAL_PRODUCTION_PLANS);
    setPurchaseRequisitions(INITIAL_PURCHASE_REQUISITIONS);
    setSelectedProductId(INITIAL_PRODUCTS[0].id);
    setSelectedBomVersionId(INITIAL_PRODUCTS[0].activeBomVersionId || 'bom-v1-2');
    setPlannedQuantity(500);
  };

  const resetToDemoData = loadSampleData;

  // Role Permissions
  const permissions = useMemo(() => {
    switch (role) {
      case 'admin':
        return {
          canEditProducts: true,
          canEditMaterials: true,
          canEditSuppliers: true,
          canEditBOM: true,
          canCreatePlan: true,
          canProcure: true,
          canAdjustStock: true,
        };
      case 'procurement':
        return {
          canEditProducts: false,
          canEditMaterials: true,
          canEditSuppliers: true,
          canEditBOM: false,
          canCreatePlan: false,
          canProcure: true,
          canAdjustStock: true,
        };
      case 'production':
        return {
          canEditProducts: true,
          canEditMaterials: false,
          canEditSuppliers: false,
          canEditBOM: true,
          canCreatePlan: true,
          canProcure: false,
          canAdjustStock: true,
        };
      case 'management':
        return {
          canEditProducts: false,
          canEditMaterials: false,
          canEditSuppliers: false,
          canEditBOM: false,
          canCreatePlan: false,
          canProcure: false,
          canAdjustStock: false,
        };
    }
  }, [role]);

  // Standard Product Operations
  const addProduct = (productData: Omit<Product, 'id' | 'createdAt'>) => {
    const newId = `prd-${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setProducts((prev) => [newProduct, ...prev]);
    setSelectedProductId(newId);
    if (newProduct.bomVersions[0]) {
      setSelectedBomVersionId(newProduct.bomVersions[0].id);
    }
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (selectedProductId === id && products.length > 1) {
      const remaining = products.filter((p) => p.id !== id);
      setSelectedProductId(remaining[0].id);
    }
  };

  // Raw Material Operations
  const addRawMaterial = (materialData: Omit<RawMaterial, 'id' | 'lastUpdated'>) => {
    const newId = `mat-${Date.now()}`;
    const newMaterial: RawMaterial = {
      ...materialData,
      id: newId,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    setRawMaterials((prev) => [...prev, newMaterial]);

    // Automatically initialize inventory entry
    setInventory((prev) => ({
      ...prev,
      [newId]: {
        materialId: newId,
        onHandStock: 0,
        allocatedStock: 0,
        reorderLevel: newMaterial.minBufferStock,
        warehouseLocation: 'Main Warehouse',
        lastStockCheck: new Date().toISOString().split('T')[0],
        onOrderStock: 0,
      },
    }));
  };

  const updateRawMaterial = (id: string, updates: Partial<RawMaterial>) => {
    setRawMaterials((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              ...updates,
              lastUpdated: new Date().toISOString().split('T')[0],
            }
          : m
      )
    );
  };

  const deleteRawMaterial = (id: string) => {
    setRawMaterials((prev) => prev.filter((m) => m.id !== id));
    // Remove from BOMs
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        bomVersions: p.bomVersions.map((v) => ({
          ...v,
          items: v.items.filter((item) => item.rawMaterialId !== id),
        })),
      }))
    );
  };

  // Supplier Operations
  const addSupplier = (supplierData: Omit<Supplier, 'id'>) => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: `sup-${Date.now()}`,
    };
    setSuppliers((prev) => [...prev, newSupplier]);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
  };

  // BOM Revision Control
  const addBOMVersion = (productId: string, versionData: Omit<BOMVersion, 'id' | 'createdAt'>) => {
    const newVersionId = `bom-v-${Date.now()}`;
    const newVersion: BOMVersion = {
      ...versionData,
      id: newVersionId,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          bomVersions: [...p.bomVersions, newVersion],
        };
      })
    );
  };

  const updateBOMVersion = (productId: string, versionId: string, updates: Partial<BOMVersion>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          bomVersions: p.bomVersions.map((v) => (v.id === versionId ? { ...v, ...updates } : v)),
        };
      })
    );
  };

  const setActiveBOMVersion = (productId: string, versionId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          activeBomVersionId: versionId,
          bomVersions: p.bomVersions.map((v) => ({
            ...v,
            status: v.id === versionId ? 'active' : v.status === 'active' ? 'archived' : v.status,
          })),
        };
      })
    );
    setSelectedBomVersionId(versionId);
  };

  const cloneBOMVersion = (productId: string, sourceVersionId: string, newVersionNumber: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const sourceVer = prod.bomVersions.find((v) => v.id === sourceVersionId);
    if (!sourceVer) return;

    const newVersionId = `bom-v-${Date.now()}`;
    const clonedVersion: BOMVersion = {
      id: newVersionId,
      versionNumber: newVersionNumber,
      status: 'draft',
      effectiveDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: `${role.toUpperCase()} User`,
      changeLog: `Cloned from ${sourceVer.versionNumber}`,
      items: sourceVer.items.map((item) => ({
        ...item,
        id: `bom-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      })),
    };

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, bomVersions: [...p.bomVersions, clonedVersion] } : p))
    );
    setSelectedBomVersionId(newVersionId);
  };

  // Inventory Adjustments
  const adjustInventoryStock = (materialId: string, changeQty: number, _reason: string, isAllocatedChange = false) => {
    setInventory((prev) => {
      const current = prev[materialId] || {
        materialId,
        onHandStock: 0,
        allocatedStock: 0,
        reorderLevel: 100,
        warehouseLocation: 'Main Warehouse',
        lastStockCheck: new Date().toISOString().split('T')[0],
        onOrderStock: 0,
      };

      if (isAllocatedChange) {
        return {
          ...prev,
          [materialId]: {
            ...current,
            allocatedStock: Math.max(0, current.allocatedStock + changeQty),
            lastStockCheck: new Date().toISOString().split('T')[0],
          },
        };
      }

      return {
        ...prev,
        [materialId]: {
          ...current,
          onHandStock: Math.max(0, current.onHandStock + changeQty),
          lastStockCheck: new Date().toISOString().split('T')[0],
        },
      };
    });
  };

  const updateInventoryDetails = (materialId: string, updates: Partial<InventoryItem>) => {
    setInventory((prev) => ({
      ...prev,
      [materialId]: {
        ...(prev[materialId] || {
          materialId,
          onHandStock: 0,
          allocatedStock: 0,
          reorderLevel: 100,
          warehouseLocation: 'Main Warehouse',
          lastStockCheck: new Date().toISOString().split('T')[0],
          onOrderStock: 0,
        }),
        ...updates,
      },
    }));
  };

  // Production Plans
  const createProductionPlan = (planData: Omit<ProductionPlan, 'id' | 'createdDate'>) => {
    const newPlan: ProductionPlan = {
      ...planData,
      id: `plan-${Date.now()}`,
      createdDate: new Date().toISOString().split('T')[0],
    };
    setProductionPlans((prev) => [newPlan, ...prev]);
  };

  const updateProductionPlanStatus = (planId: string, status: ProductionPlan['status']) => {
    setProductionPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, status } : p)));
  };

  const updateProductionPlan = (planId: string, updates: Partial<ProductionPlan>) => {
    setProductionPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, ...updates } : p)));
  };

  // Purchase Requisitions Auto-Generation
  const generatePurchaseRequisitionsFromMRP = (): number => {
    if (!currentCalculation) return 0;

    const shortageLines = currentCalculation.lines.filter((l) => l.netRequirement > 0);
    if (shortageLines.length === 0) return 0;

    const newRequisitions: PurchaseRequisitionItem[] = shortageLines.map((line, idx) => {
      const roundedOrderQty = Math.ceil(line.netRequirement);
      return {
        id: `pr-${Date.now()}-${idx}`,
        requisitionNumber: `PR-${new Date().getFullYear()}-${String(purchaseRequisitions.length + idx + 101).padStart(4, '0')}`,
        materialId: line.materialId,
        materialCode: line.materialCode,
        materialName: line.materialName,
        uom: line.uom,
        netRequirement: line.netRequirement,
        orderQuantity: roundedOrderQty,
        unitRate: line.unitRate,
        totalCost: Number((roundedOrderQty * line.unitRate).toFixed(2)),
        supplierId: line.preferredSupplierId,
        supplierName: line.supplierName,
        leadTimeDays: line.supplierLeadTimeDays,
        status: 'pending',
        urgency: line.stockStatus === 'critical_shortage' ? 'critical' : 'high',
        targetDeliveryDate: new Date(Date.now() + line.supplierLeadTimeDays * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        associatedPlanNumber: `RUN-${currentCalculation.productSku}-${currentCalculation.plannedQuantity}`,
      };
    });

    setPurchaseRequisitions((prev) => [...newRequisitions, ...prev]);
    return newRequisitions.length;
  };

  const updatePurchaseRequisitionStatus = (prId: string, status: PurchaseRequisitionItem['status']) => {
    setPurchaseRequisitions((prev) => prev.map((pr) => (pr.id === prId ? { ...pr, status } : pr)));
  };

  const updatePurchaseRequisitionItem = (prId: string, updates: Partial<PurchaseRequisitionItem>) => {
    setPurchaseRequisitions((prev) =>
      prev.map((pr) => {
        if (pr.id !== prId) return pr;
        const updated = { ...pr, ...updates };
        if (updates.orderQuantity !== undefined || updates.unitRate !== undefined) {
          const qty = updates.orderQuantity !== undefined ? updates.orderQuantity : updated.orderQuantity;
          const rate = updates.unitRate !== undefined ? updates.unitRate : updated.unitRate;
          updated.totalCost = Number((qty * rate).toFixed(2));
        }
        return updated;
      })
    );
  };

  const updateBOMItem = (productId: string, versionId: string, bomItemId: string, updates: Partial<BOMItem>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const updatedVersions = p.bomVersions.map((v) => {
          if (v.id !== versionId) return v;
          const updatedItems = v.items.map((item) => {
            if (item.id !== bomItemId) return item;
            return { ...item, ...updates };
          });
          return { ...v, items: updatedItems };
        });
        return { ...p, bomVersions: updatedVersions };
      })
    );
  };

  // Product + Raw Materials Group List Operations (Fill & Upload)
  const updateProductOutputAndMrp = (productId: string, requiredOutput?: number, mrp?: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          requiredOutput: requiredOutput !== undefined ? Math.max(1, requiredOutput) : (p.requiredOutput || 100),
          sellingPrice: mrp !== undefined ? Math.max(0, mrp) : (p.sellingPrice || 0),
        };
      })
    );
    if (productId === selectedProductId && requiredOutput !== undefined) {
      setPlannedQuantity(Math.max(1, requiredOutput));
    }
  };

  const addRawMaterialToProduct = (
    productId: string,
    material: {
      name: string;
      code?: string;
      quantityPerUnit: number;
      unitRate?: number;
      uom?: UOM;
      category?: MaterialCategory;
      wastagePercentage?: number;
    }
  ) => {
    const newId = `rm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nextNum = rawMaterials.length + 1;
    const defaultCode = material.code || `RM-${String(nextNum).padStart(3, '0')}`;
    const defaultName = material.name || `Raw Material ${nextNum}`;
    const defaultCategory: MaterialCategory = material.category || 'Metals & Hardware';
    const defaultUom: UOM = material.uom || 'pcs';
    const defaultRate = material.unitRate !== undefined ? Number(material.unitRate) || 0 : 0;
    const defaultQty = material.quantityPerUnit !== undefined ? Number(material.quantityPerUnit) || 1 : 1;
    const defaultWastage = material.wastagePercentage !== undefined ? Number(material.wastagePercentage) || 0 : 0;

    const newMaterial: RawMaterial = {
      id: newId,
      code: defaultCode,
      name: defaultName,
      category: defaultCategory,
      uom: defaultUom,
      standardCost: defaultRate,
      currentRate: defaultRate,
      preferredSupplierId: 'sup-gen',
      minBufferStock: 0,
      leadTimeDays: 7,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    setRawMaterials((prev) => [...prev, newMaterial]);

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const targetVerId = p.activeBomVersionId || p.bomVersions[0]?.id;
        const updatedVersions = p.bomVersions.map((v) => {
          if (v.id !== targetVerId && v.id !== p.bomVersions[0]?.id) return v;
          return {
            ...v,
            items: [
              ...v.items,
              {
                id: `bom-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                rawMaterialId: newId,
                quantityPerUnit: defaultQty,
                wastagePercentage: defaultWastage,
                uom: defaultUom,
              },
            ],
          };
        });
        return { ...p, bomVersions: updatedVersions };
      })
    );

    setInventory((prev) => ({
      ...prev,
      [newId]: {
        materialId: newId,
        onHandStock: 0,
        allocatedStock: 0,
        reorderLevel: 0,
        warehouseLocation: 'Main Warehouse',
        lastStockCheck: new Date().toISOString().split('T')[0],
        onOrderStock: 0,
      },
    }));
  };

  const updateProductMaterialItem = (
    productId: string,
    rawMaterialId: string,
    updates: {
      name?: string;
      code?: string;
      quantityPerUnit?: number;
      unitRate?: number;
      uom?: UOM;
      category?: MaterialCategory;
      wastagePercentage?: number;
    }
  ) => {
    // 1. Update raw material record
    setRawMaterials((prev) =>
      prev.map((rm) => {
        if (rm.id !== rawMaterialId) return rm;
        return {
          ...rm,
          name: updates.name !== undefined ? updates.name : rm.name,
          code: updates.code !== undefined ? updates.code : rm.code,
          currentRate: updates.unitRate !== undefined ? Number(updates.unitRate) || 0 : rm.currentRate,
          standardCost: updates.unitRate !== undefined ? Number(updates.unitRate) || 0 : rm.standardCost,
          uom: updates.uom !== undefined ? updates.uom : rm.uom,
          category: updates.category !== undefined ? updates.category : rm.category,
          lastUpdated: new Date().toISOString().split('T')[0],
        };
      })
    );

    // 2. Update BOM item in product
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const targetVerId = p.activeBomVersionId || p.bomVersions[0]?.id;
        const updatedVersions = p.bomVersions.map((v) => {
          if (v.id !== targetVerId && v.id !== p.bomVersions[0]?.id) return v;
          return {
            ...v,
            items: v.items.map((it) => {
              if (it.rawMaterialId !== rawMaterialId) return it;
              return {
                ...it,
                quantityPerUnit:
                  updates.quantityPerUnit !== undefined ? Number(updates.quantityPerUnit) || 1 : it.quantityPerUnit,
                wastagePercentage:
                  updates.wastagePercentage !== undefined
                    ? Number(updates.wastagePercentage) || 0
                    : it.wastagePercentage,
                uom: updates.uom !== undefined ? updates.uom : it.uom,
              };
            }),
          };
        });
        return { ...p, bomVersions: updatedVersions };
      })
    );
  };

  const deleteProductMaterialItem = (productId: string, rawMaterialId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          bomVersions: p.bomVersions.map((v) => ({
            ...v,
            items: v.items.filter((it) => it.rawMaterialId !== rawMaterialId),
          })),
        };
      })
    );
  };

  const createProductWithRawMaterials = (productData: {
    name: string;
    sku?: string;
    requiredOutput?: number;
    mrp?: number;
    materials?: Array<{
      name: string;
      code?: string;
      quantityPerUnit: number;
      unitRate?: number;
      uom?: UOM;
    }>;
  }): string => {
    const newProdId = `prd-${Date.now()}`;
    const newVerId = `bom-${Date.now()}`;
    const newSku = productData.sku || `SKU-${Date.now().toString().slice(-4)}`;
    const outputQty = productData.requiredOutput && productData.requiredOutput > 0 ? productData.requiredOutput : 100;
    const mrp = productData.mrp !== undefined ? productData.mrp : 0;

    const bomItems: BOMItem[] = [];
    const newMaterialsList: RawMaterial[] = [];
    const newInventoryList: Record<string, InventoryItem> = {};

    (productData.materials || []).forEach((mat, idx) => {
      const matId = `rm-${Date.now()}-${idx}`;
      const matCode = mat.code || `RM-${String(rawMaterials.length + idx + 1).padStart(3, '0')}`;
      const rate = mat.unitRate !== undefined ? Number(mat.unitRate) || 0 : 0;
      const uom: UOM = mat.uom || 'pcs';

      newMaterialsList.push({
        id: matId,
        code: matCode,
        name: mat.name,
        category: 'Metals & Hardware',
        uom,
        standardCost: rate,
        currentRate: rate,
        preferredSupplierId: 'sup-gen',
        minBufferStock: 0,
        leadTimeDays: 7,
        lastUpdated: new Date().toISOString().split('T')[0],
      });

      newInventoryList[matId] = {
        materialId: matId,
        onHandStock: 0,
        allocatedStock: 0,
        reorderLevel: 0,
        warehouseLocation: 'Main Warehouse',
        lastStockCheck: new Date().toISOString().split('T')[0],
        onOrderStock: 0,
      };

      bomItems.push({
        id: `bom-item-${Date.now()}-${idx}`,
        rawMaterialId: matId,
        quantityPerUnit: Number(mat.quantityPerUnit) || 1,
        wastagePercentage: 0,
        uom,
      });
    });

    const newProduct: Product = {
      id: newProdId,
      sku: newSku,
      name: productData.name,
      category: 'Assemblies & Modules',
      uom: 'pcs',
      description: 'Manufactured finished product',
      leadTimeDays: 14,
      isActive: true,
      sellingPrice: mrp,
      requiredOutput: outputQty,
      activeBomVersionId: newVerId,
      createdAt: new Date().toISOString().split('T')[0],
      bomVersions: [
        {
          id: newVerId,
          versionNumber: 'v1.0',
          status: 'active',
          effectiveDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString().split('T')[0],
          createdBy: 'Production Planner',
          items: bomItems,
        },
      ],
    };

    if (newMaterialsList.length > 0) {
      setRawMaterials((prev) => [...prev, ...newMaterialsList]);
      setInventory((prev) => ({ ...prev, ...newInventoryList }));
    }

    setProducts((prev) => [newProduct, ...prev]);
    setSelectedProductId(newProdId);
    setSelectedBomVersionId(newVerId);
    setPlannedQuantity(outputQty);

    return newProdId;
  };

  const bulkImportProductsWithMaterials = (
    importedRows: Array<{
      productName: string;
      requiredOutput?: number;
      mrp?: number;
      materialName: string;
      quantity: number;
      price?: number;
      uom?: string;
    }>,
    mode: 'append' | 'replace' = 'append'
  ): { productsAdded: number; materialsAdded: number } => {
    if (!importedRows || importedRows.length === 0) {
      return { productsAdded: 0, materialsAdded: 0 };
    }

    // Group rows by product name
    const groupedMap = new Map<
      string,
      {
        requiredOutput: number;
        mrp: number;
        materials: Array<{ name: string; quantity: number; price: number; uom: UOM }>;
      }
    >();

    let currentProdName = '';
    let currentOutput = 100;
    let currentMrp = 0;

    importedRows.forEach((row) => {
      const pName = (row.productName && row.productName.trim()) || currentProdName || 'Finished Product';
      currentProdName = pName;
      if (row.requiredOutput !== undefined && row.requiredOutput > 0) {
        currentOutput = row.requiredOutput;
      }
      if (row.mrp !== undefined && row.mrp >= 0) {
        currentMrp = row.mrp;
      }

      const matName = (row.materialName && row.materialName.trim()) || 'Raw Material';
      const qty = Number(row.quantity) > 0 ? Number(row.quantity) : 1;
      const rate = Number(row.price) >= 0 ? Number(row.price) : 0;
      const validUoms: UOM[] = ['pcs', 'kg', 'g', 'm', 'mm', 'l', 'ml', 'set', 'roll', 'sheet'];
      const rawUom = (row.uom || 'pcs').toLowerCase();
      const uom: UOM = validUoms.includes(rawUom as UOM) ? (rawUom as UOM) : 'pcs';

      if (!groupedMap.has(pName)) {
        groupedMap.set(pName, {
          requiredOutput: currentOutput,
          mrp: currentMrp,
          materials: [],
        });
      }

      const entry = groupedMap.get(pName)!;
      if (row.requiredOutput !== undefined && row.requiredOutput > 0) {
        entry.requiredOutput = row.requiredOutput;
      }
      if (row.mrp !== undefined && row.mrp >= 0) {
        entry.mrp = row.mrp;
      }

      entry.materials.push({
        name: matName,
        quantity: qty,
        price: rate,
        uom,
      });
    });

    const newProducts: Product[] = [];
    const newRawMaterials: RawMaterial[] = [];
    const newInventory: Record<string, InventoryItem> = {};
    let totalMaterialsAdded = 0;

    let pIndex = 0;
    groupedMap.forEach((group, pName) => {
      pIndex++;
      const prodId = `prd-imp-${Date.now()}-${pIndex}`;
      const bomVerId = `bom-imp-${Date.now()}-${pIndex}`;
      const bomItems: BOMItem[] = [];

      group.materials.forEach((mat, mIdx) => {
        totalMaterialsAdded++;
        const matId = `rm-imp-${Date.now()}-${pIndex}-${mIdx}`;
        const matCode = `RM-IMP-${String(pIndex).padStart(2, '0')}${String(mIdx + 1).padStart(2, '0')}`;

        newRawMaterials.push({
          id: matId,
          code: matCode,
          name: mat.name,
          category: 'Metals & Hardware',
          uom: mat.uom,
          standardCost: mat.price,
          currentRate: mat.price,
          preferredSupplierId: 'sup-gen',
          minBufferStock: 0,
          leadTimeDays: 7,
          lastUpdated: new Date().toISOString().split('T')[0],
        });

        newInventory[matId] = {
          materialId: matId,
          onHandStock: 0,
          allocatedStock: 0,
          reorderLevel: 0,
          warehouseLocation: 'Main Warehouse',
          lastStockCheck: new Date().toISOString().split('T')[0],
          onOrderStock: 0,
        };

        bomItems.push({
          id: `bom-item-imp-${Date.now()}-${pIndex}-${mIdx}`,
          rawMaterialId: matId,
          quantityPerUnit: mat.quantity,
          wastagePercentage: 0,
          uom: mat.uom,
        });
      });

      newProducts.push({
        id: prodId,
        sku: `SKU-${String(pIndex).padStart(3, '0')}`,
        name: pName,
        category: 'Assemblies & Modules',
        uom: 'pcs',
        description: 'Imported product configuration',
        leadTimeDays: 14,
        isActive: true,
        sellingPrice: group.mrp,
        requiredOutput: group.requiredOutput,
        activeBomVersionId: bomVerId,
        createdAt: new Date().toISOString().split('T')[0],
        bomVersions: [
          {
            id: bomVerId,
            versionNumber: 'v1.0',
            status: 'active',
            effectiveDate: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString().split('T')[0],
            createdBy: 'Spreadsheet Importer',
            items: bomItems,
          },
        ],
      });
    });

    if (mode === 'replace') {
      setProducts(newProducts);
      setRawMaterials(newRawMaterials);
      setInventory(newInventory);
    } else {
      setProducts((prev) => [...newProducts, ...prev]);
      setRawMaterials((prev) => [...prev, ...newRawMaterials]);
      setInventory((prev) => ({ ...prev, ...newInventory }));
    }

    if (newProducts.length > 0) {
      setSelectedProductId(newProducts[0].id);
      setSelectedBomVersionId(newProducts[0].activeBomVersionId || newProducts[0].bomVersions[0]?.id);
      setPlannedQuantity(newProducts[0].requiredOutput || 100);
    }

    return { productsAdded: newProducts.length, materialsAdded: totalMaterialsAdded };
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        activeTab,
        setActiveTab,
        searchTerm,
        setSearchTerm,
        currency,
        setCurrency,
        products,
        rawMaterials,
        suppliers,
        inventory,
        productionPlans,
        purchaseRequisitions,
        selectedProductId,
        setSelectedProductId,
        selectedBomVersionId,
        setSelectedBomVersionId,
        plannedQuantity,
        setPlannedQuantity,
        rateType,
        setRateType,
        currentCalculation,
        dataSheetRows,
        addDataSheetRow,
        updateDataSheetRow,
        deleteDataSheetRow,
        bulkUpdateDataSheet,
        updateActiveProductInfo,
        addProduct,
        updateProduct,
        deleteProduct,
        addRawMaterial,
        updateRawMaterial,
        deleteRawMaterial,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addBOMVersion,
        updateBOMVersion,
        setActiveBOMVersion,
        cloneBOMVersion,
        adjustInventoryStock,
        updateInventoryDetails,
        createProductionPlan,
        updateProductionPlanStatus,
        updateProductionPlan,
        generatePurchaseRequisitionsFromMRP,
        updatePurchaseRequisitionStatus,
        updatePurchaseRequisitionItem,
        updateBOMItem,
        updateProductOutputAndMrp,
        addRawMaterialToProduct,
        updateProductMaterialItem,
        deleteProductMaterialItem,
        createProductWithRawMaterials,
        bulkImportProductsWithMaterials,
        easyLanguageMode,
        setEasyLanguageMode,
        isRephraseModalOpen,
        setIsRephraseModalOpen,
        rephraseInitialTerm,
        openRephraseModalWithTerm,
        clearAllData,
        loadSampleData,
        resetToDemoData,
        permissions,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

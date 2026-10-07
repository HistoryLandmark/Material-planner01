import {
  BOMVersion,
  CurrencyConfig,
  InventoryItem,
  MaterialRequirementLine,
  ProductionCalculationSummary,
  Product,
  RawMaterial,
  Supplier,
} from '../types';

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', symbol: '$', name: 'USD ($ - US Dollar)' },
  { code: 'EUR', symbol: '€', name: 'EUR (€ - Euro)' },
  { code: 'GBP', symbol: '£', name: 'GBP (£ - British Pound)' },
  { code: 'INR', symbol: '₹', name: 'INR (₹ - Indian Rupee)' },
  { code: 'JPY', symbol: '¥', name: 'JPY (¥ - Japanese Yen)' },
  { code: 'CAD', symbol: 'C$', name: 'CAD (C$ - Canadian Dollar)' },
  { code: 'AUD', symbol: 'A$', name: 'AUD (A$ - Australian Dollar)' },
  { code: 'CNY', symbol: '¥', name: 'CNY (¥ - Chinese Yuan)' },
  { code: 'SGD', symbol: 'S$', name: 'SGD (S$ - Singapore Dollar)' },
  { code: 'AED', symbol: 'AED', name: 'AED (AED - UAE Dirham)' },
  { code: 'CHF', symbol: 'CHF', name: 'CHF (CHF - Swiss Franc)' },
  { code: 'BRL', symbol: 'R$', name: 'BRL (R$ - Brazilian Real)' },
  { code: 'MXN', symbol: 'Mex$', name: 'MXN (Mex$ - Mexican Peso)' },
  { code: 'KRW', symbol: '₩', name: 'KRW (₩ - South Korean Won)' },
  { code: 'ZAR', symbol: 'R', name: 'ZAR (R - South African Rand)' },
];

let currentActiveCurrencySymbol = '$';

export function setActiveCurrencySymbol(symbol: string) {
  currentActiveCurrencySymbol = symbol;
}

export function getActiveCurrencySymbol(): string {
  return currentActiveCurrencySymbol;
}

/**
 * MaterialIQ Core Mathematical Engine
 *
 * Implements strict MRP & BOM Costing specifications:
 * 1. Gross Requirement = Production Quantity × BOM Quantity per Unit × (1 + Wastage %)
 *    Where Wastage % is represented as a decimal fraction (e.g. 5% = 0.05).
 * 2. Net Requirement = Gross Requirement − Available Stock
 *    Where Available Stock = Math.max(0, OnHandStock − AllocatedStock).
 *    If Available Stock >= Gross Requirement, Net Requirement = 0.
 * 3. Total Material Cost = Sum of (Gross Requirement × Unit Rate) across all line items.
 * 4. Material Cost per Finished Unit = Total Material Cost / Production Quantity.
 */

export function calculateMaterialRequirements(
  product: Product,
  bomVersion: BOMVersion,
  plannedQuantity: number,
  rawMaterials: RawMaterial[],
  inventoryMap: Record<string, InventoryItem>,
  suppliersMap: Record<string, Supplier>,
  rateType: 'latest' | 'standard' = 'latest'
): ProductionCalculationSummary {
  const safeQty = Math.max(1, plannedQuantity);
  const materialsMap = new Map<string, RawMaterial>();
  rawMaterials.forEach((rm) => materialsMap.set(rm.id, rm));

  const lines: MaterialRequirementLine[] = [];
  let totalMaterialCost = 0;
  let shortageCount = 0;

  for (const item of bomVersion.items) {
    const rawMaterial = materialsMap.get(item.rawMaterialId);
    if (!rawMaterial) continue;

    const inventory = inventoryMap[rawMaterial.id] || {
      materialId: rawMaterial.id,
      onHandStock: 0,
      allocatedStock: 0,
      reorderLevel: 0,
      warehouseLocation: 'Main Warehouse',
      lastStockCheck: new Date().toISOString().split('T')[0],
      onOrderStock: 0,
    };

    const supplier = suppliersMap[rawMaterial.preferredSupplierId] || {
      id: rawMaterial.preferredSupplierId,
      code: 'SUP-GEN',
      name: 'Standard Market Supplier',
      leadTimeDays: rawMaterial.leadTimeDays,
    };

    // 1. Available Stock = Math.max(0, On-Hand - Allocated)
    const availableStock = Math.max(0, inventory.onHandStock - inventory.allocatedStock);

    // 2. Gross Requirement = Production Quantity × BOM Quantity per Unit × (1 + Wastage %)
    const wastageDecimal = (item.wastagePercentage || 0) / 100;
    const grossRequirement = safeQty * item.quantityPerUnit * (1 + wastageDecimal);

    // 3. Net Requirement = Gross Requirement − Available Stock (floored at 0)
    const rawNet = grossRequirement - availableStock;
    const netRequirement = rawNet > 0 ? rawNet : 0;
    const surplusStock = rawNet < 0 ? Math.abs(rawNet) : 0;

    if (netRequirement > 0) {
      shortageCount++;
    }

    // Determine stock status
    let stockStatus: 'sufficient' | 'low' | 'critical_shortage' = 'sufficient';
    if (netRequirement > 0) {
      // If available is zero or deficit is huge
      if (availableStock === 0 || netRequirement > availableStock * 2) {
        stockStatus = 'critical_shortage';
      } else {
        stockStatus = 'low';
      }
    }

    // Rate selection
    const unitRate = rateType === 'standard' ? rawMaterial.standardCost : rawMaterial.currentRate;
    
    // Line item costing
    const lineTotalCost = grossRequirement * unitRate;
    const costPerFinishedUnit = (item.quantityPerUnit * (1 + wastageDecimal)) * unitRate;

    totalMaterialCost += lineTotalCost;

    lines.push({
      materialId: rawMaterial.id,
      materialCode: rawMaterial.code,
      materialName: rawMaterial.name,
      category: rawMaterial.category,
      uom: item.uom || rawMaterial.uom,
      bomQuantityPerUnit: item.quantityPerUnit,
      wastagePercentage: item.wastagePercentage,
      grossRequirement: Number(grossRequirement.toFixed(4)),
      onHandStock: inventory.onHandStock,
      allocatedStock: inventory.allocatedStock,
      availableStock,
      netRequirement: Number(netRequirement.toFixed(4)),
      surplusStock: Number(surplusStock.toFixed(4)),
      stockStatus,
      unitRate,
      currency: currentActiveCurrencySymbol,
      preferredSupplierId: supplier.id,
      supplierName: supplier.name,
      supplierLeadTimeDays: supplier.leadTimeDays || rawMaterial.leadTimeDays,
      lineTotalCost: Number(lineTotalCost.toFixed(2)),
      costPerFinishedUnit: Number(costPerFinishedUnit.toFixed(4)),
    });
  }

  const materialCostPerUnit = safeQty > 0 ? totalMaterialCost / safeQty : 0;

  return {
    productId: product.id,
    productName: product.name,
    productSku: product.sku,
    bomVersionNumber: bomVersion.versionNumber,
    plannedQuantity: safeQty,
    totalGrossItems: lines.length,
    totalNetItemsToProcure: lines.filter((l) => l.netRequirement > 0).length,
    totalAvailableMaterialsCount: lines.filter((l) => l.stockStatus === 'sufficient').length,
    shortageMaterialsCount: shortageCount,
    totalMaterialCost: Number(totalMaterialCost.toFixed(2)),
    materialCostPerUnit: Number(materialCostPerUnit.toFixed(2)),
    lines,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Calculates baseline BOM unit cost without considering production batch sizing
 */
export function calculateBOMUnitCost(
  bomVersion: BOMVersion,
  rawMaterials: RawMaterial[],
  rateType: 'latest' | 'standard' = 'latest'
): number {
  const materialsMap = new Map<string, RawMaterial>();
  rawMaterials.forEach((rm) => materialsMap.set(rm.id, rm));

  let unitCost = 0;
  for (const item of bomVersion.items) {
    const material = materialsMap.get(item.rawMaterialId);
    if (!material) continue;

    const rate = rateType === 'standard' ? material.standardCost : material.currentRate;
    const wastageMult = 1 + (item.wastagePercentage || 0) / 100;
    unitCost += item.quantityPerUnit * wastageMult * rate;
  }

  return Number(unitCost.toFixed(2));
}

/**
 * Formatter for currency with selected active currency symbol
 */
export function formatCurrency(amount: number, currency?: string | CurrencyConfig): string {
  let sym = currentActiveCurrencySymbol;
  if (typeof currency === 'string') {
    sym = currency;
  } else if (currency && typeof currency === 'object' && 'symbol' in currency) {
    sym = currency.symbol;
  }
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return `${sym}${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formatter for quantities with reasonable decimals
 */
export function formatQty(amount: number, uom?: string): string {
  const formatted = amount.toLocaleString('en-US', {
    maximumFractionDigits: 3,
  });
  return uom ? `${formatted} ${uom}` : formatted;
}

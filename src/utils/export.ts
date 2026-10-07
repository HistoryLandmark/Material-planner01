import * as XLSX from 'xlsx';
import {
  MaterialRequirementLine,
  ProductionCalculationSummary,
  PurchaseRequisitionItem,
  Product,
  BOMVersion,
  RawMaterial,
} from '../types';
import { calculateBOMUnitCost } from './calculations';

/**
 * Exports Material Requirement Sheet to native Microsoft Excel (.xlsx) file
 */
export function exportMaterialRequirementsToExcel(summary: ProductionCalculationSummary) {
  const wb = XLSX.utils.book_new();

  // 1. Header Information Block
  const headerData = [
    ['MATERIALIQ - RAW MATERIAL REQUIREMENT & BOM COSTING CALCULATOR'],
    ['Production Order & MRP Calculation Report'],
    ['Generated At:', new Date(summary.calculatedAt).toLocaleString()],
    [],
    ['Product Name:', summary.productName, 'SKU:', summary.productSku],
    ['BOM Version:', summary.bomVersionNumber, 'Planned Production Qty:', summary.plannedQuantity],
    ['Total Material Cost:', `$${summary.totalMaterialCost.toFixed(2)}`, 'Material Cost / Unit:', `$${summary.materialCostPerUnit.toFixed(2)}`],
    ['Items Requiring Procurement:', summary.totalNetItemsToProcure, 'Items In Stock:', summary.totalAvailableMaterialsCount],
    [],
    ['MRP CALCULATION FORMULAE APPLIED:'],
    ['• Gross Requirement = Production Quantity × BOM Qty per Unit × (1 + Wastage %)'],
    ['• Net Requirement = Gross Requirement − Available Stock (where Available = On Hand − Allocated)'],
    [],
  ];

  // 2. Data Rows
  const columns = [
    'Material Code',
    'Material Name',
    'Category',
    'UOM',
    'BOM Qty / Unit',
    'Wastage %',
    'Gross Req',
    'On Hand Stock',
    'Allocated Stock',
    'Available Stock',
    'Net Req (Shortage)',
    'Stock Status',
    'Unit Rate ($)',
    'Line Total Cost ($)',
    'Cost / Finished Unit ($)',
    'Preferred Supplier',
    'Lead Time (Days)',
  ];

  const rows = summary.lines.map((l: MaterialRequirementLine) => [
    l.materialCode,
    l.materialName,
    l.category,
    l.uom,
    l.bomQuantityPerUnit,
    `${l.wastagePercentage}%`,
    l.grossRequirement,
    l.onHandStock,
    l.allocatedStock,
    l.availableStock,
    l.netRequirement,
    l.stockStatus.toUpperCase(),
    l.unitRate,
    l.lineTotalCost,
    l.costPerFinishedUnit,
    l.supplierName,
    l.supplierLeadTimeDays,
  ]);

  const worksheetData = [...headerData, columns, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths for readability
  ws['!cols'] = [
    { wch: 16 }, // Material Code
    { wch: 28 }, // Material Name
    { wch: 18 }, // Category
    { wch: 8 },  // UOM
    { wch: 16 }, // BOM Qty
    { wch: 12 }, // Wastage
    { wch: 14 }, // Gross Req
    { wch: 14 }, // On Hand
    { wch: 14 }, // Allocated
    { wch: 14 }, // Available
    { wch: 18 }, // Net Req
    { wch: 16 }, // Stock Status
    { wch: 14 }, // Unit Rate
    { wch: 18 }, // Line Total Cost
    { wch: 20 }, // Cost/Unit
    { wch: 24 }, // Supplier
    { wch: 16 }, // Lead Time
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Material Requirements');

  const filename = `MaterialIQ_MRP_${summary.productSku}_${summary.plannedQuantity}units_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Exports Purchase Requisitions to native Microsoft Excel (.xlsx) file
 */
export function exportPurchaseRequirementsToExcel(items: PurchaseRequisitionItem[]) {
  const wb = XLSX.utils.book_new();

  const header = [
    ['MATERIALIQ - PURCHASE REQUISITION & SHORTFALL PROCUREMENT PLAN'],
    ['Generated At:', new Date().toLocaleString()],
    ['Total Purchase Requisition Lines:', items.length],
    ['Estimated Total PO Value:', `$${items.reduce((sum, i) => sum + i.totalCost, 0).toFixed(2)}`],
    [],
    [
      'PR Number',
      'Material Code',
      'Material Description',
      'UOM',
      'Net Shortfall',
      'Recommended Order Qty',
      'Est. Unit Rate ($)',
      'Total Est. Cost ($)',
      'Supplier',
      'Lead Time (Days)',
      'Urgency',
      'Status',
      'Target Delivery Date',
      'Associated Plan #',
    ],
  ];

  const rows = items.map((i) => [
    i.requisitionNumber,
    i.materialCode,
    i.materialName,
    i.uom,
    i.netRequirement,
    i.orderQuantity,
    i.unitRate,
    i.totalCost,
    i.supplierName,
    i.leadTimeDays,
    i.urgency.toUpperCase(),
    i.status.toUpperCase(),
    i.targetDeliveryDate,
    i.associatedPlanNumber || 'N/A',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([...header, ...rows]);
  ws['!cols'] = [
    { wch: 16 },
    { wch: 16 },
    { wch: 26 },
    { wch: 8 },
    { wch: 14 },
    { wch: 22 },
    { wch: 16 },
    { wch: 18 },
    { wch: 24 },
    { wch: 16 },
    { wch: 12 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Purchase Requisitions');
  XLSX.writeFile(wb, `MaterialIQ_Purchase_Requisitions_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Exports Product Bill of Materials (BOM) to Excel
 */
export function exportBOMToExcel(product: Product, bomVersion: BOMVersion, rawMaterials: RawMaterial[]) {
  const wb = XLSX.utils.book_new();
  const unitCost = calculateBOMUnitCost(bomVersion, rawMaterials);
  const matMap = new Map(rawMaterials.map((m) => [m.id, m]));

  const header = [
    ['MATERIALIQ - BILL OF MATERIALS (BOM) SPECIFICATION'],
    ['Product Name:', product.name, 'SKU:', product.sku],
    ['BOM Version:', bomVersion.versionNumber, 'Status:', bomVersion.status.toUpperCase()],
    ['Created Date:', bomVersion.createdAt, 'Effective Date:', bomVersion.effectiveDate],
    ['Baseline Unit Material Cost:', `$${unitCost.toFixed(2)}`],
    ['Change Log:', bomVersion.changeLog || 'Initial production release'],
    [],
    [
      'Item No.',
      'Material Code',
      'Material Description',
      'Category',
      'Qty per Unit',
      'UOM',
      'Wastage Allowance (%)',
      'Standard Rate ($)',
      'Current Rate ($)',
      'Effective Line Cost ($)',
      'Notes',
    ],
  ];

  let lineCount = 1;
  const rows = bomVersion.items.map((item) => {
    const mat = matMap.get(item.rawMaterialId);
    const rate = mat ? mat.currentRate : 0;
    const wastageMult = 1 + (item.wastagePercentage || 0) / 100;
    const lineCost = item.quantityPerUnit * wastageMult * rate;

    return [
      lineCount++,
      mat?.code || 'N/A',
      mat?.name || 'Unknown Material',
      mat?.category || 'General',
      item.quantityPerUnit,
      item.uom,
      `${item.wastagePercentage}%`,
      mat?.standardCost || 0,
      rate,
      Number(lineCost.toFixed(3)),
      item.notes || '',
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([...header, ...rows]);
  ws['!cols'] = [
    { wch: 10 },
    { wch: 16 },
    { wch: 28 },
    { wch: 18 },
    { wch: 14 },
    { wch: 8 },
    { wch: 20 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 25 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, `BOM_${bomVersion.versionNumber}`);
  XLSX.writeFile(wb, `MaterialIQ_BOM_${product.sku}_${bomVersion.versionNumber}.xlsx`);
}

/**
 * Downloads a pre-formatted Excel template for Products with 4-5 nested raw materials,
 * required batch output, end product MRP, and columns for quantity and rates to fill now or later.
 */
export function downloadProductMaterialTemplateExcel() {
  const wb = XLSX.utils.book_new();

  const data = [
    [
      'Product Name',
      'Required Output',
      'MRP of End Product',
      'Material Name',
      'Quantity (per Unit)',
      'Price / Rate (Fill now or leave blank)',
      'UOM',
      'Notes',
    ],
    // Product 1 with 5 raw materials
    [
      'Smart Industrial Sensor Gateway',
      500,
      175.0,
      'CNC Aluminum Housing Shell',
      1,
      24.5,
      'pcs',
      'Filled rate',
    ],
    [
      'Smart Industrial Sensor Gateway',
      500,
      175.0,
      'Main Controller SMT Board',
      1,
      42.0,
      'pcs',
      'Filled rate',
    ],
    [
      'Smart Industrial Sensor Gateway',
      500,
      175.0,
      'Rechargeable Li-Ion Cell 3500mAh',
      2,
      '',
      'pcs',
      'Rate to fill later',
    ],
    [
      'Smart Industrial Sensor Gateway',
      500,
      175.0,
      'Silicone Sealing O-Ring',
      1,
      1.8,
      'pcs',
      'Filled rate',
    ],
    [
      'Smart Industrial Sensor Gateway',
      500,
      175.0,
      'Stainless Steel M3 Hex Fasteners',
      6,
      '',
      'pcs',
      'Rate to fill later',
    ],
    // Product 2 with 4 raw materials
    [
      'Rugged Telematics Tracker Pro',
      300,
      95.0,
      'Polycarbonate Impact Case',
      1,
      7.2,
      'pcs',
      'Filled rate',
    ],
    [
      'Rugged Telematics Tracker Pro',
      300,
      95.0,
      'GPS & LTE-M Integrated Module',
      1,
      28.0,
      'pcs',
      'Filled rate',
    ],
    [
      'Rugged Telematics Tracker Pro',
      300,
      95.0,
      'High-Capacity Lithium Battery Pack',
      1,
      '',
      'pcs',
      'Rate to fill later',
    ],
    [
      'Rugged Telematics Tracker Pro',
      300,
      95.0,
      'External Magnetic Mount Bracket',
      1,
      4.5,
      'pcs',
      'Filled rate',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 32 }, // Product Name
    { wch: 18 }, // Required Output
    { wch: 22 }, // MRP
    { wch: 34 }, // Material Name
    { wch: 20 }, // Qty
    { wch: 34 }, // Price / Rate
    { wch: 10 }, // UOM
    { wch: 22 }, // Notes
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Product_Materials_Template');
  XLSX.writeFile(wb, 'Product_and_Raw_Materials_Template.xlsx');
}

/**
 * Exports current products and their nested raw material lists with required output and MRP to Excel
 */
export function exportProductMaterialListToExcel(
  products: Product[],
  rawMaterials: RawMaterial[],
  currencySymbol = '$'
) {
  const wb = XLSX.utils.book_new();
  const matMap = new Map<string, RawMaterial>(rawMaterials.map((m) => [m.id, m]));

  const data: (string | number)[][] = [
    [
      'Product Name',
      'Product SKU',
      'Required Output',
      `MRP of End Product (${currencySymbol})`,
      'Material Name',
      'Material Code',
      'Qty per Unit',
      `Total Qty for Output`,
      `Price / Rate (${currencySymbol})`,
      'Rate Status',
      `Total Material Cost (${currencySymbol})`,
      'UOM',
    ],
  ];

  products.forEach((product) => {
    const activeVerId = product.activeBomVersionId || product.bomVersions[0]?.id;
    const activeVer = product.bomVersions.find((v) => v.id === activeVerId) || product.bomVersions[0];
    const items = activeVer ? activeVer.items : [];
    const output = product.requiredOutput || 100;
    const mrp = product.sellingPrice || 0;

    if (items.length === 0) {
      data.push([
        product.name,
        product.sku,
        output,
        mrp,
        '(No materials configured)',
        '',
        0,
        0,
        0,
        'Pending',
        0,
        product.uom,
      ]);
      return;
    }

    items.forEach((item) => {
      const mat = matMap.get(item.rawMaterialId);
      const rate = mat ? mat.currentRate : 0;
      const hasRate = rate > 0;
      const totalQty = item.quantityPerUnit * output;
      const totalCost = Number((totalQty * rate).toFixed(2));

      data.push([
        product.name,
        product.sku,
        output,
        mrp,
        mat ? mat.name : 'Unknown Material',
        mat ? mat.code : '',
        item.quantityPerUnit,
        totalQty,
        hasRate ? rate : '',
        hasRate ? 'Filled' : 'To Fill Later',
        totalCost,
        item.uom,
      ]);
    });
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 30 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 32 },
    { wch: 16 },
    { wch: 14 },
    { wch: 20 },
    { wch: 18 },
    { wch: 16 },
    { wch: 22 },
    { wch: 10 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Product_Material_Requirements');
  XLSX.writeFile(wb, `Product_Material_Requirements_List_${new Date().toISOString().split('T')[0]}.xlsx`);
}


import { ProductionCalculationSummary } from '../types';

export interface TermDetail {
  key: string;
  standardTerm: string;
  easyTerm: string;
  category: 'Demand & MRP' | 'Inventory & Stock' | 'Cost & Pricing' | 'Planning & Orders';
  shortDescription: string;
  fullExplanation: string;
  everydayAnalogy: string;
  formulaPlain?: string;
  badge: string;
}

export const EASY_LANGUAGE_GLOSSARY: Record<string, TermDetail> = {
  grossRequirement: {
    key: 'grossRequirement',
    standardTerm: 'Gross Requirement',
    easyTerm: 'Total Needed for Batch',
    category: 'Demand & MRP',
    badge: 'Demand',
    shortDescription: 'The total amount of material you need to manufacture your batch, including scrap.',
    fullExplanation: 'Gross Requirement calculates exactly how many units, kilograms, or meters of this raw ingredient are needed to build your entire planned production volume, accounting for machine scrap or assembly damage.',
    everydayAnalogy: 'If you are baking 20 cakes and each cake requires 2 eggs, plus you expect 2 eggs might crack and break, your Total Needed is 42 eggs.',
    formulaPlain: 'Batch Size × Amount per Finished Piece × (1 + Scrap Allowance %)',
  },
  netRequirement: {
    key: 'netRequirement',
    standardTerm: 'Net Requirement',
    easyTerm: 'Still Missing (Need to Buy)',
    category: 'Demand & MRP',
    badge: 'Shortage',
    shortDescription: 'The exact amount you do NOT have in stock and must buy from suppliers immediately.',
    fullExplanation: 'Net Requirement is the deficit between what you need for this job and what is actually sitting free in your warehouse. If you already have enough, Net Requirement is 0.',
    everydayAnalogy: 'If you need 42 eggs for baking, and you check the fridge and see you already have 10 eggs ready, you still need to buy 32 eggs at the grocery store.',
    formulaPlain: 'Total Needed − Free in Storage (if positive, otherwise 0)',
  },
  onHandStock: {
    key: 'onHandStock',
    standardTerm: 'On-Hand Stock',
    easyTerm: 'Total in Storage',
    category: 'Inventory & Stock',
    badge: 'Storage',
    shortDescription: 'Total physical pieces currently sitting on warehouse shelves.',
    fullExplanation: 'This is the complete physical count of items currently present in your warehouse. Note that some of this might already be promised to other jobs.',
    everydayAnalogy: 'All the boxes currently sitting in your garage, whether you plan to use them today or tomorrow.',
    formulaPlain: 'Physical inventory count verified during stock check',
  },
  allocatedStock: {
    key: 'allocatedStock',
    standardTerm: 'Allocated Stock',
    easyTerm: 'Reserved for Other Jobs',
    category: 'Inventory & Stock',
    badge: 'Reserved',
    shortDescription: 'Stock already promised to other manufacturing orders so you cannot use it.',
    fullExplanation: 'Items that are physically in the warehouse, but have been earmarked or locked for an active or scheduled production run. Using them would steal parts from another project.',
    everydayAnalogy: 'You have 10 eggs in the fridge, but 4 are saved for tomorrow’s breakfast, so only 6 are free to use.',
    formulaPlain: 'Sum of reservations from existing active work orders',
  },
  availableStock: {
    key: 'availableStock',
    standardTerm: 'Available Stock',
    easyTerm: 'Free to Use Right Now',
    category: 'Inventory & Stock',
    badge: 'Usable',
    shortDescription: 'Stock in the warehouse that is not promised to anyone and ready to use immediately.',
    fullExplanation: 'Available Stock is the real number that matters for production planning. It takes the total items on hand and subtracts whatever is reserved for other jobs.',
    everydayAnalogy: 'The eggs in your fridge that nobody has claimed yet.',
    formulaPlain: 'Total in Storage − Reserved for Other Jobs',
  },
  bomQuantityPerUnit: {
    key: 'bomQuantityPerUnit',
    standardTerm: 'BOM Qty / Unit',
    easyTerm: 'Amount per Finished Piece',
    category: 'Demand & MRP',
    badge: 'Recipe',
    shortDescription: 'How much of this single material goes into building 1 finished product.',
    fullExplanation: 'The exact quantity (screws, grams, liters, chips) required to build one finished unit according to your technical recipe (Bill of Materials).',
    everydayAnalogy: 'The recipe card saying: "Use 2 cups of sugar per cake".',
    formulaPlain: 'Quantity stated in the product blueprint / recipe',
  },
  wastagePercentage: {
    key: 'wastagePercentage',
    standardTerm: 'Scrap / Wastage %',
    easyTerm: 'Extra Waste & Spoilage %',
    category: 'Demand & MRP',
    badge: 'Tolerance',
    shortDescription: 'Extra percentage ordered as a safety cushion for defects, cuts, or machine calibration.',
    fullExplanation: 'During industrial cutting, stamping, soldering, or molding, a small fraction of raw material is normally lost or discarded. Specifying a scrap % prevents running out of material mid-job.',
    everydayAnalogy: 'Buying 5% extra wallpaper or floor tiles in case pieces get cut wrong around corners.',
    formulaPlain: 'Estimated Defect Rate (e.g. 2% = 0.02)',
  },
  unitRate: {
    key: 'unitRate',
    standardTerm: 'Unit Rate',
    easyTerm: 'Price per Piece / Item',
    category: 'Cost & Pricing',
    badge: 'Price',
    shortDescription: 'How much one unit of this raw material costs to purchase.',
    fullExplanation: 'The current purchase price or negotiated contract rate for one single unit (e.g. $1.50 per piece, $4.20 per kg) paid to the supplier.',
    everydayAnalogy: 'The price tag on the grocery shelf per apple or per carton of milk.',
    formulaPlain: 'Supplier purchase invoice or contract rate',
  },
  lineTotalCost: {
    key: 'lineTotalCost',
    standardTerm: 'Line Total Cost',
    easyTerm: 'Total Spend for this Item',
    category: 'Cost & Pricing',
    badge: 'Cost',
    shortDescription: 'Total financial spend for this specific material for the entire production batch.',
    fullExplanation: 'The complete monetary investment required for this component for the scheduled batch, calculated by multiplying total needed volume by its unit price.',
    everydayAnalogy: 'If you need 42 eggs and each egg costs $0.25, you will spend $10.50 on eggs.',
    formulaPlain: 'Total Needed for Batch × Price per Piece',
  },
  minBufferStock: {
    key: 'minBufferStock',
    standardTerm: 'Safety Buffer Stock',
    easyTerm: 'Emergency Reserve',
    category: 'Inventory & Stock',
    badge: 'Safety',
    shortDescription: 'Minimum inventory cushion to guard against sudden supplier delays or order spikes.',
    fullExplanation: 'The minimum safety stock level you never want your warehouse to fall below. It protects your plant if a supplier is delayed by a storm or an urgent rush order arrives.',
    everydayAnalogy: 'Keeping an extra spare tire in the car trunk or always having one unopened backup bag of coffee beans in the pantry.',
    formulaPlain: 'Target buffer threshold (triggers reorder alert)',
  },
  leadTimeDays: {
    key: 'leadTimeDays',
    standardTerm: 'Lead Time (Days)',
    easyTerm: 'Days for Delivery',
    category: 'Planning & Orders',
    badge: 'Time',
    shortDescription: 'How many days it takes from sending the purchase order until materials arrive at your loading dock.',
    fullExplanation: 'The turnaround window required by your supplier to manufacture, pack, ship, and deliver the goods to your warehouse.',
    everydayAnalogy: 'Shipping time on an online order — from hitting "Buy Now" to the delivery truck pulling into your driveway.',
    formulaPlain: 'Supplier processing days + transit shipping days',
  },
  supplierName: {
    key: 'supplierName',
    standardTerm: 'Preferred Vendor',
    easyTerm: 'Supplier / Shop',
    category: 'Planning & Orders',
    badge: 'Vendor',
    shortDescription: 'The company or shop you purchase this raw material from.',
    fullExplanation: 'The primary verified vendor or manufacturer who sells and delivers this material to you.',
    everydayAnalogy: 'The specific grocery store, bakery, or timber mill where you buy your supplies.',
    formulaPlain: 'Supplier business name',
  },
  bom: {
    key: 'bom',
    standardTerm: 'Bill of Materials (BOM)',
    easyTerm: 'Product Recipe & Parts List',
    category: 'Demand & MRP',
    badge: 'Core',
    shortDescription: 'The master ingredients list specifying every single part needed to build 1 finished product.',
    fullExplanation: 'The comprehensive engineering list of raw materials, components, sub-assemblies, and exact quantities required to fabricate, assemble, and package an end product.',
    everydayAnalogy: 'The exact recipe for a cake: flour, sugar, butter, baking powder, and vanilla.',
    formulaPlain: 'Hierarchy of all component items + quantities per unit',
  },
  mrp: {
    key: 'mrp',
    standardTerm: 'Material Requirements Planning (MRP)',
    easyTerm: 'Smart Production & Shopping Calculator',
    category: 'Demand & MRP',
    badge: 'System',
    shortDescription: 'Calculates what materials to order, how much to buy, and when they must arrive so work never stops.',
    fullExplanation: 'A production planning and inventory control management system used to manage manufacturing processes and balance stock supply against demand.',
    everydayAnalogy: 'Making a weekly grocery shopping list by checking what recipes you want to cook, what is already in your pantry, and what you still need to buy.',
    formulaPlain: 'Demand (Gross) − Available Stock = Net To Procure',
  },
  productionPlan: {
    key: 'productionPlan',
    standardTerm: 'Production Plan / Work Order',
    easyTerm: 'Manufacturing Job Order',
    category: 'Planning & Orders',
    badge: 'Work',
    shortDescription: 'The official schedule detailing how many units to build and by what deadline.',
    fullExplanation: 'An authorized manufacturing order specifying the product SKU, target batch quantity, scheduled start and completion dates, and assigned BOM version.',
    everydayAnalogy: 'A restaurant ticket: "Table 4: Prepare 6 pizzas by 7:30 PM".',
    formulaPlain: 'Product + Batch Volume + Target Completion Date',
  },
  purchaseRequisition: {
    key: 'purchaseRequisition',
    standardTerm: 'Purchase Requisition (PR)',
    easyTerm: 'Shopping & Buying Order',
    category: 'Planning & Orders',
    badge: 'Purchasing',
    shortDescription: 'An official request asking the purchasing department to buy missing items from suppliers.',
    fullExplanation: 'An internal document generated when materials are short, authorizing the procurement team to issue Requests for Quotations (RFQs) and official Purchase Orders (POs) to suppliers.',
    everydayAnalogy: 'The handwritten shopping list you hand to someone going out to the store.',
    formulaPlain: 'Shortage Items + Supplier Details + Order Quantities',
  },
  pareto: {
    key: 'pareto',
    standardTerm: 'Pareto 80/20 Cost Drivers',
    easyTerm: 'Top Budget Eaters (Heavy Cost Items)',
    category: 'Cost & Pricing',
    badge: 'Analysis',
    shortDescription: 'The top 20% of materials that account for 80% of your total manufacturing spending.',
    fullExplanation: 'In manufacturing, a small handful of high-value components (like motors or circuit boards) consume the vast majority of your budget. Tracking these tightly yields the greatest cost savings.',
    everydayAnalogy: 'In baking a cake, vanilla extract and chocolate chips might cost $15, while salt and flour cost only $2.',
    formulaPlain: 'Items ranked by total cost contribution descending',
  },
};

/**
 * Returns either the standard industry term or the plain everyday easy term
 */
export function getTerm(key: string, easyMode: boolean): string {
  const item = EASY_LANGUAGE_GLOSSARY[key];
  if (!item) return key;
  return easyMode ? item.easyTerm : item.standardTerm;
}

/**
 * Returns the full explanatory object for a term
 */
export function getTermDetail(key: string): TermDetail | undefined {
  return EASY_LANGUAGE_GLOSSARY[key];
}

/**
 * Generates an executive summary in crystal-clear, plain English
 */
export function generatePlainEnglishSummary(
  calc: ProductionCalculationSummary | null,
  plannedQty: number,
  productName: string,
  currencySymbol: string
): {
  headline: string;
  summaryText: string;
  keyPoints: { label: string; value: string; isAlert?: boolean }[];
  missingItems: { name: string; missingQty: string; leadDays: number; supplier: string }[];
  coveredItemsCount: number;
} {
  if (!calc || calc.lines.length === 0) {
    return {
      headline: 'Ready for Data Entry',
      summaryText:
        'Your recipe list is currently empty. Add your components and current inventory counts in the Data Sheet to see a plain-English explanation of what you need to build your product.',
      keyPoints: [],
      missingItems: [],
      coveredItemsCount: 0,
    };
  }

  const totalLines = calc.lines.length;
  const shortageLines = calc.lines.filter((l) => l.netRequirement > 0);
  const coveredCount = totalLines - shortageLines.length;
  const longestLeadDays = Math.max(0, ...calc.lines.map((l) => l.supplierLeadTimeDays || 0));
  const totalCostFormatted = `${currencySymbol}${calc.totalMaterialCost.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const costPerPieceFormatted = `${currencySymbol}${calc.materialCostPerUnit.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  let headline = '';
  let summaryText = '';

  if (shortageLines.length === 0) {
    headline = `All materials in stock! You can start making ${plannedQty} units right now.`;
    summaryText = `In plain words: You have 100% of all ${totalLines} ingredients in your warehouse right now to build ${plannedQty} units of "${productName}". No new supplier orders are needed! The total material value inside this batch is ${totalCostFormatted} (${costPerPieceFormatted} per finished item).`;
  } else {
    headline = `You are short on ${shortageLines.length} of ${totalLines} materials to make ${plannedQty} units.`;
    summaryText = `In plain words: To manufacture ${plannedQty} units of "${productName}", you need ${totalLines} different component parts. Your warehouse already has enough stock for ${coveredCount} parts. However, you are missing ${shortageLines.length} parts that you must order from suppliers. Total raw material cost for the whole batch is ${totalCostFormatted} (${costPerPieceFormatted} per finished item). Your slowest supplier will take approximately ${longestLeadDays} days to deliver.`;
  }

  const missingItems = shortageLines.map((l) => ({
    name: l.materialName,
    missingQty: `${l.netRequirement.toLocaleString()} ${l.uom}`,
    leadDays: l.supplierLeadTimeDays || 7,
    supplier: l.supplierName || 'Supplier',
  }));

  const keyPoints = [
    { label: 'Planned Production', value: `${plannedQty.toLocaleString()} units` },
    {
      label: 'Stock Status',
      value: shortageLines.length === 0 ? 'All Ready in Stock' : `${shortageLines.length} Missing Items`,
      isAlert: shortageLines.length > 0,
    },
    { label: 'Total Batch Spend', value: totalCostFormatted },
    { label: 'Cost per Piece', value: costPerPieceFormatted },
    { label: 'Wait Time (Delivery)', value: `${longestLeadDays} days` },
  ];

  return {
    headline,
    summaryText,
    keyPoints,
    missingItems,
    coveredItemsCount: coveredCount,
  };
}

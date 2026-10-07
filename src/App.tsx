import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { ProductMaterialListView } from './components/ProductMaterialListView';
import { DataSheetView } from './components/DataSheetView';
import { ProductionPlannerView } from './components/ProductionPlannerView';
import { MaterialRequirementSheetView } from './components/MaterialRequirementSheetView';
import { PurchaseRequirementView } from './components/PurchaseRequirementView';
import { BOMManagementView } from './components/BOMManagementView';
import { CostAnalysisView } from './components/CostAnalysisView';
import { InventoryView } from './components/InventoryView';
import { ProductMasterView } from './components/ProductMasterView';
import { RawMaterialMasterView } from './components/RawMaterialMasterView';
import { SupplierMasterView } from './components/SupplierMasterView';
import {
  ProductModal,
  RawMaterialModal,
  SupplierModal,
  BOMItemModal,
  StockAdjustmentModal,
  ProductionPlanModal,
  PrintPreviewModal,
} from './components/Modals';
import { EasyLanguageAssistantModal } from './components/EasyLanguageAssistantModal';
import { Product, RawMaterial, Supplier } from './types';

const MainContent: React.FC = () => {
  const { activeTab, isRephraseModalOpen, setIsRephraseModalOpen, rephraseInitialTerm } = useApp();

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<RawMaterial | null>(null);

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);

  const [isBOMItemModalOpen, setIsBOMItemModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const [stockAdjustMaterialId, setStockAdjustMaterialId] = useState<string | null>(null);

  const handleOpenAddProduct = () => {
    setProductToEdit(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setProductToEdit(prod);
    setIsProductModalOpen(true);
  };

  const handleOpenAddMaterial = () => {
    setMaterialToEdit(null);
    setIsMaterialModalOpen(true);
  };

  const handleOpenEditMaterial = (mat: RawMaterial) => {
    setMaterialToEdit(mat);
    setIsMaterialModalOpen(true);
  };

  const handleOpenAddSupplier = () => {
    setSupplierToEdit(null);
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (sup: Supplier) => {
    setSupplierToEdit(sup);
    setIsSupplierModalOpen(true);
  };

  const handleOpenStockAdjust = (matId: string) => {
    setStockAdjustMaterialId(matId);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Application Header */}
      <Header
        onOpenNewPlanModal={() => setIsPlanModalOpen(true)}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
      />

      {/* Module Navigation Tabs */}
      <Navigation />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView onOpenNewPlanModal={() => setIsPlanModalOpen(true)} />
        )}

        {activeTab === 'product-material-list' && <ProductMaterialListView />}

        {activeTab === 'data-sheet' && <DataSheetView />}

        {activeTab === 'production-planner' && (
          <ProductionPlannerView
            onOpenPrintModal={() => setIsPrintModalOpen(true)}
            onSavePlanModal={() => setIsPlanModalOpen(true)}
          />
        )}

        {activeTab === 'material-requirement-sheet' && (
          <MaterialRequirementSheetView
            onOpenPrintModal={() => setIsPrintModalOpen(true)}
          />
        )}

        {activeTab === 'purchase-requirement' && <PurchaseRequirementView />}

        {activeTab === 'bom-management' && (
          <BOMManagementView onOpenAddBOMItemModal={() => setIsBOMItemModalOpen(true)} />
        )}

        {activeTab === 'cost-analysis' && <CostAnalysisView />}

        {activeTab === 'inventory' && (
          <InventoryView onOpenStockAdjustModal={handleOpenStockAdjust} />
        )}

        {activeTab === 'product-master' && (
          <ProductMasterView
            onOpenAddProductModal={handleOpenAddProduct}
            onEditProduct={handleOpenEditProduct}
          />
        )}

        {activeTab === 'raw-material-master' && (
          <RawMaterialMasterView
            onOpenAddMaterialModal={handleOpenAddMaterial}
            onEditMaterial={handleOpenEditMaterial}
          />
        )}

        {activeTab === 'supplier-master' && (
          <SupplierMasterView
            onOpenAddSupplierModal={handleOpenAddSupplier}
            onEditSupplier={handleOpenEditSupplier}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-400 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            MaterialIQ &copy; {new Date().getFullYear()} Enterprise BOM & Raw Material Requirement Engine
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Formulas: Gross = Batch × BOM Qty × (1 + Scrap%) | Net = Gross − Available Stock
          </span>
        </div>
      </footer>

      {/* All Application Dialogs & Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productToEdit={productToEdit}
      />

      <RawMaterialModal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        materialToEdit={materialToEdit}
      />

      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        supplierToEdit={supplierToEdit}
      />

      <BOMItemModal
        isOpen={isBOMItemModalOpen}
        onClose={() => setIsBOMItemModalOpen(false)}
      />

      <StockAdjustmentModal
        isOpen={stockAdjustMaterialId !== null}
        materialId={stockAdjustMaterialId}
        onClose={() => setStockAdjustMaterialId(null)}
      />

      <ProductionPlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
      />

      <PrintPreviewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />

      {/* Easy Language & Rephrase Assistant Dialog */}
      <EasyLanguageAssistantModal
        isOpen={isRephraseModalOpen}
        onClose={() => setIsRephraseModalOpen(false)}
        initialTermKey={rephraseInitialTerm}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

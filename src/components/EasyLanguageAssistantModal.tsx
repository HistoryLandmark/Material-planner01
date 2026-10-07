import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  EASY_LANGUAGE_GLOSSARY,
  generatePlainEnglishSummary,
  TermDetail,
} from '../utils/easyLanguage';
import {
  BookOpen,
  X,
  Copy,
  Check,
  Sparkles,
  Search,
  ArrowRight,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  Layers,
  Calculator,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface EasyLanguageAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTermKey?: string | null;
}

export const EasyLanguageAssistantModal: React.FC<EasyLanguageAssistantModalProps> = ({
  isOpen,
  onClose,
  initialTermKey,
}) => {
  const {
    easyLanguageMode,
    setEasyLanguageMode,
    currentCalculation,
    plannedQuantity,
    currency,
    products,
    selectedProductId,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'summary' | 'glossary' | 'rephraser'>('summary');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<TermDetail | null>(
    initialTermKey ? EASY_LANGUAGE_GLOSSARY[initialTermKey] || null : null
  );

  // Custom rephraser state
  const [customInput, setCustomInput] = useState('');
  const [customRephrased, setCustomRephrased] = useState<string | null>(null);

  const activeProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const summary = generatePlainEnglishSummary(
    currentCalculation,
    plannedQuantity,
    activeProduct?.name || 'Finished Good',
    currency.symbol
  );

  if (!isOpen) return null;

  const handleCopySummary = () => {
    const textToCopy = `${summary.headline}\n\n${summary.summaryText}\n\nKey Figures:\n${summary.keyPoints
      .map((k) => `• ${k.label}: ${k.value}`)
      .join('\n')}${
      summary.missingItems.length > 0
        ? `\n\nMissing Items to Order:\n${summary.missingItems
            .map((m) => `• ${m.name}: missing ${m.missingQty} (Supplier: ${m.supplier}, Lead time: ${m.leadDays} days)`)
            .join('\n')}`
        : ''
    }`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const glossaryList = Object.values(EASY_LANGUAGE_GLOSSARY).filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.standardTerm.toLowerCase().includes(q) ||
      item.easyTerm.toLowerCase().includes(q) ||
      item.shortDescription.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleRephraseCustom = () => {
    if (!customInput.trim()) return;

    // Intelligent plain-English rephraser replacement for common factory acronyms
    let text = customInput;
    const replacements: [RegExp, string][] = [
      [/\bBOM\b/gi, 'parts recipe list'],
      [/\bBill of Materials\b/gi, 'complete recipe of components'],
      [/\bGross Requirement[s]?\b/gi, 'total materials needed for this batch'],
      [/\bNet Requirement[s]?\b/gi, 'still missing items that must be bought'],
      [/\bOn-Hand Stock\b/gi, 'items currently in the warehouse'],
      [/\bAllocated Stock\b/gi, 'items saved for other jobs'],
      [/\bAvailable Stock\b/gi, 'free items ready to use right now'],
      [/\bLead Time\b/gi, 'days needed for delivery'],
      [/\bWastage\b/gi, 'extra scrap cushion'],
      [/\bScrap\b/gi, 'waste allowance'],
      [/\bUnit Rate\b/gi, 'price per single piece'],
      [/\bPurchase Requisition[s]?\b/gi, 'shopping order for purchasing'],
      [/\bPR\b/g, 'purchase order request'],
      [/\bUOM\b/gi, 'measurement unit'],
      [/\bBuffer Stock\b/gi, 'emergency backup supply'],
      [/\bSafety Stock\b/gi, 'safety reserve'],
    ];

    replacements.forEach(([pattern, repl]) => {
      text = text.replace(pattern, `**${repl}**`);
    });

    setCustomRephrased(
      `Plain English Version:\n"${text}"\n\nTakeaway: Anyone reading this will clearly understand what parts are needed, what is in stock, and what still needs to be purchased without any confusing factory jargon.`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 text-amber-300 border border-white/10 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Easy Language &amp; Rephrase Assistant</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Plain English
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Understand your numbers instantly without complex manufacturing MBA jargon
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-indigo-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Easy Language Switch Bar */}
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5 text-xs text-amber-950">
            <BookOpen className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Global Easy Language Mode:</strong> {easyLanguageMode ? 'Turned ON across all screens' : 'Currently OFF (showing standard industrial terms)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setEasyLanguageMode(!easyLanguageMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                easyLanguageMode
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Check className={`w-3.5 h-3.5 ${easyLanguageMode ? 'opacity-100' : 'opacity-0'}`} />
              <span>{easyLanguageMode ? 'Easy Language Active' : 'Switch to Easy Words'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 px-5 bg-slate-50 shrink-0">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'summary'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Plain English Summary</span>
          </button>
          <button
            onClick={() => setActiveTab('glossary')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'glossary'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Rephrased Glossary ({Object.keys(EASY_LANGUAGE_GLOSSARY).length} Terms)</span>
          </button>
          <button
            onClick={() => setActiveTab('rephraser')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'rephraser'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Text Rephrase Tool</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: EXECUTIVE PLAIN ENGLISH SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              {/* Summary Card */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {summary.headline}
                      </h3>
                      <p className="text-[11px] text-indigo-700">
                        Generated from your active MRP data in real time
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleCopySummary}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-indigo-100/50 text-indigo-700 border border-indigo-200 transition shadow-xs"
                  >
                    {copiedSummary ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Plain Words</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-xs text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-indigo-100/70 shadow-xs">
                  {summary.summaryText}
                </div>

                {/* Key Numbers at a Glance */}
                {summary.keyPoints.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                    {summary.keyPoints.map((kp, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border ${
                          kp.isAlert
                            ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="text-[10px] uppercase font-bold tracking-wider opacity-60">
                          {kp.label}
                        </div>
                        <div className="text-sm font-bold font-mono mt-0.5">{kp.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Missing Items Breakdown in Plain Words */}
              {summary.missingItems.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      <span>Items You Still Need to Buy ({summary.missingItems.length})</span>
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      {summary.coveredItemsCount} other items are already in stock
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {summary.missingItems.map((item, i) => (
                      <div
                        key={i}
                        className="bg-white border border-rose-200 rounded-xl p-3 flex items-start justify-between gap-3 shadow-xs"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">{item.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Supplier: <span className="font-semibold text-slate-700">{item.supplier}</span>
                          </div>
                          <div className="text-[11px] text-indigo-600 font-medium">
                            Delivery takes: ~{item.leadDays} days
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="inline-block px-2 py-1 rounded-lg text-xs font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            Missing {item.missingQty}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Real World Metaphor Card */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div className="text-xs text-amber-950 space-y-1">
                  <span className="font-bold block">The Cake Recipe Metaphor (How MRP Works):</span>
                  <p className="text-amber-900">
                    Think of this like baking 10 cakes. The <strong>BOM</strong> is the recipe card (2 eggs, 1 cup of sugar).
                    The <strong>Gross Requirement</strong> is what 10 cakes need (20 eggs). Your <strong>Available Stock</strong> is
                    what is in your fridge (8 eggs). The <strong>Net Requirement</strong> is what you must buy at the shop (12 eggs).
                    MaterialIQ does this math automatically for every single screw, wire, and piece in your product!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REPHRASED GLOSSARY */}
          {activeTab === 'glossary' && (
            <div className="space-y-4">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search any manufacturing term (e.g. Gross, Net, BOM, Scrap, Lead Time)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {glossaryList.map((item) => (
                  <div
                    key={item.key}
                    onClick={() => setSelectedTerm(item)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer text-left ${
                      selectedTerm?.key === item.key
                        ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-200 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {item.category}
                      </span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        {item.badge}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-slate-400 font-medium">
                        Standard: <span className="text-slate-600 line-through">{item.standardTerm}</span>
                      </div>
                      <div className="text-sm font-bold text-indigo-900 flex items-center gap-1.5">
                        <span>{item.easyTerm}</span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                        {item.shortDescription}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Term Detail Drawer */}
              {selectedTerm && (
                <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3 mt-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        Term in Easy Language
                      </div>
                      <h4 className="text-base font-bold mt-0.5">{selectedTerm.easyTerm}</h4>
                      <div className="text-xs text-slate-400 font-mono">
                        Industry Term: {selectedTerm.standardTerm}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedTerm(null)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed">
                    {selectedTerm.fullExplanation}
                  </p>

                  <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-xs space-y-1">
                    <span className="font-bold text-amber-300 block">💡 Everyday Real-Life Analogy:</span>
                    <p className="text-slate-300">{selectedTerm.everydayAnalogy}</p>
                  </div>

                  {selectedTerm.formulaPlain && (
                    <div className="text-xs text-slate-300 flex items-center gap-2">
                      <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                      <span>
                        <strong>Simple Formula:</strong> {selectedTerm.formulaPlain}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CUSTOM TEXT REPHRASER */}
          {activeTab === 'rephraser' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Rephrase Any Manufacturing Notes into Simple English
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Paste or type technical text (with acronyms like BOM, PR, Gross/Net, Wastage) and see it translated into clear, friendly language.
                </p>
              </div>

              <textarea
                rows={4}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="e.g.: The BOM requires 2 units with 3% wastage. Gross requirement is 1000 pcs, but on-hand stock is 200 and allocated is 50, so net requirement is 850 pcs to procure with 14 days lead time."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />

              <div className="flex justify-end">
                <button
                  onClick={handleRephraseCustom}
                  disabled={!customInput.trim()}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition flex items-center gap-1.5 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Translate to Easy Words</span>
                </button>
              </div>

              {customRephrased && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Rephrased Result</span>
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(customRephrased);
                        alert('Copied rephrased text to clipboard!');
                      }}
                      className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold underline"
                    >
                      Copy Result
                    </button>
                  </div>
                  <div className="text-xs text-emerald-900 whitespace-pre-wrap leading-relaxed font-medium bg-white p-3 rounded-xl border border-emerald-100">
                    {customRephrased}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Click any term anywhere in the app to see it rephrased in simple words</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

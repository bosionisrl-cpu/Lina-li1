import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Trash2, 
  MessageSquareOff, 
  HelpCircle, 
  Sparkles, 
  Copy, 
  Upload, 
  Languages, 
  Check, 
  Coins, 
  Tag, 
  Smartphone,
  Gift,
  Loader2
} from 'lucide-react';
import { cn, generateSKU } from '../lib/utils';
import { Product } from '../types';
import { MOCK_DB, notifyDbChanged } from '../services/gemini';

interface ProductsCatalogViewProps {
  products: Product[];
  onSendMessage: (msg: string) => void;
  convert: (amount: number) => string;
  selectedCurrency: string;
  currencySymbol: string;
  translateText: (text: string, toLanguage: string) => Promise<string>;
  language?: 'CN' | 'EN';
}

export default function ProductsCatalogView({ 
  products, 
  onSendMessage, 
  convert, 
  selectedCurrency,
  currencySymbol,
  translateText,
  language = 'CN'
}: ProductsCatalogViewProps) {
  
  // Tab within products catalog
  const [prodTab, setProdTab] = useState<'all' | 'gift_card'>('all');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Form states for normal item overrides
  const [newTitle, setNewTitle] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newSKU, setNewSKU] = useState("");
  const [newCategory, setNewCategory] = useState("Lighting");
  const [newDesk, setNewDesk] = useState("");

  // Form states for new Gift Card product (Buono Regalo)
  const [giftCardTitle, setGiftCardTitle] = useState("Buono Regalo Di Natale 🎄");
  const [giftCardDesc, setGiftCardDesc] = useState("Il regalo perfetto per i tuoi cari. Valido per tutti i mobili in legno minimalisti nel nostro negozio.");
  const [giftCardCategory, setGiftCardCategory] = useState("Buoni regalo");
  const [giftCardValue, setGiftCardValue] = useState("100");
  const [giftCardRedemption, setGiftCardRedemption] = useState("all_currencies");
  
  // Image drag & drop simulator
  const [mediaFilepath, setMediaFilepath] = useState("https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Translation states
  const [translatingTitle, setTranslatingTitle] = useState(false);
  const [translatingDesc, setTranslatingDesc] = useState(false);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map(p => p.category)));

  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newPrice) return;

    const newProd: Product = {
      id: "prod_" + (MOCK_DB.products.length + 1),
      title: newTitle,
      description: newDesk || "Premium craftsmanship and minimalist visual appeal.",
      price: Number(newPrice),
      sku: newSKU || generateSKU(newCategory, newTitle),
      category: newCategory,
      stock: Math.floor(Math.random() * 80) + 10,
      sales: 0,
      status: 'Active',
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80"
    };

    MOCK_DB.products.push(newProd);
    notifyDbChanged();
    setShowAddModal(false);

    // Reset Form
    setNewTitle("");
    setNewPrice("");
    setNewSKU("");
    setNewDesk("");
  };

  const handleCreateGiftCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftCardTitle || !giftCardValue) return;

    // Create a product representing the Gift Card
    const cardProd: Product = {
      id: "prod_gc_" + (MOCK_DB.products.length + 1),
      title: giftCardTitle,
      description: `${giftCardDesc} [Value: ${currencySymbol}${giftCardValue}]`,
      price: Number(giftCardValue),
      sku: `GIFT-CARD-${Math.floor(1000 + Math.random() * 9000)}`,
      category: giftCardCategory,
      stock: 9999, // infinite
      sales: 0,
      status: 'Active',
      image: mediaFilepath
    };

    MOCK_DB.products.unshift(cardProd);
    notifyDbChanged();
    setProdTab('all');
    onSendMessage(`Create new Gift Card Buono Regalo product: "${giftCardTitle}" with face value ${currencySymbol}${giftCardValue}. Redeemable: ${giftCardRedemption}. Categories set to ${giftCardCategory}.`);
  };

  const deleteProduct = (id: string) => {
    const idx = MOCK_DB.products.findIndex(p => p.id === id);
    if (idx !== -1) {
      MOCK_DB.products.splice(idx, 1);
      notifyDbChanged();
    }
  };

  const simulateMediaUpload = () => {
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (!prev) return 10;
        if (prev >= 100) {
          clearInterval(interval);
          setMediaFilepath("https://images.unsplash.com/photo-1513519107129-14a172e58def?w=600&auto=format&fit=crop&q=80"); // beautiful card mockup
          setUploadProgress(null);
          return null;
        }
        return prev + 30;
      });
    }, 200);
  };

  // Automated translation components helper
  const triggerAutoTranslateGiftTitle = async () => {
    setTranslatingTitle(true);
    try {
      const translated = await translateText(giftCardTitle, "Italian");
      setGiftCardTitle(translated);
    } catch (e) {
      console.error(e);
    } finally {
      setTranslatingTitle(false);
    }
  };

  const triggerAutoTranslateGiftDesc = async () => {
    setTranslatingDesc(true);
    try {
      const translated = await translateText(giftCardDesc, "Italian");
      setGiftCardDesc(translated);
    } catch (e) {
      console.error(e);
    } finally {
      setTranslatingDesc(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* Tab Switcher - Shopify Buoni Regalo style */}
      <div className="flex border-b border-[#241c3c] pb-px gap-4">
        <button 
          onClick={() => setProdTab('all')}
          className={cn(
            "pb-3 text-13 font-medium border-b-2 tracking-wide font-sans transition-all px-1",
            prodTab === 'all' ? "border-[#8b5cf6] text-white font-bold" : "border-transparent text-zinc-400 hover:text-white"
          )}
        >
          Tutti i prodotti (Products Catalog)
        </button>
        <button 
          onClick={() => setProdTab('gift_card')}
          className={cn(
            "pb-3 text-13 font-medium border-b-2 tracking-wide font-sans transition-all px-1 flex items-center gap-1.5",
            prodTab === 'gift_card' ? "border-[#8b5cf6] text-white font-bold" : "border-transparent text-zinc-400 hover:text-white"
          )}
        >
          <Gift size={13} /> Nuovo Buono Regalo (Create Gift Card)
        </button>
      </div>

      {prodTab === 'all' ? (
        <>
          {/* Search and control bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#120f26] p-6 rounded-2xl border border-[#231b45]">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex items-center bg-[#1a1538] border border-[#2d245e] rounded-lg px-3 py-2 w-full sm:w-72">
                <Search size={14} className="text-zinc-400 mr-2.5 shrink-0" />
                <input 
                  placeholder="Search products by title or SKU..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-13 outline-none text-white placeholder:text-zinc-500 w-full font-medium"
                />
              </div>

              {/* Categoric filter dropdown */}
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#1a1538] border border-[#2d245e] text-white text-13 px-4 py-2 rounded-lg font-medium outline-none w-full sm:w-auto"
              >
                <option value="all">All Categories</option>
                <option value="Buoni regalo">Buoni regalo (Gift cards)</option>
                {categories.filter(c => c !== "Buoni regalo").map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-13 rounded-lg font-medium shadow flex items-center justify-center gap-1.5 transition-all"
            >
              <Plus size={15} /> Add Listing
            </button>
          </div>

          {/* Grid List Products */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((p) => {
              const isGiftCard = p.category === 'Buoni regalo';
              return (
                <div key={p.id} className="bg-[#120f26] rounded-2xl border border-[#231b45] shadow-md overflow-hidden flex flex-col justify-between group relative transition-transform hover:translate-y-[-2px]">
                  
                  {/* Product Visual Container */}
                  <div className="w-full h-44 bg-[#161230] border-b border-[#231a47] flex items-center justify-center overflow-hidden relative">
                    <img src={p.image} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" referrerPolicy="no-referrer" />
                    
                    {isGiftCard && (
                      <div className="absolute top-2.5 left-2.5 bg-[#8b5cf6] text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded shadow-md flex items-center gap-1">
                        <Gift size={9} /> GIFT CARD
                      </div>
                    )}

                    {!isGiftCard && p.image_status && (
                      <span className="absolute top-2.5 left-2.5 bg-black/80 text-white border border-zinc-800/60 font-mono text-[9px] font-bold px-2 py-0.5 rounded shadow">
                        ✨ {p.image_status}
                      </span>
                    )}

                    <div className="absolute top-2.5 right-2.5 flex gap-1 bg-black/60 backdrop-blur-md p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => deleteProduct(p.id)}
                        className="p-1 px-1.5 text-rose-400 hover:bg-rose-950/20 rounded transition-colors"
                        title="Delete listed product"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Descriptions & Parameters */}
                  <div className="p-5 space-y-4">
                    <div>
                      <span className="px-2 py-0.5 bg-[#1a153a] text-[#c0a9ff] rounded text-[9px] font-mono tracking-wider font-bold block w-max uppercase mb-1 border border-[#3e2e6c]">
                        {p.category}
                      </span>
                      <h4 className="font-display font-bold text-15 text-white group-hover:text-purple-300 line-clamp-1">{p.title}</h4>
                      <p className="text-11 text-zinc-400 line-clamp-2 mt-1 leading-normal font-medium">{p.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#1b153b]">
                      <div>
                        <span className="text-[10px] font-mono text-zinc-400 block uppercase">Price</span>
                        <strong className="text-white text-14 font-semibold">{convert(p.price)}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-zinc-400 block uppercase">SKU CODE</span>
                        <span className="text-zinc-300 text-11 font-mono font-medium truncate block">{p.sku}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex gap-4">
                        <span className="text-[11px] font-medium text-zinc-400">Stock: <strong className="text-zinc-200 font-bold font-mono">{p.stock}</strong></span>
                        <span className="text-[11px] font-medium text-zinc-400">Sales: <strong className="text-zinc-200 font-bold font-mono">{p.sales}</strong></span>
                      </div>
                      
                      <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-emerald-900/15 text-emerald-400 rounded border border-emerald-900/40 uppercase">
                        {p.status}
                      </span>
                    </div>
                  </div>

                  {/* AI Assistant Quick triggers inside item board */}
                  <div className="p-3 bg-[#171330] border-t border-[#231a47] flex gap-2">
                    <button 
                      onClick={() => onSendMessage(`Please optimize image for product with ID ${p.id}. Action: 'remove_bg'. Also describe what you did.`)}
                      className="flex-1 bg-[#1a1538] hover:bg-[#251e4d] border border-[#2d245c] text-zinc-300 rounded-lg py-1.5 text-[10px] font-mono font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      🪄 BG REMOVE
                    </button>
                    
                    <button 
                      onClick={() => onSendMessage(`Please draft a compelling promotional campaigns marketing copy in a storyteller style for product '${p.title}'. Store inside campaigns db.`)}
                      className="flex-1 bg-[#1a1538] hover:bg-[#251e4d] border border-[#2d245c] text-zinc-300 rounded-lg py-1.5 text-[10px] font-mono font-bold transition-all flex items-center justify-center gap-1.5 hover:text-white"
                    >
                      📝 EDM COPY
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-16 text-center bg-[#120f26] rounded-2xl border border-[#231b45]">
                <MessageSquareOff size={24} className="text-zinc-500 mx-auto mb-2" />
                <p className="text-zinc-400 font-medium text-xs">No catalog listings correspond to search query.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* CREA BUONO REGALO VIEW (Gift Card Product) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Form Form Panel */}
          <div className="lg:col-span-2 bg-[#120f26] rounded-3xl border border-[#231b45] p-8 space-y-6">
            <div>
              <h3 className="font-display font-medium text-18 text-white flex items-center gap-2">
                <Gift className="text-[#a78bfa]" size={18} />
                Crea prodotto buono regalo (Create Gift Card Product)
              </h3>
              <p className="text-xs text-[#a7a2ce] mt-0.5">Definisci i valori del buono regalo utilizzabile su tutto il catalogo.</p>
            </div>

            <form onSubmit={handleCreateGiftCard} className="space-y-6">
              
              <div className="space-y-4">
                
                {/* Title */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Titolo (Title)</label>
                    <button 
                      type="button"
                      onClick={triggerAutoTranslateGiftTitle}
                      disabled={translatingTitle}
                      className="text-[#a78bfa] text-[10px] font-mono font-bold flex items-center gap-1 hover:text-white"
                    >
                      {translatingTitle ? <Loader2 size={10} className="animate-spin" /> : <Languages size={10} />}
                      Auto-Traduzione (IT)
                    </button>
                  </div>
                  <input 
                    type="text" 
                    required
                    value={giftCardTitle}
                    onChange={(e) => setGiftCardTitle(e.target.value)}
                    className="w-full bg-[#1b1738] border border-[#2d255c] text-white rounded-xl px-4 py-2.5 text-13 outline-none focus:border-[#8b5cf6]"
                  />
                </div>

                {/* Description */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Descrizione (Description)</label>
                    <button 
                      type="button"
                      onClick={triggerAutoTranslateGiftDesc}
                      disabled={translatingDesc}
                      className="text-[#a78bfa] text-[10px] font-mono font-bold flex items-center gap-1 hover:text-white"
                    >
                      {translatingDesc ? <Loader2 size={10} className="animate-spin" /> : <Languages size={10} />}
                      Auto-Traduzione (IT)
                    </button>
                  </div>
                  <textarea 
                    rows={4}
                    required
                    value={giftCardDesc}
                    onChange={(e) => setGiftCardDesc(e.target.value)}
                    className="w-full bg-[#1b1738] border border-[#2d255c] text-white rounded-xl px-4 py-3 text-13 outline-none focus:border-[#8b5cf6] resize-none"
                  />
                </div>

                {/* Media Media file simulation */}
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1 font-bold">Contenuti multimediali (Visual Media Card Template)</label>
                  <div 
                    onClick={simulateMediaUpload}
                    className="border-2 border-dashed border-[#2d255c] rounded-2xl p-6 text-center hover:border-[#8b5cf6] hover:bg-[#1a153a]/30 transition-all cursor-pointer relative"
                  >
                    {uploadProgress !== null ? (
                      <div className="space-y-2">
                        <Loader2 className="animate-spin text-[#8b5cf6] mx-auto" size={24} />
                        <span className="text-xs font-mono text-zinc-400">Uploading template file ({uploadProgress}%)...</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload size={24} className="text-zinc-400 mx-auto" />
                        <span className="text-12 font-semibold text-zinc-300 block">Trascina o clicca per caricare immagine del Buono (Drag & drop)</span>
                        <span className="text-[10px] text-zinc-500 font-medium">PNG, JPEG up to 5MB file</span>
                        {mediaFilepath && (
                          <div className="mt-3 max-w-[150px] mx-auto overflow-hidden rounded-lg border border-[#2d255c]">
                            <img src={mediaFilepath} className="w-full h-16 object-cover" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub row parameters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1 font-bold">Categoria</label>
                    <input 
                      type="text" 
                      readOnly
                      value={giftCardCategory}
                      className="w-full bg-[#171330] border border-[#2d255c] text-zinc-400 rounded-xl px-4 py-2.5 text-13 outline-none cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-[#a78bfa] uppercase block mb-1 font-bold">Valore Nominale ({selectedCurrency})</label>
                    <input 
                      type="number" 
                      required
                      value={giftCardValue}
                      onChange={(e) => setGiftCardValue(e.target.value)}
                      className="w-full bg-[#1b1738] border border-[#2d255c] text-white rounded-xl px-4 py-2.5 text-13 font-mono outline-none focus:border-[#8b5cf6]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1 font-bold">Valuta del negozio</label>
                    <select 
                      value={giftCardRedemption}
                      onChange={(e) => setGiftCardRedemption(e.target.value)}
                      className="w-full bg-[#1b1738] border border-[#2d255c] text-white rounded-xl px-3 py-2.5 text-13 outline-none"
                    >
                      <option value="all_currencies">Riscatto in qualsiasi valuta (Multi-Currency)</option>
                      <option value="euro_only">Solo Euro (€)</option>
                      <option value="usd_only">Solo US Dollar ($)</option>
                    </select>
                  </div>
                </div>

              </div>

              <div className="flex gap-4 pt-4 border-t border-[#231a47]">
                <button 
                  type="button"
                  onClick={() => setProdTab('all')}
                  className="flex-1 py-3 border border-[#2d255c] text-zinc-300 hover:bg-[#1a153a] hover:text-white rounded-xl font-mono font-bold text-12 transition-all"
                >
                  Indietro
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-xl font-mono font-bold text-12 transition-all shadow-md"
                >
                  Attiva Buono Regalo &rarr;
                </button>
              </div>

            </form>
          </div>

          {/* Quick preview card block */}
          <div className="space-y-6">
            <div className="bg-[#120f26] rounded-3xl border border-[#231b45] p-6 space-y-4">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">Digital Preview (Anteprima)</span>
              
              <div className="bg-gradient-to-br from-[#1d1533] to-[#0c0919] rounded-2xl border border-[#3e2e6c] overflow-hidden p-6 text-white space-y-6 relative">
                <div className="absolute top-[-40px] right-[-40px] w-24 h-24 rounded-full bg-[#8b5cf6]/10 blur-xl" />
                
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded bg-white text-black flex items-center justify-center font-display text-[9px] font-bold">M</span>
                    <span className="font-mono text-[9px] font-bold tracking-widest text-zinc-300">GIFT CARD ACTIVE</span>
                  </div>
                  <Gift className="text-[#a78bfa]" size={15} />
                </div>

                <div className="space-y-2 py-4">
                  <h4 className="font-display font-semibold text-18 line-clamp-1">{giftCardTitle}</h4>
                  <p className="text-11 text-zinc-300 font-medium line-clamp-2 leading-relaxed">{giftCardDesc}</p>
                </div>

                <div className="flex justify-between items-end border-t border-white/5 pt-4">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-mono text-zinc-400 block uppercase font-bold">Redeem face value</span>
                    <span className="text-18 font-mono font-bold text-[#a78bfa]">{currencySymbol}{giftCardValue}.00</span>
                  </div>
                  
                  <span className="text-[10px] font-mono bg-zinc-100/10 px-2 py-0.5 rounded text-zinc-300 font-bold uppercase tracking-wider">
                    {giftCardRedemption === 'all_currencies' ? 'ALL MARKETS' : 'SINGLE MARKET'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#1b1738]/40 border border-[#2a2254] text-xs leading-relaxed text-[#a7a2ce]">
                <span className="text-[#a78bfa] font-bold block mb-1">💡 Spiegazione Regole di Conversione:</span>
                I Buoni regali sono emessi sulla valuta del negozio, ma convertibili live al checkout sulla base della valuta selezionata dall'utente.
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Manual Add Listing overrides modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-[#120f26] border border-[#2a2153] text-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6"
          >
            <div>
              <h3 className="font-display font-medium text-18 text-white">New Product Override</h3>
              <p className="text-xs text-[#a7a2ce] mt-0.5">Form mock testing manual database overrides.</p>
            </div>

            <form onSubmit={handleManualAddSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] text-zinc-450 font-mono uppercase block mb-1">Product Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Oak Minimal Cupboard Frame" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#1b1738] border border-[#2d255c] focus:border-[#8b5cf6] text-white rounded-lg px-3 py-2 text-13 font-medium outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-zinc-450 font-mono uppercase block mb-1">Price ($)</label>
                  <input 
                    type="number" 
                    required 
                    step="0.01"
                    placeholder="e.g. 199.00" 
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full bg-[#1b1738] border border-[#2d255c] focus:border-[#8b5cf6] text-white font-mono rounded-lg px-3 py-2 text-13 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-450 font-mono uppercase block mb-1">SKU identifier</label>
                  <input 
                    type="text" 
                    placeholder="Auto-assigned if empty" 
                    value={newSKU}
                    onChange={(e) => setNewSKU(e.target.value)}
                    className="w-full bg-[#1b1738] border border-[#2d255c] focus:border-[#8b5cf6] text-white font-mono rounded-lg px-3 py-2 text-13 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-zinc-450 font-mono uppercase block mb-1">Category</label>
                <select 
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-[#1b1738] border border-[#2d255c] text-white rounded-lg px-3 py-2 text-13 outline-none font-medium"
                >
                  <option value="Lighting">Lighting</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Office">Office</option>
                  <option value="Home Decor">Home Decor</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-zinc-455 font-mono uppercase block mb-1">Rich Description Copy</label>
                <textarea 
                  rows={3}
                  placeholder="Detail aesthetics, dimensions and wood material sourcing..." 
                  value={newDesk}
                  onChange={(e) => setNewDesk(e.target.value)}
                  className="w-full bg-[#1b1738] border border-[#2d255c] focus:border-[#8b5cf6] text-white rounded-lg px-3 py-2 text-13 font-medium outline-none mr-2 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-[#2d255c] text-zinc-400 hover:bg-[#1a153a] text-13 font-semibold duration-150"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-13 font-semibold transition-colors"
                >
                  Create Product
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}

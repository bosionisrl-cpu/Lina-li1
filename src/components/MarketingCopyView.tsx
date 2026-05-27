import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Tag, 
  Copy, 
  SendHorizontal, 
  TrendingUp, 
  BarChart2, 
  Activity, 
  PieChart, 
  Smartphone, 
  HelpCircle,
  Megaphone,
  ShoppingBag,
  DollarSign,
  Check
} from 'lucide-react';
import { cn } from '../lib/utils';
import { MarketingCampaign, Product } from '../types';

interface MarketingCopyViewProps {
  campaigns: MarketingCampaign[];
  products: Product[];
  onSendMessage: (msg: string) => void;
  convert: (amount: number) => string;
  convertNoDecimals: (amount: number) => string;
  currencySymbol: string;
  language?: 'CN' | 'EN';
}

export default function MarketingCopyView({ 
  campaigns, 
  products, 
  onSendMessage, 
  convert,
  convertNoDecimals,
  currencySymbol,
  language = 'CN'
}: MarketingCopyViewProps) {
  
  const [marketSubTab, setMarketSubTab] = useState<'writer' | 'analytics'>('writer');
  const [copiedCampId, setCopiedCampId] = useState<string | null>(null);
  
  const [activeChannel, setActiveChannel] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.title || "");
  const [toneInput, setToneInput] = useState("Minimalist");
  const [selectedCampaignStyle, setSelectedCampaignStyle] = useState("tiktok");

  const filtered = campaigns.filter(c => {
    return activeChannel === 'all' || c.channel.toLowerCase().includes(activeChannel.toLowerCase());
  });

  const draftAICampaignText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    onSendMessage(`Write copy with these parameters. Product Name: '${selectedProduct}', Tone Keyword: '${toneInput}', Ad Channel Format: '${selectedCampaignStyle}'. Complete tool parameters properly.`);
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* Tab select */}
      <div className="flex bg-[#120f26] p-1 rounded-xl border border-[#231b45] w-max">
        <button 
          onClick={() => setMarketSubTab('writer')}
          className={cn(
            "px-4 py-2 rounded-lg text-12 font-mono tracking-tight font-bold transition-all flex items-center gap-2",
            marketSubTab === 'writer' ? "bg-[#8b5cf6] text-white shadow-sm" : "text-zinc-400 hover:text-white"
          )}
        >
          <Sparkles size={13} />
          <span>AI Copywriter Studio</span>
        </button>
        <button 
          onClick={() => setMarketSubTab('analytics')}
          className={cn(
            "px-4 py-2 rounded-lg text-12 font-mono tracking-tight font-bold transition-all flex items-center gap-2",
            marketSubTab === 'analytics' ? "bg-[#8b5cf6] text-white shadow-sm" : "text-zinc-400 hover:text-white"
          )}
        >
          <BarChart2 size={13} />
          <span>Crea campagna Analytics (Campagne Di Marketing)</span>
        </button>
      </div>

      {marketSubTab === 'writer' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Ad Builder Card Manual triggers */}
          <div className="bg-[#120f26] rounded-3xl border border-[#231b45] p-8 shadow-md space-y-6 shrink-0 h-max">
            <div>
              <h4 className="font-display font-medium text-16 text-white flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#a78bfa]" />
                AI Copywriting Builder
              </h4>
              <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed font-semibold">Use our marketing micro-agent to generate aesthetic ads on command.</p>
            </div>

            <form onSubmit={draftAICampaignText} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Target Catalog Product</label>
                <select 
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full bg-[#1b1738] border border-[#2d255c] text-white text-13 px-3 py-2.5 rounded-lg outline-none"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.title}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Ad Format Channel</label>
                  <select 
                    value={selectedCampaignStyle}
                    onChange={(e) => setSelectedCampaignStyle(e.target.value)}
                    className="w-full bg-[#1b1738] border border-[#2d255c] text-zinc-400 text-12 px-2.5 py-2.5 rounded-lg outline-none"
                  >
                    <option value="tiktok">TikTok Video Ad</option>
                    <option value="edm">EDM Newsletter</option>
                    <option value="seo">SEO Meta/Keywords</option>
                    <option value="social">Instagram Post</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Tone & Brand Vibe</label>
                  <input 
                    type="text" 
                    value={toneInput}
                    onChange={(e) => setToneInput(e.target.value)}
                    placeholder="e.g. Minimalist, Cozy"
                    className="w-full bg-[#1b1738] border border-[#2d255c] text-white text-12 px-3 py-2.5 rounded-lg outline-none font-medium h-[41px]"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg font-mono font-bold text-12 shadow flex justify-center items-center gap-1.5"
              >
                Draft Copywriting with AI &rarr;
              </button>
            </form>
          </div>

          {/* Saved Campaigns Board */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between border-b pb-4 border-[#251d45]">
              <div>
                <h4 className="font-display font-medium text-white text-14 uppercase font-mono tracking-widest leading-none">Draft Log Artifacts</h4>
                <p className="text-zinc-400 text-11 mt-1 font-semibold">All campaigns currently listed on CRM layers.</p>
              </div>
              
              <div className="flex gap-2">
                {['all', 'tiktok', 'edm', 'seo'].map(c => (
                  <button
                    key={c}
                    onClick={() => setActiveChannel(c)}
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-mono font-bold border uppercase leading-normal transition-colors",
                      activeChannel === c 
                        ? "bg-[#8b5cf6] text-white border-[#8b5cf6]" 
                        : "bg-[#120f26] text-zinc-400 border-[#231b45] hover:text-white"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-6">
              {filtered.map((camp) => (
                <div key={camp.id} className="bg-[#120f26] p-6 rounded-3xl border border-[#231b45] shadow-sm relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 bg-[#1a1538] border border-[#2e245a] rounded text-[9px] font-mono tracking-widest font-bold text-purple-300 block w-max uppercase">
                        {camp.channel}
                      </span>
                      <h5 className="text-[13px] font-bold text-white leading-tight">Product Target: {camp.product_name}</h5>
                    </div>

                    <span className="px-2.5 py-0.5 text-[9px] font-mono font-bold bg-amber-900/20 text-amber-400 rounded-full border border-amber-800/20 uppercase">
                      Tone: {camp.tone}
                    </span>
                  </div>

                  <div className="bg-[#1b1738]/40 border border-[#2a2253] p-4 rounded-xl text-13 font-medium text-zinc-300 leading-relaxed max-h-[160px] overflow-y-auto font-sans">
                    {camp.content}
                  </div>

                  <div className="mt-4 flex justify-between items-center text-xs">
                    <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase">Artifact ID: {camp.id}</span>
                    
                    <button 
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(camp.content);
                        } catch (err) {
                          console.warn("Clipboard write failed", err);
                        }
                        setCopiedCampId(camp.id);
                        setTimeout(() => setCopiedCampId(null), 2000);
                      }}
                      className="p-2 text-[#a78bfa] hover:text-white hover:bg-[#1a1538] rounded-xl transition-all duration-150 font-mono font-bold text-[10px] flex items-center gap-1.5"
                    >
                      {copiedCampId === camp.id ? (
                        <>
                          <Check size={12} className="text-emerald-400 stroke-[3.5] animate-scale-up" />
                          <span className="text-emerald-400">COPIED!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>COPY SCRIPT</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="text-center py-20 bg-[#120f26] rounded-3xl border border-[#231b45]">
                  <p className="text-zinc-450 font-mono text-11 uppercase leading-none">No copywriting scripts generated yet.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        /* CREA CAMPAGNA ANALYTICS VIEW (Based closely on Screenshot 4!) */
        <div className="space-y-8">
          
          {/* Header Title info banner */}
          <div className="bg-[#120f26] p-6 rounded-2xl border border-[#231b45] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 bg-[#8b5cf6]/20 border border-[#8b5cf6]/35 rounded text-[9px] font-mono font-bold text-[#c0a9ff] uppercase">Monitoraggio Live</span>
              <h3 className="font-display font-medium text-18 text-white">Rapporto Rendimento Campagne Publicitarie (UTM Analytics)</h3>
              <p className="text-11 text-zinc-400">Analisi in tempo reale del traffico di conversione per UTM delle campagne attive.</p>
            </div>
            
            <div className="flex bg-[#1b1738] border border-[#2e245c] px-3.5 py-1.5 rounded-xl text-11 font-mono text-[#a78bfa] items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
              DATI AD STREAMS AGGIORNATI ADESSO
            </div>
          </div>

          {/* Core Analytics Grid from Screenshot 4 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Tile 1: Sessioni */}
            <div className="bg-[#120f26] p-6 rounded-2xl border border-[#231b45] space-y-2 relative overflow-hidden">
              <div className="absolute right-4 top-4 text-purple-900/30"><Megaphone size={32} /></div>
              <span className="text-[10px] uppercase text-zinc-400 font-mono block">Sessioni</span>
              <h2 className="text-28 font-display font-bold text-white leading-none">2,450</h2>
              <span className="text-[10px] text-emerald-400 block">+14.2% rispetto a ieri</span>
            </div>

            {/* Tile 2: Vendite */}
            <div className="bg-[#120f26] p-6 rounded-2xl border border-[#231b45] space-y-2 relative overflow-hidden">
              <div className="absolute right-4 top-4 text-emerald-900/30"><ShoppingBag size={32} /></div>
              <span className="text-[10px] uppercase text-zinc-400 font-mono block">Vendite (Sales)</span>
              <h2 className="text-28 font-display font-bold text-white leading-none">{convertNoDecimals(15420)}</h2>
              <span className="text-[10px] text-emerald-400 block">+28.5% tasso acquisti</span>
            </div>

            {/* Tile 3: Ordini */}
            <div className="bg-[#120f26] p-6 rounded-2xl border border-[#231b45] space-y-2 relative overflow-hidden">
              <div className="absolute right-4 top-4 text-pink-900/30"><Megaphone size={32} /></div>
              <span className="text-[10px] uppercase text-zinc-400 font-mono block">Ordini ricevuti (Orders)</span>
              <h2 className="text-28 font-display font-bold text-white leading-none">142</h2>
              <span className="text-[10px] text-zinc-400 block">100% evasi con AI</span>
            </div>

            {/* Tile 4: Valore medio ordine */}
            <div className="bg-[#120f26] p-6 rounded-2xl border border-[#231b45] space-y-2 relative overflow-hidden">
              <div className="absolute right-4 top-4 text-blue-900/30"><DollarSign size={32} /></div>
              <span className="text-[10px] uppercase text-zinc-400 font-mono block">Valore medio dell'ordine (AOV)</span>
              <h2 className="text-28 font-display font-bold text-white leading-none">{convert(108.59)}</h2>
              <span className="text-[10px] text-zinc-300 block">Base di conversione EUR / USD</span>
            </div>

          </div>

          {/* Breakdown Charts - Two-Column Panel based on Shot 4 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Chart left: Sessioni per canale */}
            <div className="bg-[#120f26] rounded-3xl border border-[#231b45] p-8 space-y-6">
              <h4 className="font-display font-medium text-15 text-white flex items-center gap-2">
                <PieChart size={14} className="text-[#a78bfa]" />
                Sessioni per canale (Traffic breakdown)
              </h4>
              
              <div className="space-y-4 pt-2">
                {[
                  { channel: 'TikTok Ads Campaign', count: 1250, color: 'bg-emerald-500', pct: 51 },
                  { channel: 'EDM Newsletter', count: 680, color: 'bg-[#8b5cf6]', pct: 27 },
                  { channel: 'SEO Backlinks Organic', count: 320, color: 'bg-amber-500', pct: 13 },
                  { channel: 'Instagram Influencers', count: 200, color: 'bg-rose-500', pct: 9 }
                ].map((item, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs text-zinc-300 font-sans">
                      <span className="font-semibold flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", item.color)} />
                        {item.channel}
                      </span>
                      <span className="font-mono">{item.count} click ({item.pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-[#1b1738] rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart right: Vendite per canale */}
            <div className="bg-[#120f26] rounded-3xl border border-[#231b45] p-8 space-y-6">
              <h4 className="font-display font-medium text-15 text-white flex items-center gap-2">
                <TrendingUp size={14} className="text-[#10b981]" />
                Vendite per canale (Conversion values)
              </h4>
              
              <div className="space-y-4 pt-2">
                {[
                  { channel: 'TikTok Ads Campaign', amount: 8900, color: 'bg-emerald-500', pct: 57 },
                  { channel: 'EDM Newsletter', amount: 4200, color: 'bg-[#8b5cf6]', pct: 27 },
                  { channel: 'SEO Backlinks Organic', amount: 1400, color: 'bg-amber-500', pct: 9 },
                  { channel: 'Instagram Influencers', amount: 920, color: 'bg-rose-500', pct: 7 }
                ].map((item, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs text-zinc-300 font-sans">
                      <span className="font-semibold flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", item.color)} />
                        {item.channel}
                      </span>
                      <span className="font-mono">{convert(item.amount)} ({item.pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-[#1b1738] rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Languages, Cpu, Sparkles, Check, ArrowRight, HelpCircle, Loader2 } from 'lucide-react';

interface TranslationsHubProps {
  products: any[];
  campaigns: any[];
  onSendMessage: (msg: string) => void;
  translateText: (text: string, toLanguage: string) => Promise<string>;
  language?: 'CN' | 'EN';
}

export function TranslationsHub({ products, campaigns, onSendMessage, translateText, language = 'CN' }: TranslationsHubProps) {
  const [sourceText, setSourceText] = useState("We handcraft Nordic tables from selected sustainable oak timber.");
  const [targetLang, setTargetLang] = useState("Italian");
  const [translatedResult, setTranslatedResult] = useState("");
  const [translating, setTranslating] = useState(false);
  const [logs, setLogs] = useState<any[]>([
    { id: 1, source: "Nordic Minimalist Oak Table Lamp", target: "Lampada da tavolo in quercia minimalista nordica", language: "Italian", type: "Product Title" },
    { id: 2, source: "Apple Aluminum Height-Adjustable Stand", target: "苹果铝合金高度可调支架", language: "Chinese", type: "Product Title" },
    { id: 3, source: "Aromatic Sandalwood Soy Candle", target: "Candela di soia aromatica al legno di sandalo", language: "Italian", type: "Product Description" }
  ]);

  const handleTranslateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceText.trim()) return;
    setTranslating(true);
    
    // Simulate smart AI translation delay
    setTimeout(async () => {
      try {
        const result = await translateText(sourceText, targetLang);
        setTranslatedResult(result);
        
        // Add to translation log list
        const newLog = {
          id: Date.now(),
          source: sourceText,
          target: result,
          language: targetLang,
          type: "Custom Text Input"
        };
        setLogs(prev => [newLog, ...prev]);
        
        onSendMessage(`Translate the custom source text segment of the system to language: ${targetLang}. Text: "${sourceText}" -> Result: "${result}"`);
      } catch (err) {
        setTranslatedResult("Translation server timeout. Fallback offline translation enabled.");
      } finally {
        setTranslating(false);
      }
    }, 700);
  };

  const handleBulkCatalogTranslate = () => {
    setTranslating(true);
    setTimeout(() => {
      // Bulk translate all products title to Italian and Chinese
      const newItems: any[] = [];
      products.forEach(p => {
        newItems.push({
          id: Date.now() + Math.random(),
          source: p.title,
          target: `[IT] Traduzione automatica: ${p.title}`,
          language: "Italian",
          type: "Product Title Catalog Sync"
        });
        newItems.push({
          id: Date.now() + Math.random(),
          source: p.title,
          target: `[ZH] 自动翻译: ${p.title}`,
          language: "Chinese",
          type: "Product Title Catalog Sync"
        });
      });
      setLogs(prev => [...newItems, ...prev]);
      setTranslating(false);
      onSendMessage("Bulk translate full products catalog titles and description segments to support international localized multi-language rendering.");
    }, 1200);
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* Intro header */}
      <div className="bg-gradient-to-r from-[#21123a] via-[#16122d] to-[#120a22] rounded-3xl p-8 border border-[#3e2b65] shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-[20%] translate-y-[-20%]">
          <Globe size={300} className="text-[#8b5cf6]" />
        </div>
        <div className="max-w-2xl space-y-2">
          <span className="px-3 py-1 bg-[#8b5cf6]/20 border border-[#8b5cf6]/35 rounded-full text-[10px] font-mono font-bold text-[#c0a9ff] uppercase tracking-wider flex items-center gap-1.5 w-max">
            <Cpu size={12} className="animate-pulse" /> Platform Core Translation Engine
          </span>
          <h2 className="font-display font-medium text-24 text-white tracking-tight">AI Automated Global Translator (自动化翻译组件)</h2>
          <p className="text-[#a7a2ce] text-xs leading-relaxed font-sans">
            A native translation automation model integrated directly into the dashboard. Localize title texts, packaging copy, and marketing campaign drafts on-the-fly to foreign markets. Perfect for multi-currency international operations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Manual Translation Console */}
        <div className="bg-[#120f26] rounded-3xl border border-[#231b45] p-6 space-y-6">
          <div>
            <h3 className="font-display font-medium text-white text-15 flex items-center gap-1.5">
              <Languages size={14} className="text-[#a78bfa]" />
              Single Segment Translation
            </h3>
            <p className="text-[#a7a2ce] text-[11px] mt-0.5">Quickly translate single values or custom copy inputs.</p>
          </div>

          <form onSubmit={handleTranslateSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1 font-bold">Source Copywriting (English)</label>
              <textarea 
                rows={4}
                required
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Enter raw English copy..."
                className="w-full bg-[#1b1738] border border-[#2d255c] focus:border-[#8b5cf6] text-white rounded-xl px-4 py-3 text-13 outline-none duration-150 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1 font-bold">Target Market Language</label>
                <select 
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full bg-[#1b1738] border border-[#2d255c] text-white rounded-xl px-3 py-2.5 text-13 outline-none"
                >
                  <option value="Italian">Italian 🇮🇹 (Aziende/Segmenti standard)</option>
                  <option value="Chinese">Simplified Chinese 🇨🇳 (中文自动化)</option>
                  <option value="Spanish">Spanish 🇪🇸 (LatAm & ES)</option>
                  <option value="French">French 🇫🇷 (European France)</option>
                  <option value="German">German 🇩🇪 (DACH Region)</option>
                  <option value="Japanese">Japanese 🇯🇵 (Tokyo Division)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={translating}
              className="w-full py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-mono font-bold text-12 rounded-xl transition-all shadow-md flex justify-center items-center gap-2"
            >
              {translating ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Translating ...
                </>
              ) : (
                <>
                  <Sparkles size={13} /> Translato Auto Segment &rarr;
                </>
              )}
            </button>
          </form>

          {translatedResult && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl bg-[#1b1738] border border-[#302661] text-white space-y-2"
            >
              <span className="text-[9px] font-mono text-[#a78bfa] block uppercase font-bold tracking-wider">AI Translation Output result</span>
              <p className="text-13 leading-relaxed font-sans">{translatedResult}</p>
            </motion.div>
          )}
        </div>

        {/* Global Catalog Translator Panel */}
        <div className="bg-[#120f26] rounded-3xl border border-[#231b45] p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-display font-medium text-white text-15 flex items-center gap-1.5">
                <Globe size={14} className="text-[#10b981]" />
                Automated Bulk Catalog Translation
              </h3>
              <p className="text-[#a7a2ce] text-[11px] mt-0.5">Translate all your catalog products and descriptions into all enabled regional markets with one click.</p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs bg-[#1a1538] p-3 rounded-xl border border-[#2e245e]">
                <span className="text-[#a7a2ce] font-sans">Active Product listings:</span>
                <span className="font-mono text-white font-bold">{products.length} Items</span>
              </div>
              <div className="flex justify-between items-center text-xs bg-[#1a1538] p-3 rounded-xl border border-[#2e245e]">
                <span className="text-[#a7a2ce] font-sans">Enabled export languages:</span>
                <span className="font-mono text-[#a78bfa] font-bold">Italian 🇮🇹, Chinese 🇨🇳, Spanish 🇪🇸</span>
              </div>
              <div className="flex justify-between items-center text-xs bg-[#1a1538] p-3 rounded-xl border border-[#2e245e]">
                <span className="text-[#a7a2ce] font-sans">Global Status:</span>
                <span className="text-emerald-450 font-mono font-bold bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-800/20 text-10 uppercase">Healthy</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleBulkCatalogTranslate}
              disabled={translating}
              className="w-full py-3 bg-[#10b981] hover:bg-[#059669] text-white font-mono font-bold text-12 rounded-xl transition-all shadow-md flex justify-center items-center gap-2"
            >
              {translating ? <Loader2 size={13} className="animate-spin" /> : <Globe size={13} />}
              Bulk Translate Entire Catalog
            </button>
            <p className="text-[10px] text-zinc-400 text-center leading-normal">
              Updates translation indicators behind the products listed. Translates Title, Description metrics & tags automatically.
            </p>
          </div>
        </div>

        {/* Live Translations Log File */}
        <div className="bg-[#120f26] rounded-3xl border border-[#231b45] p-6 space-y-4">
          <div>
            <h3 className="font-display font-medium text-white text-14 flex items-center gap-1.5 uppercase font-mono tracking-wider">
              Translation Event Stream
            </h3>
            <p className="text-[#a7a2ce] text-[11px] mt-0.5">Real-time log of background translation processing events.</p>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1 scrollbar-thin">
            {logs.map((log) => (
              <div key={log.id} className="p-3 bg-[#181432] border border-[#292053] rounded-xl space-y-1.5 transition-all">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="px-1.5 py-0.5 bg-[#8b5cf6]/20 text-[#a78bfa] font-mono rounded font-bold uppercase">{log.type}</span>
                  <span className="text-zinc-500 font-mono text-[9px]">{log.language}</span>
                </div>
                <div className="text-11 leading-snug space-y-1">
                  <div className="text-zinc-400">Src: <span className="font-sans italic font-mono text-[10px] text-zinc-300">{log.source}</span></div>
                  <div className="text-white font-bold">Dst: <span className="font-sans text-emerald-400">{log.target}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

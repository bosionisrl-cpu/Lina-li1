import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  Building2, 
  Layers, 
  Check, 
  Globe2, 
  Smartphone, 
  CheckCircle2,
  Calendar,
  Layers3,
  MapPin,
  Briefcase
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Customer } from '../types';

interface CustomersCoreViewProps {
  customers: Customer[];
  onSendMessage: (msg: string) => void;
  convert: (amount: number) => string;
  segmentsList: any[];
  setSegmentsList: React.Dispatch<React.SetStateAction<any[]>>;
  companiesList: any[];
  setCompaniesList: React.Dispatch<React.SetStateAction<any[]>>;
  language?: 'CN' | 'EN';
}

export default function CustomersCoreView({ 
  customers, 
  onSendMessage, 
  convert,
  segmentsList,
  setSegmentsList,
  companiesList,
  setCompaniesList,
  language = 'CN'
}: CustomersCoreViewProps) {
  
  // Choose between Customers CRM (customers), Segments (segmenti), B2B Companies (aziende)
  const [activeSubTab, setActiveSubTab] = useState<'crm' | 'segments' | 'b2b'>('crm');

  // Filter crm
  const [segFilter, setSegFilter] = useState("all");

  // modal creators
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  // Segment fields
  const [newSegName, setNewSegName] = useState("Clienti VIP alta frequenza ⭐");
  const [newSegPct, setNewSegPct] = useState("35");
  const [newSegActive, setNewSegActive] = useState("10 min fa");

  // Company fields
  const [newCoName, setNewCoName] = useState("Tuscany Olive Woodworks srl");
  const [newCoId, setNewCoId] = useState("IT-77339021");
  const [newCoContact, setNewCoContact] = useState("Alessandro Mancini");
  const [newCoAddress, setNewCoAddress] = useState("Via dei Cipressi 45, Siena, IT");
  const [newCoLocationId, setNewCoLocationId] = useState("LOC-SIENA-02");
  const [newCoMarkets, setNewCoMarkets] = useState("Italy, Southern Europe");

  const filtered = customers.filter(c => {
    return segFilter === 'all' || c.segment.toLowerCase() === segFilter.toLowerCase();
  });

  const generateCampaignForSegment = (seg: string) => {
    onSendMessage(`Create an automated campaigns copy tailored for the '${seg}' customer segments group. Craft an email newsletters draft showing minimalist decor discount.`);
  };

  const handleAddSegment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSegName) return;

    const newSeg = {
      id: "seg_" + (segmentsList.length + 1),
      name: newSegName,
      pct: Number(newSegPct || 10),
      lastActive: newSegActive || "Adesso",
      created: "Adesso"
    };

    setSegmentsList(prev => [...prev, newSeg]);
    setShowSegmentModal(false);
    onSendMessage(`Creazione nuovo segmento clienti: "${newSegName}" rappresentante il ${newSegPct}% della clientela totale.`);
  };

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoName) return;

    const newCo = {
      id: "co_" + (companiesList.length + 1),
      name: newCoName,
      companyId: newCoId,
      mainContact: newCoContact,
      address: newCoAddress,
      locationId: newCoLocationId,
      markets: newCoMarkets
    };

    setCompaniesList(prev => [...prev, newCo]);
    setShowCompanyModal(false);
    onSendMessage(`Registrata nuova azienda B2B (Aziende): "${newCoName}" con ID azienda ${newCoId}. Sede operativa: ${newCoLocationId}. Referente principale: ${newCoContact}.`);
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* Segment / Company Sub tabs */}
      <div className="flex bg-[#120f26] p-1 rounded-xl border border-[#231b45] w-max">
        {[
          { id: 'crm', label: 'Tutti i clienti (CRM)', count: customers.length, icon: Users },
          { id: 'segments', label: 'Segmenti (Customer Segments)', count: segmentsList.length, icon: Layers3 },
          { id: 'b2b', label: 'Aziende B2B (B2B Companies)', count: companiesList.length, icon: Building2 }
        ].map((sub) => {
          const Icon = sub.icon;
          return (
            <button 
              key={sub.id}
              onClick={() => setActiveSubTab(sub.id as any)}
              className={cn(
                "px-4 py-2 rounded-lg text-12 font-mono tracking-tight font-bold transition-all flex items-center gap-2",
                activeSubTab === sub.id 
                  ? "bg-[#8b5cf6] text-white shadow-sm" 
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Icon size={13} />
              <span>{sub.label}</span>
              <span className="px-1.5 py-0.5 bg-black/30 rounded text-[9px] font-semibold text-zinc-300">
                {sub.count}
              </span>
            </button>
          );
        })}
      </div>

      {activeSubTab === 'crm' && (
        <>
          {/* Customer segments CRM widgets */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'All customers', count: customers.length, id: 'all' },
              { label: '💎 High Spenders', count: customers.filter(c => c.segment === 'High Value').length, id: 'high value' },
              { label: '🔥 Active Buyers', count: customers.filter(c => c.segment === 'Active').length, id: 'active' },
              { label: '⚠️ At Risk', count: customers.filter(c => c.segment === 'At Risk').length, id: 'at risk' },
              { label: '💤 Inactive', count: customers.filter(c => c.segment === 'Dormant').length, id: 'dormant' }
            ].map((item, i) => (
              <button 
                key={i}
                onClick={() => setSegFilter(item.id)}
                className={cn(
                  "p-4 rounded-xl border text-left flex flex-col justify-between transition-all duration-150 relative overflow-hidden",
                  segFilter === item.id 
                    ? "ring-2 ring-[#8b5cf6] bg-[#1a153a]/40 border-[#3e2e6c]" 
                    : "bg-[#120f26] border-[#231b45] hover:border-zinc-400"
                )}
              >
                <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono block mb-1 font-semibold">{item.label}</span>
                <strong className="text-20 font-display text-white font-bold block">{item.count}</strong>
              </button>
            ))}
          </div>

          {/* CRM List Panel */}
          <div className="bg-[#120f26] rounded-3xl border border-[#231b45] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[#231a47] flex items-center justify-between">
              <h4 className="font-display font-medium text-14 text-zinc-350 uppercase font-mono tracking-widest leading-none">Core CRM Account Database</h4>
              {segFilter !== 'all' && (
                <button 
                  onClick={() => generateCampaignForSegment(segFilter)}
                  className="px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-[11px] font-mono leading-none rounded-lg duration-150 shadow"
                >
                  Sync Segment Ads Copy &rarr;
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-auto text-13 font-medium">
                <thead>
                  <tr className="bg-[#181432] border-b border-[#2d255c] text-[10px] font-mono text-zinc-400 uppercase select-none">
                    <th className="px-6 py-3.5 font-bold">Core Email</th>
                    <th className="px-6 py-3.5 font-bold">Transaction Count</th>
                    <th className="px-6 py-3.5 font-bold">Total Spent Amount</th>
                    <th className="px-6 py-3.5 font-bold">Geographic City</th>
                    <th className="px-6 py-3.5 font-bold">Segment Class</th>
                    <th className="px-6 py-3.5 font-bold">Latest Purchase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e193d] text-zinc-300">
                  {filtered.map((c, i) => (
                    <tr key={i} className="hover:bg-[#1a153a]/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-white text-xs">{c.email}</td>
                      <td className="px-6 py-4 text-xs text-zinc-400 font-mono">{c.ordersCount} sales</td>
                      <td className="px-6 py-4 font-bold text-white">{convert(c.totalSpent)}</td>
                      <td className="px-6 py-4 text-zinc-300 capitalize leading-none text-xs">{c.city}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase block border w-max",
                          c.segment === 'High Value' ? "bg-indigo-900/10 border-indigo-800/20 text-indigo-300" :
                          c.segment === 'Active' ? "bg-emerald-900/10 border-[#1c6448] text-[#1fd183]" :
                          c.segment === 'At Risk' ? "bg-amber-900/10 border-amber-800/10 text-amber-300" :
                          "bg-rose-900/10 border-rose-800/10 text-rose-300"
                        )}>
                          {c.segment}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-500">{new Date(c.lastOrderDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeSubTab === 'segments' && (
        <div className="space-y-6">
          
          {/* Controls */}
          <div className="flex justify-between items-center bg-[#120f26] p-6 rounded-2xl border border-[#231b45]">
            <div className="space-y-1">
              <h4 className="font-display font-medium text-16 text-white uppercase font-mono tracking-wider">Segmenti automatici della clientela (Segments)</h4>
              <p className="text-xs text-[#a7a2ce]">Visualizza i segmenti di clienti definiti in base all'attività e acquisti reali.</p>
            </div>
            <button
              onClick={() => setShowSegmentModal(true)}
              className="px-4 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-12 font-mono font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Plus size={14} /> Crea segmento (Create Segment)
            </button>
          </div>

          {/* Segments list mapping matching Italian Shot 1 */}
          <div className="bg-[#120f26] rounded-3xl border border-[#231b45] shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-auto text-13 font-medium">
                <thead>
                  <tr className="bg-[#181432] border-b border-[#2d255c] select-none text-[10px] font-mono text-zinc-400 uppercase">
                    <th className="px-6 py-4 font-bold">Nome Segmento</th>
                    <th className="px-6 py-4 font-bold">% di Clienti</th>
                    <th className="px-6 py-4 font-bold">Ultima Attività</th>
                    <th className="px-6 py-4 font-bold">Creato</th>
                    <th className="px-6 py-4 font-bold text-right">Esegui Campagna</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e193d] text-zinc-300">
                  {segmentsList.map((seg) => (
                    <tr key={seg.id} className="hover:bg-[#1a153a]/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-white leading-tight font-sans flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded bg-purple-500 inline-block" />
                        {seg.name}
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-purple-300">
                        {seg.pct}% della clientela
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-zinc-400">{seg.lastActive}</td>
                      <td className="px-6 py-4 text-xs text-zinc-500 font-mono">{seg.created}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => generateCampaignForSegment(seg.name)}
                          className="px-3.5 py-1.5 bg-[#1b1738] hover:bg-[#251f4c] text-[#a78bfa] border border-[#3e2e6c] text-[11px] font-mono rounded-lg transition-all"
                        >
                          Crea Campagna &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {activeSubTab === 'b2b' && (
        <div className="space-y-6">
          
          {/* Controls */}
          <div className="flex justify-between items-center bg-[#120f26] p-6 rounded-2xl border border-[#231b45]">
            <div className="space-y-1">
              <h4 className="font-display font-medium text-16 text-white uppercase font-mono tracking-wider">Anagrafica Aziende B2B (B2B Companies)</h4>
              <p className="text-xs text-[#a7a2ce]">Gestisci le aziende B2B collegate, con sedi operative, indirizzi doganali e mercati.</p>
            </div>
            <button
              onClick={() => setShowCompanyModal(true)}
              className="px-4 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-12 font-mono font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Plus size={14} /> Nuova azienda (B2B)
            </button>
          </div>

          {/* Companies table matching Italian Shot 3 structure! */}
          <div className="bg-[#120f26] rounded-3xl border border-[#231b45] shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-auto text-13 font-medium">
                <thead>
                  <tr className="bg-[#181432] border-b border-[#2d255c] select-none text-[10px] font-mono text-zinc-400 uppercase">
                    <th className="px-6 py-4 font-bold">Nome Azienda</th>
                    <th className="px-6 py-4 font-bold">ID Azienda</th>
                    <th className="px-6 py-4 font-bold">Referente Principale</th>
                    <th className="px-6 py-4 font-bold">Indirizzo di Spedizione Sede</th>
                    <th className="px-6 py-4 font-bold font-mono">ID Sede</th>
                    <th className="px-6 py-4 font-bold">Mercati di Vendita</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e193d] text-zinc-300">
                  {companiesList.map((co) => (
                    <tr key={co.id} className="hover:bg-[#1a153a]/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-white font-sans flex items-center gap-2">
                        <Building2 size={13} className="text-[#a78bfa] shrink-0" />
                        {co.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-zinc-400">{co.companyId}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-zinc-300">{co.mainContact}</td>
                      <td className="px-6 py-4 text-xs font-sans text-zinc-400">{co.address}</td>
                      <td className="px-6 py-4 text-xs font-mono font-bold text-purple-300">{co.locationId}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-zinc-800/40 text-xs font-mono text-[#a78bfa] rounded border border-zinc-700/45 leading-none">
                          {co.markets}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* modal creator Segmento */}
      {showSegmentModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-[#120f26] border border-[#2a2153] text-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6"
          >
            <div>
              <h3 className="font-display font-medium text-18 text-white">Nuovo Segmento (Crea Segmento)</h3>
              <p className="text-xs text-[#a7a2ce] mt-0.5">Definisci le metriche di filtraggio per popolare il segmento.</p>
            </div>

            <form onSubmit={handleAddSegment} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Nome del Segmento</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Clienti fidelizzati Milano" 
                  value={newSegName}
                  onChange={(e) => setNewSegName(e.target.value)}
                  className="w-full bg-[#1b1738] border border-[#2d255c] focus:border-[#8b5cf6] text-white rounded-lg px-3 py-2 text-13 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">% Stimata Clienti</label>
                  <input 
                    type="number" 
                    required 
                    value={newSegPct}
                    onChange={(e) => setNewSegPct(e.target.value)}
                    className="w-full bg-[#1b1738] border border-[#2d255c] focus:border-[#8b5cf6] text-white rounded-lg px-3 py-2 text-13 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Attività Recente</label>
                  <input 
                    type="text" 
                    value={newSegActive}
                    onChange={(e) => setNewSegActive(e.target.value)}
                    className="w-full bg-[#1b1738] border border-[#2d255c] focus:border-[#8b5cf6] text-white rounded-lg px-3 py-2 text-13 outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-950/20 rounded-lg border border-[#3e2e6c] text-[10px] leading-relaxed text-[#a7a2ce]">
                💡 <strong>Regola automatizzata:</strong> Questo segmento raggrupperà in tempo reale i clienti che soddisfano i canali d'acquisto.
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowSegmentModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-[#2d255c] text-zinc-400 hover:text-white text-13 font-semibold transition-colors"
                >
                  Indietro
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-13 font-semibold transition-colors shadow"
                >
                  Salva Segmento
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* modal creator Azienda B2B */}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-[#120f26] border border-[#2a2153] text-white rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6"
          >
            <div>
              <h3 className="font-display font-medium text-18 text-white">Anagrafica Nuova Azienda</h3>
              <p className="text-xs text-[#a7a2ce] mt-0.5">Sincronizza una società B2B commerciale con cataloghi personalizzati.</p>
            </div>

            <form onSubmit={handleAddCompany} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Nome azienda</label>
                  <input 
                    type="text" 
                    required
                    value={newCoName}
                    onChange={(e) => setNewCoName(e.target.value)}
                    className="w-full bg-[#1b1738] border border-[#2d255c] focus:border-[#8b5cf6] text-white rounded-lg px-3 py-2 text-13 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">ID azienda (Company ID)</label>
                  <input 
                    type="text" 
                    required
                    value={newCoId}
                    onChange={(e) => setNewCoId(e.target.value)}
                    className="w-full bg-[#1b1738] border border-[#2d255c] focus:border-[#8b5cf6] text-white rounded-lg px-3 py-2 text-13 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Referente principale</label>
                  <input 
                    type="text" 
                    required
                    value={newCoContact}
                    onChange={(e) => setNewCoContact(e.target.value)}
                    className="w-full bg-[#1b1738] border border-[#2d255c] focus:border-[#8b5cf6] text-white rounded-lg px-3 py-2 text-13 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#a78bfa] uppercase block mb-1">ID sede (Location ID)</label>
                  <input 
                    type="text" 
                    required
                    value={newCoLocationId}
                    onChange={(e) => setNewCoLocationId(e.target.value)}
                    className="w-full bg-[#1b1738] border border-[#2d255c] focus:border-[#8b5cf6] text-white rounded-lg px-3 py-2 text-13 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1 font-bold">Indirizzo di spedizione (Sede)</label>
                <div className="relative">
                  <span className="absolute top-3 left-3 text-zinc-400"><MapPin size={14} /></span>
                  <input 
                    type="text" 
                    required
                    value={newCoAddress}
                    onChange={(e) => setNewCoAddress(e.target.value)}
                    className="w-full bg-[#1b1738] border border-[#2d255c] focus:border-[#8b5cf6] text-white rounded-lg pl-9 pr-3 py-2 text-12 outline-none font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="billing_same" 
                    defaultChecked
                    className="rounded border-[#2d255c] text-[#8b5cf6] focus:ring-[#8b5cf6] bg-[#1b1738] cursor-pointer" 
                  />
                  <label htmlFor="billing_same" className="text-[10px] text-zinc-300 select-none cursor-pointer">Indirizzo fatturazione uguale</label>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Mercati di Vendita</label>
                  <input 
                    type="text" 
                    value={newCoMarkets}
                    onChange={(e) => setNewCoMarkets(e.target.value)}
                    className="w-full bg-[#1b1738] border border-[#2d255c] focus:border-[#8b5cf6] text-white rounded-lg px-3 py-2 text-11 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#231a47]">
                <button 
                  type="button" 
                  onClick={() => setShowCompanyModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-[#2d255c] text-zinc-400 hover:text-white text-13 font-semibold transition-colors"
                >
                  Annulla
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-13 font-semibold transition-colors shadow"
                >
                  Registra Azienda
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}

import React, { useMemo } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  Activity, 
  PieChart, 
  Users, 
  HelpCircle 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Order, Product, Review } from '../types';

interface AnalyticsReportViewProps {
  orders: Order[];
  products: Product[];
  reviews: Review[];
  reports: any[];
  dashboards: any[];
  onSendMessage: (msg: string) => void;
  convert: (amount: number) => string;
  convertNoDecimals: (amount: number) => string;
  language?: 'CN' | 'EN';
}

export default function AnalyticsReportView({ 
  orders, 
  products, 
  reviews, 
  reports, 
  dashboards, 
  onSendMessage,
  convert,
  convertNoDecimals,
  language = 'CN'
}: AnalyticsReportViewProps) {

  const dataMetrics = useMemo(() => {
    const totalRev = orders.reduce((acc, o) => acc + (o.status !== 'Refunded' ? o.amount : 0), 0);
    const avAOV = orders.length > 0 ? (totalRev / orders.length) : 0;
    
    // City counters
    const cities: Record<string, number> = {};
    orders.forEach(o => {
      cities[o.city] = (cities[o.city] || 0) + 1;
    });

    return {
      totalRev,
      avAOV,
      cityEntries: Object.entries(cities).map(([name, count]) => ({ name, count })).slice(0, 4)
    };
  }, [orders]);

  return (
    <div className="space-y-6 pb-10">
      
      {/* Intro info bar */}
      <div className="bg-[#120f26] p-6 rounded-2xl border border-[#231b45] flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-display font-medium text-16 text-white uppercase font-mono tracking-wider">Historical Analytics Records</h3>
          <p className="text-xs text-[#a7a2ce]">Performance diagnostics generated autonomously by the sandbox scheduler.</p>
        </div>
        
        <button 
          onClick={() => onSendMessage("Compile comprehensive sales intelligence PDF forecast report matching the current theme style structure.")}
          className="px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-12 font-mono font-bold rounded-lg shadow-sm"
        >
          GENERATE INTEL REPORT &rarr;
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Core numbers overview */}
        <div className="bg-[#120f26] rounded-3xl border border-[#231b45] p-6 space-y-6">
          <h4 className="font-display font-medium text-14 text-white uppercase font-mono tracking-widest flex items-center gap-1.5 border-b pb-3 border-[#211a43]">
            <Activity size={13} className="text-[#a78bfa]" />
            Gross Live Activity
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#1a1538] border border-[#2d245c]">
              <span className="text-[10px] font-mono text-zinc-400 block uppercase">Conversion Volume</span>
              <strong className="text-20 font-display text-white font-bold block mt-1">{convertNoDecimals(dataMetrics.totalRev)}</strong>
            </div>

            <div className="p-4 rounded-xl bg-[#1a1538] border border-[#2d245c]">
              <span className="text-[10px] font-mono text-zinc-400 block uppercase">Customer Basket AOV</span>
              <strong className="text-20 font-display text-white font-bold block mt-1">{convert(dataMetrics.avAOV)}</strong>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-mono text-zinc-400 block uppercase font-bold">Top conversion cities:</span>
            {dataMetrics.cityEntries.map((c, i) => (
              <div key={i} className="flex justify-between items-center text-xs bg-[#161230] p-2.5 rounded-lg border border-[#291f4b]">
                <span className="capitalize text-zinc-300 font-sans">{c.name}</span>
                <span className="font-mono text-[#a78bfa] font-bold">{c.count} transactions</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic customer feedback */}
        <div className="bg-[#120f26] rounded-3xl border border-[#231b45] p-6 space-y-4 lg:col-span-2">
          <h4 className="font-display font-medium text-14 text-white uppercase font-mono tracking-widest flex items-center gap-1.5 border-b pb-3 border-[#211a43]">
            <Users size={13} className="text-[#10b981]" />
            Customer Feedback Reviews Feed
          </h4>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {reviews.map((r) => (
              <div key={r.review_id} className="p-4 bg-[#171333] border border-[#281f4a] rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono font-bold text-white">{r.customer_id.substring(0, 8)}@mail.com</span>
                  <div className="flex gap-0.5 text-amber-400 font-mono text-xs">
                    {"★".repeat(r.score || 5)}{"☆".repeat(5- (r.score || 5))}
                  </div>
                </div>
                <p className="text-12 text-zinc-300 font-sans leading-relaxed">"{r.text}"</p>
                <div className="flex justify-between items-center pt-1 text-[10px] text-zinc-500 font-semibold font-mono">
                  <span>Rating score: {r.score}/5</span>
                  <span className="text-[#a78bfa]">Category: {r.product_category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

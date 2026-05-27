import React from 'react';
import { PRESET_TEMPLATES } from '../presets';
import { Sparkles, Terminal } from 'lucide-react';

interface PresetTemplatesProps {
  onSelect: (code: string, language: string) => void;
  selectedId: string | null;
}

export default function PresetTemplates({ onSelect, selectedId }: PresetTemplatesProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 select-none">
        <Sparkles className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono">
          Or Quick-Start with a Preset Snippet:
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PRESET_TEMPLATES.map((tpl) => {
          const isSelected = selectedId === tpl.id;
          return (
            <button
              key={tpl.id}
              onClick={() => onSelect(tpl.code, tpl.language)}
              className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between h-full group ${
                isSelected
                  ? 'bg-slate-800/85 border-indigo-500 shadow-lg shadow-indigo-950/20'
                  : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-xs font-semibold font-mono px-2 py-0.5 rounded-md ${
                    tpl.language === 'python' 
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' 
                      : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/10'
                  }`}>
                    {tpl.language}
                  </span>
                  
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <Terminal className="w-3 h-3 group-hover:text-indigo-400 transition-colors" />
                    {tpl.id}
                  </span>
                </div>
                
                <h4 className="text-sm font-semibold text-slate-100 mb-1 group-hover:text-white transition-colors">
                  {tpl.title}
                </h4>
                
                <p className="text-xs text-slate-400 leading-relaxed font-sans mt-1">
                  {tpl.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

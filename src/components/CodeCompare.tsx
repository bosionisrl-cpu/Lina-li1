import React, { useState } from 'react';
import { Copy, Check, Eye, EyeOff, LayoutGrid, Columns } from 'lucide-react';

interface CodeCompareProps {
  original: string;
  upgraded: string;
  language: string;
}

export default function CodeCompare({ original, upgraded, language }: CodeCompareProps) {
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedUpgraded, setCopiedUpgraded] = useState(false);
  const [isSideBySide, setIsSideBySide] = useState(true);

  const copyToClipboard = async (text: string, isUpgraded: boolean) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isUpgraded) {
        setCopiedUpgraded(true);
        setTimeout(() => setCopiedUpgraded(false), 2000);
      } else {
        setCopiedOriginal(true);
        setTimeout(() => setCopiedOriginal(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const renderLines = (code: string, isNew: boolean) => {
    const lines = code.trim().split('\n');
    return (
      <div className="font-mono text-xs md:text-sm overflow-x-auto leading-relaxed text-slate-300">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, i) => {
              const lineNum = i + 1;
              return (
                <tr 
                  key={lineNum} 
                  className={`hover:bg-slate-800/50 transition-colors ${
                    isNew ? 'hover:text-emerald-300' : 'hover:text-amber-300'
                  }`}
                >
                  <td className="w-10 text-right pr-4 select-none border-r border-slate-800 text-slate-500 font-semibold align-top pt-0.5">
                    {lineNum}
                  </td>
                  <td className={`pl-4 whitespace-pre pr-4 ${isNew ? 'text-emerald-200/90' : 'text-slate-300'}`}>
                    {line || ' '}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header controls */}
      <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-widest text-indigo-400 capitalize">
            {language} Upgrade Engine
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSideBySide(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              isSideBySide 
                ? 'bg-indigo-600/35 text-indigo-200 border border-indigo-500/50' 
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Side-by-Side</span>
          </button>
          <button
            onClick={() => setIsSideBySide(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              !isSideBySide 
                ? 'bg-indigo-600/35 text-indigo-200 border border-indigo-500/50' 
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Stacked</span>
          </button>
        </div>
      </div>

      {/* Code body block */}
      <div className={`grid ${isSideBySide ? 'md:grid-cols-2 divide-y md:divide-y-0 md:divide-x' : 'grid-cols-1 divide-y'} divide-slate-800`}>
        {/* Original Code Block */}
        <div className="flex flex-col min-w-0">
          <div className="bg-slate-950/40 px-4 py-2.5 flex items-center justify-between border-b border-slate-800/60 select-none">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Original Source
            </span>
            <button
              onClick={() => copyToClipboard(original, false)}
              className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800 transition-all"
              title="Copy original code"
            >
              {copiedOriginal ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="bg-slate-900/40 p-4 max-h-[500px] overflow-y-auto custom-scrollbar">
            {renderLines(original, false)}
          </div>
        </div>

        {/* Upgraded Code Block */}
        <div className="flex flex-col min-w-0 bg-slate-950/20">
          <div className="bg-slate-950/40 px-4 py-2.5 flex items-center justify-between border-b border-slate-800/60 select-none">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Upgraded Code
            </span>
            <button
              onClick={() => copyToClipboard(upgraded, true)}
              className="text-slate-500 hover:text-emerald-400 p-1 rounded hover:bg-slate-800 transition-all"
              title="Copy upgraded code"
            >
              {copiedUpgraded ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="bg-slate-950/10 p-4 max-h-[500px] overflow-y-auto custom-scrollbar border-l border-emerald-500/10">
            {renderLines(upgraded, true)}
          </div>
        </div>
      </div>
    </div>
  );
}

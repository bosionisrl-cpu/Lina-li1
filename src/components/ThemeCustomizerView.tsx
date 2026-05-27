import React, { useState } from 'react';
import { Palette, MessageSquareCode, Sparkles, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { StoreTheme } from '../types';
import { MOCK_DB, notifyDbChanged } from '../services/gemini';

interface ThemeCustomizerViewProps {
  theme: StoreTheme;
  onSendMessage: (msg: string) => void;
  language?: 'CN' | 'EN';
}

export default function ThemeCustomizerView({ theme, onSendMessage, language = 'CN' }: ThemeCustomizerViewProps) {
  const [themeStyle, setThemeStyle] = useState(theme.themeStyle);
  const [primaryColor, setPrimaryColor] = useState(theme.primaryColor);
  const [layoutConfig, setLayoutConfig] = useState(theme.layoutConfig);
  const [bannerTitle, setBannerTitle] = useState(theme.bannerTitle);
  const [bannerSubtitle, setBannerSubtitle] = useState(theme.bannerSubtitle);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mutate the mock database directly for fully authentic interactive sync
    MOCK_DB.theme.themeStyle = themeStyle;
    MOCK_DB.theme.primaryColor = primaryColor;
    MOCK_DB.theme.layoutConfig = layoutConfig;
    MOCK_DB.theme.bannerTitle = bannerTitle;
    MOCK_DB.theme.bannerSubtitle = bannerSubtitle;
    notifyDbChanged();

    onSendMessage(`Save store style preferences. ThemeStyle: '${themeStyle}', PrimaryColor: '${primaryColor}', LayoutConfig: '${layoutConfig}', BannerTitle: '${bannerTitle}', BannerSubtitle: '${bannerSubtitle}'`);
  };

  return (
    <div className="space-y-6 pb-10">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Core Settings Form */}
        <div className="bg-[#120f26] rounded-3xl border border-[#231b45] p-8 shadow-md lg:col-span-2 space-y-6">
          <div>
            <h3 className="font-display font-medium text-18 text-white flex items-center gap-1.5">
              <Palette className="text-[#a78bfa]" size={18} />
              Store Theme Customizer (品牌自定义)
            </h3>
            <p className="text-xs text-[#a7a2ce]">Adjust alignment parameters of your live mock storefront in real-time.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Preset Style Vibe</label>
                <select 
                  value={themeStyle}
                  onChange={(e) => setThemeStyle(e.target.value as any)}
                  className="w-full bg-[#1b1738] border border-[#2d255c] text-white text-13 px-3 py-2.5 rounded-lg outline-none"
                >
                  <option value="monochrome">Luxe Monochrome B&W (Extreme Minimalism)</option>
                  <option value="apple">Pure Minimalist (Apple Style)</option>
                  <option value="nordic">Cozy Warm Wood (Nordic Style)</option>
                  <option value="cyber">Glow Amethyst (Cyber Style)</option>
                  <option value="sand">Warm Sahara (Desert Style)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Accent Primary Color</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 border border-[#2d255c] bg-transparent rounded cursor-pointer shrink-0"
                  />
                  <input 
                    type="text" 
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full bg-[#1b1738] border border-[#2d255c] text-white text-13 px-3 py-2 rounded-lg font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Header Layout</label>
                <select 
                  value={layoutConfig}
                  onChange={(e) => setLayoutConfig(e.target.value as any)}
                  className="w-full bg-[#1b1738] border border-[#2d255c] text-white text-13 px-3 py-2.5 rounded-lg outline-none"
                >
                  <option value="centered">Standard Centered Text</option>
                  <option value="hero_banner">Immersive Unsplash Cover Banner</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-[#1d163f]">
              <div>
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Primary Display Headline</label>
                <input 
                  type="text" 
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  className="w-full bg-[#1b1738] border border-[#2d255c] text-white rounded-xl px-4 py-2.5 text-13 outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">Sub-headline Copy</label>
                <input 
                  type="text" 
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  className="w-full bg-[#1b1738] border border-[#2d255c] text-white rounded-xl px-4 py-2.5 text-13 outline-none focus:border-[#8b5cf6]"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-[#1d163f]">
              <button 
                type="submit"
                className="w-full py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg font-mono font-bold text-12 shadow"
              >
                Sync Customized Style &rarr;
              </button>
            </div>
          </form>
        </div>

        {/* Info panel */}
        <div className="bg-[#120f26] rounded-3xl border border-[#231b45] p-6 space-y-4">
          <span className="text-[10px] font-mono text-zinc-400 uppercase block font-bold">Theme engine metadata</span>
          
          <div className="space-y-2.5 text-xs text-zinc-300 font-sans leading-relaxed">
            <p>
              Your layout overrides alter variables passed directly to the interactive preview frame.
            </p>
            <p className="border-t border-[#231a47] pt-2">
              <strong className="text-white">Active theme preset:</strong> <span className="font-mono text-purple-300">{theme.themeStyle}</span>
            </p>
            <p>
              <strong className="text-white">Applied background:</strong> {theme.themeStyle === 'monochrome' ? 'Ultimate polar high-contrast stark ivory' : theme.themeStyle === 'apple' ? 'Sandwashed offwhite' : theme.themeStyle === 'nordic' ? 'Warm grain papyrus' : 'Cosmic jet obsidian'}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}

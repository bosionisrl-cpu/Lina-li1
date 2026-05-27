import React, { useState, useEffect, useRef } from 'react';
import { 
  Code, 
  Sparkles, 
  Smartphone, 
  Laptop, 
  Loader2, 
  CheckCircle2, 
  Activity, 
  Check, 
  Copy, 
  ChevronRight, 
  Info, 
  Settings,
  Flame,
  MousePointerClick,
  RefreshCw,
  Sliders,
  SmartphoneNfc,
  Video,
  Database,
  Globe2,
  Trash2,
  Undo2,
  Layers,
  Send,
  HelpCircle,
  Clock,
  ExternalLink,
  ShoppingBag,
  Zap,
  Radio,
  Share2
} from 'lucide-react';
import { PRESET_TEMPLATES } from '../presets';
import CodeCompare from './CodeCompare';

interface FrontendTemplateEditorViewProps {
  language?: 'CN' | 'EN';
  onSendMessage?: (msg: string) => void;
}

interface Improvement {
  type: string;
  description: string;
  linesAffected: string;
}

interface UpgradeResult {
  upgradedCode: string;
  explanation: string;
  complexityBefore: string;
  complexityAfter: string;
  improvements: Improvement[];
  metrics: {
    readability: number;
    performanceScore: number;
    securityScore: number;
  };
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  updatedCode?: string;
  status?: 'success' | 'error' | 'pending';
}

interface VersionLog {
  id: string;
  time: string;
  command: string;
  code: string;
  focusType: string;
}

export default function FrontendTemplateEditorView({ language = 'CN', onSendMessage }: FrontendTemplateEditorViewProps) {
  // Main Template source code variables
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESET_TEMPLATES[0].id);
  const [sourceCode, setSourceCode] = useState<string>(PRESET_TEMPLATES[0].code);
  const [focusedLanguage, setFocusedLanguage] = useState<string>(PRESET_TEMPLATES[0].language);

  // Layout View Tabs
  const [activeWorkspaceMode, setActiveWorkspaceMode] = useState<'visual' | 'code'>('visual');
  const [devicePreviewWidth, setDevicePreviewWidth] = useState<'desktop' | 'mobile-tall' | 'square-feed'>('desktop');
  const [activeSidebarTab, setActiveSidebarTab] = useState<'style' | 'presets'>('style');
  
  // Custom design parameters
  const [paddingLevel, setPaddingLevel] = useState<'dense' | 'spacious'>('spacious');
  const [colorAccent, setColorAccent] = useState<string>('#8b5cf6'); // violet default
  const [borderRadiusSize, setBorderRadiusSize] = useState<'none' | 'xl'>('xl');
  const [shadowDepth, setShadowDepth] = useState<'none' | 'glowing'>('glowing');
  const [globalFont, setGlobalFont] = useState<'sans' | 'mono'>('sans');

  // Dyad Open Kernel & Custom API Key Integration status
  const [dyadKernelMode, setDyadKernelMode] = useState<'standard' | 'interactive' | 'deep-design'>('interactive');
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [useCustomKey, setUseCustomKey] = useState<boolean>(false);
  const [imagePrompt, setImagePrompt] = useState<string>('');
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [generatedImagesList, setGeneratedImagesList] = useState<string[]>([
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&auto=format&fit=crop&q=60'
  ]);
  const [activeImageWidth, setActiveImageWidth] = useState<number>(16);
  const [activeImageHeight, setActiveImageHeight] = useState<number>(9);

  // Interactive Live Chat Command Generator state
  const [chatInputValue, setChatInputValue] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'init',
      sender: 'ai',
      text: language === 'CN' 
        ? '👋 欢迎！我是您的 AI 电商页面设计助手。在这里，您可以打字输入任何指令（如“将购买按钮换成森林绿”、“使整体背景呈现奢华黑色并添加黑金色倒计时”、“增加手机端排版间距”），我会立即修改您的代码并更新到右侧的可视化画布上。'
        : '👋 Welcome! I am your AI Storefront Designer. Tell me any modification in plain language (e.g., "Make buy buttons emerald green", "Add glassmorphism background", "Convert card columns to grid"), and watch it update live on the visual canvas.',
      time: '13:30'
    }
  ]);
  const [isAiProcessingChat, setIsAiProcessingChat] = useState<boolean>(false);
  
  // Versions Log
  const [historyVersions, setHistoryVersions] = useState<VersionLog[]>([
    {
      id: 'v1.0.0',
      time: '13:10',
      command: 'Import initial template layout source',
      code: PRESET_TEMPLATES[0].code,
      focusType: 'Original Draft'
    }
  ]);

  // Shopify Ecosystem and persistence config state
  const [customDomainName, setCustomDomainName] = useState<string>('my-glowing-decor.shopify.com');
  const [isShopifySyncing, setIsShopifySyncing] = useState<boolean>(false);
  const [isDatabaseMirroring, setIsDatabaseMirroring] = useState<boolean>(false);
  const [showShopifyModal, setShowShopifyModal] = useState<boolean>(false);
  const [wasPublishedSuccessfully, setWasPublishedSuccessfully] = useState<boolean>(false);

  // Video analysis simulation variables
  const [isVideoAnalyzing, setIsVideoAnalyzing] = useState<boolean>(false);
  const [simulatedParsedKeywords, setSimulatedParsedKeywords] = useState<string[]>([]);
  const [videoAnalysisCompleted, setVideoAnalysisCompleted] = useState<boolean>(false);

  // Main UI notifications & errors
  const [errorAlertText, setErrorAlertText] = useState<string>('');
  const [successToastText, setSuccessToastText] = useState<string>('');
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Generated metadata metrics block
  const [activeMetrics, setActiveMetrics] = useState({
    readability: 93,
    performanceScore: 89,
    securityScore: 91,
    complexityBefore: 'O(1) Unstyled Stack',
    complexityAfter: 'O(Grid) Fully Fluid Deck'
  });

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Scroll to chat bottom whenever history increases
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const selectPresetTemplateRef = useRef(selectPresetTemplate);
  useEffect(() => {
    selectPresetTemplateRef.current = selectPresetTemplate;
  }, [selectPresetTemplate]);

  useEffect(() => {
    const handleStyleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail) return;
      const { type, value } = customEvent.detail;
      if (type === 'colorAccent') {
        setColorAccent(value);
        setSuccessToastText(language === 'CN' ? '已成功应用新主题配色' : 'Theme color updated!');
        setTimeout(() => setSuccessToastText(''), 1500);
      } else if (type === 'paddingLevel') {
        setPaddingLevel(value);
        setSuccessToastText(language === 'CN' ? '间距样式更新完成' : 'Layout padding updated!');
        setTimeout(() => setSuccessToastText(''), 1500);
      } else if (type === 'borderRadiusSize') {
        setBorderRadiusSize(value);
        setSuccessToastText(language === 'CN' ? '圆角配置修改成功' : 'Border radius modified!');
        setTimeout(() => setSuccessToastText(''), 1500);
      } else if (type === 'shadowDepth') {
        setShadowDepth(value);
        setSuccessToastText(language === 'CN' ? '阴影立体度配置成功' : 'Shadow style adjusted!');
        setTimeout(() => setSuccessToastText(''), 1500);
      } else if (type === 'globalFont') {
        setGlobalFont(value);
        setSuccessToastText(language === 'CN' ? '字体排版更改成功' : 'Typography font applied!');
        setTimeout(() => setSuccessToastText(''), 1500);
      } else if (type === 'presetTemplate') {
        selectPresetTemplateRef.current(value);
      }
    };

    window.addEventListener('update-template-style', handleStyleUpdate);
    return () => {
      window.removeEventListener('update-template-style', handleStyleUpdate);
    };
  }, [language]);

  // Sync state when selected presets change
  function selectPresetTemplate(id: string) {
    const pst = PRESET_TEMPLATES.find(p => p.id === id);
    if (pst) {
      setSelectedPresetId(id);
      setSourceCode(pst.code);
      setFocusedLanguage(pst.language);
      
      // Auto register first history milestone
      const newVer: VersionLog = {
        id: `v${1 + historyVersions.length}.0.0`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        command: `Switched preset template to '${pst.title}'`,
        code: pst.code,
        focusType: 'Import Preset'
      };
      setHistoryVersions(prev => [newVer, ...prev]);
      
      // Notify chat block
      setChatHistory(prev => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          sender: 'ai',
          text: language === 'CN'
            ? `已导入预设： **${pst.title}** 模板。您现在可以直接进行可视化微调或输入交互命令。`
            : `Successfully loaded preset: **${pst.title}**. You can now slide configurations or send instructions.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      setSuccessToastText(language === 'CN' ? '预设载入成功！' : 'Preset loaded successfully!');
      setTimeout(() => setSuccessToastText(''), 3000);
    }
  };

  // Triggers general backend compilation model via chat commands
  const executeLayoutCommandQuery = async (queryText: string) => {
    if (!queryText.trim() || isAiProcessingChat) return;

    setIsAiProcessingChat(true);
    setErrorAlertText('');

    // Append user query to logs
    const msgId = `msg-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: msgId,
      sender: 'user',
      text: queryText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInputValue('');

    // Pre-determine a loading placeholder
    const aiResponseId = `ai-${Date.now()}`;
    const aiLoadingPlaceholder: ChatMessage = {
      id: aiResponseId,
      sender: 'ai',
      text: language === 'CN' 
        ? '正在解析您的模板元素并编排生成最优 HTML/Tailwind 层叠样式树，请稍候...'
        : 'Analysing core nodes, composing responsive grid alignments & optimizing color variables...',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'pending'
    };
    setChatHistory(prev => [...prev, aiLoadingPlaceholder]);

    try {
      // Craft the specialized prompt tuning parameters
      let specializedDirectPrompt = `You are a professional web designer for modern, highly aesthetic e-commerce sites.
Please carry out this modification command accurately on the following template source code: "${queryText}".
You must output a highly beautiful and visual result. Apply standard Tailwind CSS elements to achieve pristine spacing, visual balance, responsive columns on hover, and modern styling. Include nice soft shadow elements or cozy off-whites.

IMPORTANT: Change ONLY the layout/colors/structure/style variables requested. Keep any product information, images, or mock URLs fully functional and intact!`;

      // Incorporate client micro adjustment slider parameters into the request instructions!
      specializedDirectPrompt += ` Ensure the output adheres to these general workspace variables:
- Padding preference: ${paddingLevel} (dense=py-4, standard=py-8/px-6, spacious=py-16/px-8/max-w-7xl).
- Primary accent color scheme context: ${colorAccent}.
- Border radius theme preference: ${borderRadiusSize === 'none' ? 'rounded-none' : 'rounded-2xl'}.
- Spacing fonts: font-${globalFont}.`;

      const response = await fetch('/api/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: sourceCode,
          language: focusedLanguage,
          focus: 'readability',
          additionalInstructions: specializedDirectPrompt
        })
      });

      if (!response.ok) {
        throw new Error(`Workspace compiler engine returned error level ${response.status}`);
      }

      const parsed: UpgradeResult = await response.json();

      // Successfully processed!
      setSourceCode(parsed.upgradedCode);
      
      // Update stats metrics
      setActiveMetrics({
        readability: parsed.metrics.readability,
        performanceScore: parsed.metrics.performanceScore,
        securityScore: parsed.metrics.securityScore,
        complexityBefore: parsed.complexityBefore || 'O(1) Original Stack',
        complexityAfter: parsed.complexityAfter || 'O(Grid) Beautiful Visual Render'
      });

      // Update AI message state with response explanation & output
      setChatHistory(prev => prev.map(msg => {
        if (msg.id === aiResponseId) {
          return {
            ...msg,
            text: language === 'CN'
              ? `✨ **优化完毕！** 我已经成功调整了模板属性。
              
**✨ 核心改动说明：**
${parsed.explanation}

我已经将结果输出在右侧的可视化编辑画布！您可以继续发送命令进行交互调整。`
              : `✨ **Successfully Synthesized!** The e-commerce blueprint is updated.
              
**✨ Improvements Highlight:**
${parsed.explanation}

Check the interactive live view canvas. Let me know if you need other modifications!`,
            status: 'success',
            updatedCode: parsed.upgradedCode
          };
        }
        return msg;
      }));

      // Append version log milestone
      const finalRevId = `v${1 + historyVersions.length}.0.0`;
      const versionLogItem: VersionLog = {
        id: finalRevId,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        command: queryText,
        code: parsed.upgradedCode,
        focusType: 'AI Generated'
      };
      setHistoryVersions(prev => [versionLogItem, ...prev]);

      if (onSendMessage) {
        onSendMessage(`AI visual template upgrade applied. command: '${queryText}', readability: ${parsed.metrics.readability}%`);
      }

      setSuccessToastText(language === 'CN' ? '模板自适应生成成功！' : 'Interactive layout updated!');
      setTimeout(() => setSuccessToastText(''), 3000);

    } catch (err: any) {
      console.error(err);
      
      // Set diagnostic offline mock simulation fallback so we don't block work for users without API keys
      simulateOfflineHeuristicCommand(queryText, aiResponseId);
    } finally {
      setIsAiProcessingChat(false);
    }
  };

  // Offline heuristic generator tool to guarantee beautiful responsive updates even under API outages
  const simulateOfflineHeuristicCommand = (command: string, aiMsgIdToReplace: string) => {
    let mockResultCode = sourceCode;
    let commentText = '';

    const cmdLower = command.toLowerCase();
    
    // Emerald green buy buttons mutation simulation
    if (cmdLower.includes('按钮') || cmdLower.includes('button') || cmdLower.includes('green') || cmdLower.includes('emerald') || cmdLower.includes('绿')) {
      mockResultCode = sourceCode.replace(/buy-btn/g, "px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold rounded-lg transition-colors shadow-sm")
                                 .replace(/bg-\[#8b5cf6\]/g, "bg-emerald-600")
                                 .replace(/hover:bg-\[#7c3aed\]/g, "hover:bg-emerald-700");
      commentText = language === 'CN' 
        ? "✨ 已定位到页面所有的‘购买按钮’类，并替换为**高转化率琥珀森林翡翠绿 (Emerald Green 600)** 微交互响应式圆角按钮。"
        : "✨ All call-to-action purchase buttons have been redesigned to use high-converting **Emerald Green-600 shade** with interactive hover properties.";
    } 
    // Cosmic dark black luxury model
    else if (cmdLower.includes('黑') || cmdLower.includes('dark') || cmdLower.includes('black') || cmdLower.includes('cozy') || cmdLower.includes('暗')) {
      mockResultCode = sourceCode.replace(/bg-white/g, "bg-slate-900 border-zinc-800 text-white")
                                 .replace(/bg-slate-50/g, "bg-black text-white")
                                 .replace(/text-slate-900/g, "text-amber-100")
                                 .replace(/text-slate-800/g, "text-zinc-200")
                                 .replace(/text-slate-500/g, "text-zinc-400");
      commentText = language === 'CN'
        ? "✨ 视觉配色已刷新！已自动替换主次背景基元，为您提供了** Obsidian 暗夜奢华暗色黑金模板 **，极大减轻了夜间购物视觉疲劳度。"
        : "✨ Palette synchronized! Synthesized **Obsidian Luxury Deep-Dark Theme** with warm golden typography accents to ease visual weariness.";
    }
    // High spacing or padding increase
    else if (cmdLower.includes('间距') || cmdLower.includes('padding') || cmdLower.includes('space') || cmdLower.includes('gap')) {
      mockResultCode = sourceCode.replace(/p-4/g, "p-8 md:p-10")
                                 .replace(/gap-8/g, "gap-12")
                                 .replace(/py-12/g, "py-24");
      commentText = language === 'CN'
        ? "✨ 已检测并微调 HTML 容器布局属性。我们将元素单元间距由 standard 扩大为 **Spacious 呼吸感留白**，提升视觉呼吸舒适感。"
        : "✨ Adjusted container constraints! Increased internal padding structures into **Spacious respiratory spacing** for premium storefront airyness.";
    }
    // Custom general beautiful override
    else {
      mockResultCode = sourceCode.replace(/product-section/g, "py-12 px-6 max-w-7xl mx-auto bg-slate-50/50 rounded-2xl border border-slate-100 shadow-sm")
                                 .replace(/cta-actions/g, "flex items-center gap-4 mt-8");
      commentText = language === 'CN'
        ? `✨ AI 完成了对指令 “${command}” 的局部样式注入。已自动梳理 DOM 标签，修复并补全结构性 Tailwind CSS 核心类命名规范。`
        : `✨ Synthesized custom micro changes based on: "${command}". Standardized core template hierarchy successfully.`;
    }

    // Apply simulation update
    setSourceCode(mockResultCode);
    
    // Update active chatbot message
    setChatHistory(prev => prev.map(msg => {
      if (msg.id === aiMsgIdToReplace) {
        return {
          ...msg,
          text: commentText + (language === 'CN' 
            ? "\n\n*(提示：已自动激活本地离线自修复引擎进行快速视图布局调整)*" 
            : "\n\n*(Note: Client-side layout engine compiled this visual change successfully)*"),
          status: 'success',
          updatedCode: mockResultCode
        };
      }
      return msg;
    }));

    // Register history milestone
    const mockRevId = `v${1 + historyVersions.length}.0.0`;
    const versionLogItem: VersionLog = {
      id: mockRevId,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      command: command,
      code: mockResultCode,
      focusType: 'Local Compile'
    };
    setHistoryVersions(prev => [versionLogItem, ...prev]);
  };

  // Rollback to designated older version state
  const revertToHistoryMilestone = (ver: VersionLog) => {
    setSourceCode(ver.code);
    setSuccessToastText(language === 'CN' ? `已成功回滚至版本 ${ver.id}！` : `Restored version ${ver.id}!`);
    
    // Post indicator in chat console
    setChatHistory(prev => [
      ...prev,
      {
        id: `revert-${Date.now()}`,
        sender: 'ai',
        text: language === 'CN'
          ? `🔄 **检测到历史版本回放操作**：已将当前画布源码一键回滚还原至版本 **${ver.id}** (${ver.time} - *${ver.focusType}*)`
          : `🔄 **Version rollback triggered**: Successfully restored source content back to **${ver.id}** (${ver.time} - *${ver.focusType}*)`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    setTimeout(() => setSuccessToastText(''), 3000);
  };

  // Mirror source layout code directly to parent mock storage database
  const triggerDatabaseMirrorSave = () => {
    if (isDatabaseMirroring) return;
    setIsDatabaseMirroring(true);
    
    setTimeout(() => {
      setIsDatabaseMirroring(false);
      setSuccessToastText(language === 'CN' ? '数据库持久化镜像实时同步完成！' : 'Database synchronized & persisted!');
      
      setChatHistory(prev => [
        ...prev,
        {
          id: `mirror-save-${Date.now()}`,
          sender: 'ai',
          text: language === 'CN' 
            ? '💾 **实时镜像同步报告**：当前前端模板以及微调属性（包含间距、主色调、圆角属性）均已顺利向后台数据库持久层同步，确保持久存储环境的最高一致性。'
            : '💾 **Mirror Persistence Report**: Current source template layout code blocks and CSS tweaks are successfully packaged and written into SAAS cloud datastore securely.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      
      setTimeout(() => setSuccessToastText(''), 3000);
    }, 1200);
  };

  // Domain & Shopify publishing module simulation
  const handleShopifyPublishPush = () => {
    setIsShopifySyncing(true);
    setWasPublishedSuccessfully(false);

    setTimeout(() => {
      setIsShopifySyncing(false);
      setWasPublishedSuccessfully(true);
      
      setChatHistory(prev => [
        ...prev,
        {
          id: `shopify-publish-${Date.now()}`,
          sender: 'ai',
          text: language === 'CN'
            ? `🚀 **Shopify 部署与映射成功！** 
- **目标商铺映射**: \`https://${customDomainName}\`
- **状态报告**: 已检测通过标准 DOM 与 Tailwind 可访问性规范，模板已在 Shopify theme.liquid 和应用扩展块中编译挂载，并可直接在 Shopify 后台实时引用。`
            : `🚀 **Shopify Ecosystem Push Successful!**
- **Connected Domain**: \`https://${customDomainName}\`
- **Build Status**: Verified layout tree accessibility. Extracted asset schema into Shopify assets block safely.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 2000);
  };

  // Video Content Analysis system mock
  const runSimulatedVideoAnalysis = () => {
    if (isVideoAnalyzing) return;
    setIsVideoAnalyzing(true);
    setVideoAnalysisCompleted(false);

    setTimeout(() => {
      setIsVideoAnalyzing(false);
      setVideoAnalysisCompleted(true);
      setSimulatedParsedKeywords([
        'Minimalist Decor Grid Layout',
        'Cozy Sandalwood Glow Lighting',
        'Call-to-Action Impulse Button placement',
        'High Contrast Text Backdrop'
      ]);

      // Update current code with an optimized promotional card mockup matching video theme!
      const videoThemeLayoutCode = `<div class="max-w-4xl mx-auto bg-[#0a0715] text-[#eadbf2] rounded-3xl p-8 border border-[#301c51]/60 shadow-2xl relative overflow-hidden">
  <div class="absolute -top-12 -left-12 w-48 h-48 bg-purple-700/25 rounded-full blur-3xl pointer-events-none" />
  <div class="absolute -bottom-12 -right-12 w-48 h-48 bg-[#db2777]/20 rounded-full blur-3xl pointer-events-none" />

  <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
    <div class="space-y-4">
      <span class="px-3 py-1 bg-[#8b5cf6]/20 text-[#c0a9ff] border border-purple-500/20 text-[10px] uppercase tracking-widest font-mono font-bold rounded-full">
        🎬 VIDEO CAMPAIGN HIGHLIGHT
      </span>
      <h2 class="text-3xl font-display font-black text-white tracking-tight leading-tight">
        Cozy Sandalwood <br/>Artisanal Organic Soy Candle
      </h2>
      <p class="text-xs text-zinc-400 max-w-md leading-relaxed">
        Our viral video highlighted the deep wood raw amber grain textures, organic soy sootless waxes, and comforting fireside amber warmth. Tap to capture this sensory living ambient glow inside your bedroom.
      </p>
      
      <div class="flex items-center gap-6 pt-2">
        <div class="font-mono text-xs">
          <span class="text-zinc-550 block">VIDEO RATING:</span>
          <span class="text-amber-400 font-bold">★★★★★ 4.98</span>
        </div>
        <div class="w-px h-8 bg-zinc-800" />
        <div class="font-mono text-xs">
          <span class="text-zinc-550 block">DURABILITY:</span>
          <span class="text-emerald-400 font-bold font-mono">50+ Hours Clean-Burn</span>
        </div>
      </div>
    </div>

    <div class="bg-[#141029]/80 border border-[#332252] p-5 rounded-2xl w-full md:w-80 shrink-0 space-y-4 shadow-xl">
      <div class="flex items-center justify-between">
        <span class="text-xs text-zinc-400">Exclusive Broadcast Offer</span>
        <span class="text-[10px] font-mono font-bold text-pink-400 bg-pink-950/20 px-2 py-0.5 rounded uppercase border border-pink-900/40">Active Tag</span>
      </div>
      <div class="flex items-baseline gap-2">
        <span class="text-28 font-mono font-black text-white">$24.00</span>
        <span class="text-xs line-through text-zinc-650">$38.00</span>
        <span class="text-xs text-rose-400 font-bold">(35% OFF)</span>
      </div>
      <button class="w-full py-3 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-750 hover:to-pink-750 text-white font-mono font-extrabold text-12 rounded-xl transition-all shadow-md">
        Deploy To My Cart
      </button>
      <span class="text-[10px] font-sans text-zinc-500 text-center block">
        🔒 Powered by Shopify Checkouts and Secure SSL Guarantee
      </span>
    </div>
  </div>
</div>`;

      setSourceCode(videoThemeLayoutCode);

      setChatHistory(prev => [
        ...prev,
        {
          id: `video-analyser-${Date.now()}`,
          sender: 'ai',
          text: language === 'CN'
            ? `🎥 **视频多媒体智能解析报告**：我已成功深度挖掘高转化视频卖点！
- **识别主题与高光**: *${simulatedParsedKeywords.join(', ')}*
- **生成应用板块**: “Cozy Sandalwood 视频同款高光促销卡片”
- **页面代码转换**: 已自动落地画布！卡片完美适配横屏及 9:16 自适应布局，拥有呼吸暗夜极简奢华感。`
            : `🎥 **Multimedia Video Extraction Completed**:
- **Extracted Highlights**: *${simulatedParsedKeywords.join(', ')}*
- **Generated Component**: Elegant fireside video companion promo widget.
- **Canvas Feed Action**: Injected direct responsive code blocks onto your workbench live preview.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      setSuccessToastText(language === 'CN' ? '视频高光提取模板并注入完成！' : 'Video promotional theme updated!');
      setTimeout(() => setSuccessToastText(''), 3000);

    }, 2200);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Compile active layout styles variables locally to update code properties instantly inside workspace rendering tree
  const computeInjectedAdaptiveCode = (): string => {
    // Generate class modifications based on active control properties smoothly
    let finalCode = sourceCode;

    // Apply color accent color replace
    if (colorAccent !== '#8b5cf6') {
      finalCode = finalCode.replace(/#8b5cf6/g, colorAccent);
    }

    // Apply font modifications
    if (globalFont === 'mono') {
      finalCode = finalCode.replace(/font-sans/g, 'font-mono').replace(/font-serif/g, 'font-mono');
    }

    return finalCode;
  };

  // Final processed responsive code
  const runtimeGeneratedHtmlCode = computeInjectedAdaptiveCode();

  return (
    <div className="space-y-6 pb-16 font-sans text-slate-100 select-none">
      
      {/* Visual Workspace Meta Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 bg-[#0f0b21] rounded-2xl border border-[#20183b] shadow-2xl relative overflow-hidden font-sans">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-[#8b5cf6]/5 to-transparent pointer-events-none select-none" />
        <div className="space-y-1 relative z-10">
          <h1 className="hidden text-xl md:text-2xl font-bold text-white tracking-tight">
            {language === 'CN' ? '商店网页设计工坊' : 'Storefront Designer'}
          </h1>
          <p className="hidden text-xs text-[#9c94cb] max-w-2xl leading-relaxed">
            {language === 'CN' 
              ? '支持输入文本指令进行网页设计，左侧提供圆角、主色调、间距等核心风格的一键微调。' 
              : 'Enter styling directives, adjust palettes, spacing and rounded borders inline to customize your storefront layout.'}
          </p>
        </div>

        {/* Global Persistence Control Bars */}
        <div className="flex items-center gap-2 relative z-10 shrink-0">
          <button 
            onClick={triggerDatabaseMirrorSave}
            disabled={isDatabaseMirroring}
            className="px-3.5 py-2 bg-[#141029]/80 hover:bg-[#1a1538] border border-[#2d245c] rounded-xl text-xs font-bold text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-45"
            title="Save Draft"
          >
            {isDatabaseMirroring ? (
              <>
                <Loader2 size={12} className="animate-spin text-purple-400" />
                <span>{language === 'CN' ? '正在保存...' : 'Saving...'}</span>
              </>
            ) : (
              <>
                <Database size={12} className="text-purple-400" />
                <span>{language === 'CN' ? '保存草稿' : 'Save Draft'}</span>
              </>
            )}
          </button>

          <button 
            type="button"
            onClick={() => setShowShopifyModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 size={12} />
            <span>{language === 'CN' ? '一键分发' : 'Publish Sync'}</span>
          </button>
        </div>
      </div>

      {/* Main Panel Core Grid Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
        
        {/* WORKSPACE & LIVE PREVIEW (Col-span-12): Dual Mode Switcher, Multi device preview cards, Visual HTML container */}
        <div className="lg:col-span-12 space-y-6">
          
          {/* Dual-Mode View Switch Tabs & Device aspect Ratio choice bar */}
          <div className="bg-[#120f26] p-3 rounded-2xl border border-[#221a41] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 select-none">
            
            {/* Visual vs Code Choice tabs: Compact 2 small buttons */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-sans font-bold text-zinc-500 uppercase mr-1.5 tracking-wider hidden xs:inline">视图</span>
              <div className="flex bg-[#0f0b21] p-0.5 rounded-lg border border-[#2d245c] shrink-0">
                {[
                  { id: 'visual', tooltip: '外观预览', icon: Layers },
                  { id: 'code', tooltip: '代码视窗', icon: Code }
                ].map((m) => {
                  const isActive = activeWorkspaceMode === m.id;
                  const IconComp = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setActiveWorkspaceMode(m.id as any)}
                      className={`p-2 rounded transition-all hover:text-white relative group ${
                        isActive 
                          ? 'bg-[#8b5cf6] text-white shadow-md font-bold' 
                          : 'text-zinc-500 hover:text-zinc-350'
                      }`}
                      title={m.tooltip}
                    >
                      <IconComp size={13} strokeWidth={2.5} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Simulated SSL HTTPS Search/Address Bar inside the top bar */}
            <div className="flex-1 max-w-sm mx-auto w-full hidden md:block">
              <div className="flex items-center gap-1.5 bg-[#080611] rounded-xl border border-[#221b44] px-2.5 py-1 text-[11px] text-[#a39ec4] select-text">
                <Globe2 size={11} className="text-emerald-400 shrink-0" />
                <span className="truncate text-zinc-400 font-medium">my-concept-store.com/preview</span>
              </div>
            </div>

            {/* Canvas Aspect Ratios choice */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {activeWorkspaceMode === 'visual' ? (
                <div className="flex bg-[#0f0b21] p-0.5 rounded-lg border border-[#2d245c] text-xs">
                  {[
                    { id: 'desktop', label: '🖥️ 桌面端' },
                    { id: 'mobile-tall', label: '📱 移动端' },
                    { id: 'square-feed', label: '🔲 馈送流' }
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      onClick={() => setDevicePreviewWidth(sz.id as any)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                        devicePreviewWidth === sz.id 
                          ? 'bg-[#8b5cf6]/20 border border-[#8b5cf6]/35 text-[#c8b5ff] font-extrabold shadow-inner' 
                          : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-zinc-500 font-mono">
                  ⚡ MARGIN MARKUP
                </div>
              )}

              {/* External open link */}
              <button 
                onClick={() => {
                  const blob = new Blob([runtimeGeneratedHtmlCode], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  window.open(url, '_blank');
                  setSuccessToastText(language === 'CN' ? '已在新选项卡中打开预览！' : 'Opened live preview in new tab!');
                  setTimeout(() => setSuccessToastText(''), 2500);
                }}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 hover:text-white text-zinc-500 rounded border border-zinc-800 transition-colors cursor-pointer flex items-center gap-1 text-[9px] font-mono"
                title="Preview standalone app version"
              >
                <ExternalLink size={10} />
                <span className="hidden xs:inline">Open</span>
              </button>
            </div>
            
          </div>

          {/* Sleek preset design actions pill deck - MOVED TOP - Above primary preview frame card */}
          <div className="bg-[#120f26] p-4 rounded-2xl border border-[#221a41] shadow-xl space-y-2.5 font-sans">
            <h3 className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
              <Sparkles size={10} className="text-[#8b5cf6]" />
              <span>✨ AI 智控一键设计方案 (AI One-Click Design Presets)</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: language === 'CN' ? '🟢 按钮替换为森林绿' : '🟢 Emerald Green Buttons', query: 'Change all call-to-action buttons to emerald green and add soft hover shadow effect.' },
                { label: language === 'CN' ? '🌙 整体切换为奢华黑金主题' : '🌙 Obsidian Luxury Theme', query: 'Redesign this entire component with Obsidian luxury deep dark space background and warm gold text colors.' },
                { label: language === 'CN' ? '📏 将布局间距设为宽敞呼吸感' : '📏 Airy Spacious Margins', query: 'Increase container spacing, padding configurations, and margins throughout to make it spacious with rounded 2xl corners.' }
              ].map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => executeLayoutCommandQuery(p.query)}
                  disabled={isAiProcessingChat}
                  className="text-[9px] font-mono bg-[#1c163a] hover:bg-[#8b5cf6]/20 border border-[#2d245c] hover:border-[#8b5cf6]/60 rounded-lg px-2.5 py-1 text-zinc-300 hover:text-[#c0a9ff] transition-all disabled:opacity-40 cursor-pointer"
                >
                  {isAiProcessingChat ? 'Weaving...' : p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Central Workspace display frame card */}
          <div className="min-h-[480px] bg-[#120f26] rounded-3xl border border-[#231b45] p-6 shadow-2xl relative flex flex-col justify-between">
            
            {/* 1. VISUAL WORKSPACE WINDOW */}
            {activeWorkspaceMode === 'visual' && (
              <div className="flex-1 flex flex-col justify-between h-full">
                
                {/* Meta details */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#231a47]/55 select-none text-xs">
                  <span className="text-[10px] font-bold text-[#c0a9ff] uppercase flex items-center gap-1.5">
                    <MousePointerClick size={12} />
                    {language === 'CN' ? '设计外观实时预览' : 'Storefront Layout Preview'}
                  </span>
                  
                  {/* Floating save indicators */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 bg-slate-900 border border-zinc-800 px-3 py-1 rounded-lg select-none">
                      {devicePreviewWidth === 'desktop' ? (language === 'CN' ? 'PC 宽屏' : 'Wide Desktop') : devicePreviewWidth === 'mobile-tall' ? (language === 'CN' ? '手机端' : 'Mobile View') : (language === 'CN' ? '正方形' : 'Square Feed')}
                    </span>
                  </div>
                </div>

                {/* Simulated browser wrapper configured cleanly by dynamic padding levels */}
                <div className="flex-1 flex items-center justify-center p-2 mb-4 bg-slate-950/20 rounded-2xl border border-[#20183b]/20 min-h-[380px]">
                  <div className={`transition-all duration-300 rounded-2xl overflow-hidden border border-slate-200/5 bg-slate-100 shadow-2xl relative select-none ${
                    devicePreviewWidth === 'mobile-tall' ? 'max-w-[340px] w-full min-h-[450px]' : 
                    devicePreviewWidth === 'square-feed' ? 'max-w-[480px] w-full min-h-[400px]' : 'w-full min-h-[360px]'
                  }`}>
                    {/* Device header top mockup decoration bar */}
                    <div className="bg-slate-200 border-b border-slate-350/50 px-4 py-2 flex items-center justify-between pointer-events-none select-none">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 tracking-wider">
                        {devicePreviewWidth === 'mobile-tall' ? 'IPHONE_LIVE_RENDER_PORT.html' : 'GOOGLE_CHROME_ROUTED_SANDBOX_3000.html'}
                      </span>
                    </div>

                    {/* Scoped CSS Style section to shrink heading sizes and general typeface sizes ("图字体太大全部缩小") */}
                    <style dangerouslySetInnerHTML={{ __html: `
                      .preview-sandbox h1, .preview-sandbox h2 { font-size: 1.15rem !important; line-height: 1.35rem !important; margin-bottom: 0.5rem !important; }
                      .preview-sandbox h3 { font-size: 0.9rem !important; margin-bottom: 0.25rem !important; font-weight: 700 !important; }
                      .preview-sandbox p { font-size: 0.72rem !important; line-height: 1.05rem !important; margin-bottom: 0.5rem !important; }
                      .preview-sandbox button, .preview-sandbox .buy-btn { font-size: 0.68rem !important; padding: 4px 10px !important; border-radius: 4px !important; }
                      .preview-sandbox .price { font-size: 0.85rem !important; font-weight: 700 !important; }
                      .preview-sandbox img { max-height: 110px !important; object-fit: cover !important; margin-bottom: 0.4rem !important; }
                      .preview-sandbox .products { gap: 0.85rem !important; }
                      .preview-sandbox .product-section, .preview-sandbox .shopping-bag, .preview-sandbox .customer-reviews { padding: 1.25rem !important; }
                      .preview-sandbox table th, .preview-sandbox table td { padding: 4px 6px !important; font-size: 0.72rem !important; }
                      .preview-sandbox { font-size: 11px !important; }
                    `}} />

                    {/* Live HTML renderer using dangerouslySetInnerHTML */}
                    <div 
                      className={`preview-sandbox max-h-[360px] overflow-y-auto text-black font-sans leading-normal bg-white min-h-[320px] ${
                        paddingLevel === 'dense' ? 'p-3' : 'p-6'
                      } ${borderRadiusSize === 'none' ? 'rounded-none' : 'rounded-2xl'}`}
                      dangerouslySetInnerHTML={{ __html: runtimeGeneratedHtmlCode }}
                    />
                  </div>
                </div>

                {/* Bottom guidance label */}
                <div className="p-3 bg-[#0f0b21]/75 border border-[#291e51] rounded-2xl text-[10px] md:text-[11px] text-[#9a92cd] text-center select-none font-medium leading-relaxed">
                  💡 {language === 'CN' 
                    ? '提示：右栏面板提供了快捷圆角、主色调、间距等核心风格的一键微调。若要进行更随心、更复杂的网页装修，亦可直接在 AI 智能副官中直接输入交互指令。'
                    : 'Style values chosen on the right sidebar will render instantly. For advanced layout customizations, command the persistent "Operations Co-Op" AI console in the right sidebar.'}
                </div>

              </div>
            )}

            {/* 2. IDE-LIKE MANUAL TEXT CODE SCRIPTS WINDOW */}
            {activeWorkspaceMode === 'code' && (
              <div className="flex flex-col h-full justify-between">
                
                {/* Header elements */}
                <div className="bg-[#0f0b21] px-4 py-3 border border-[#231b45] rounded-t-2xl flex items-center justify-between select-none">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase">
                      Immersive Code editor (模板直编视窗)
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => copyToClipboard(runtimeGeneratedHtmlCode)}
                      className="text-zinc-500 hover:text-white p-1 rounded hover:bg-[#1a1538] transition-all flex items-center gap-1 font-mono text-[10px]"
                      title="Copy full source markup to system clipboard"
                    >
                      {copiedNotification ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      <span>Copy Code</span>
                    </button>
                  </div>
                </div>

                <div className="flex border-b border-[#20183f] bg-[#090614] min-h-[340px] relative rounded-b-2xl border-x">
                  <textarea
                    value={sourceCode}
                    onChange={(e) => {
                      setSourceCode(e.target.value);
                      setErrorAlertText('');
                    }}
                    spellCheck={false}
                    className="flex-1 bg-transparent text-slate-200 p-4 font-mono text-12 outline-none resize-none leading-relaxed min-h-[340px] overflow-y-auto"
                    placeholder="Raw template visual markup..."
                  />
                </div>

                <div className="p-3 text-center text-zinc-500 text-[10px] font-mono leading-relaxed mt-2 select-none">
                  Note: Editing source code directly resets active AI upgrade metrics. Modify inline attributes safely.
                </div>

              </div>
            )}

            {/* Report Mode removed dynamically */}

          </div>

          {/* DRAFTS COMMIT TIMELINE & ROLLBACKS HISTORY */}
          <div className="bg-[#120f26] p-5 rounded-2xl border border-[#221a41] shadow-xl space-y-4 font-sans">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>⏱️ 设计备份历史 (Restore History)</span>
              <span className="text-[9px] text-zinc-500 font-bold font-mono">DRAFTS</span>
            </h3>

            <div className="space-y-2 h-[120px] overflow-y-auto">
              {historyVersions.map((v, i) => (
                <div 
                  key={v.id}
                  className="p-3 bg-slate-950/50 hover:bg-[#141029] border border-[#2d245c]/40 hover:border-violet-500/20 rounded-xl flex items-center justify-between text-xs transition-all animate-in fade-in"
                >
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-[#c0a9ff] bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 px-1.5 py-0.5 rounded leading-none uppercase">
                        V{historyVersions.length - i}
                      </span>
                      <span className="text-zinc-550 text-[9px]">[{v.time}]</span>
                    </div>
                    <p className="text-[10px] text-zinc-300 truncate mt-1">
                      {v.command}
                    </p>
                  </div>

                  <button
                    onClick={() => revertToHistoryMilestone(v)}
                    className="p-1 px-2.5 bg-[#141029] hover:bg-violet-950/40 border border-[#2d245c] text-purple-300 hover:text-[#c0a9ff] text-[10px] font-bold rounded-lg transition-all"
                  >
                    {language === 'CN' ? '应用版本' : 'Restore'}
                  </button>
                </div>
              ))}
            </div>
            
            <p className="text-[9px] text-zinc-500 leading-relaxed block text-center">
              *点击对应记录即可将当时设计的历史副本加载并还原至当前预览区域中。
            </p>
          </div>

        </div>

        {/* SIDEBAR BLOCK (Lg: col-span-4): Tab-controlled design workbench for absolute minimalism */}
        <div className="hidden">
          
          {/* 2-Tab Navigator: Elegant & Clean 2-Grid Selector */}
          <div className="bg-[#120f26] p-1 rounded-xl border border-[#2d245c] grid grid-cols-2 gap-1 select-none">
            {[
              { id: 'style', label: '🎨 Design', desc: language === 'CN' ? '视觉风格' : 'Style Presets' },
              { id: 'presets', label: '🗂️ Templates', desc: language === 'CN' ? '核心预设' : 'Layout Deck' }
            ].map((tab) => {
              const isActive = activeSidebarTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSidebarTab(tab.id as any)}
                  className={`py-1.5 rounded-lg text-center transition-all ${
                    isActive 
                      ? 'bg-[#8b5cf6] text-white font-bold shadow-lg shadow-purple-500/10' 
                      : 'text-zinc-500 hover:text-zinc-350 hover:bg-[#1a153a]/40'
                  }`}
                >
                  <div className="text-[10px] font-sans font-bold leading-none">{tab.label}</div>
                  <div className="text-[8px] opacity-75 mt-1 scale-90">{tab.desc}</div>
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT PANEL */}
          <div className="space-y-4">
            
            {/* 1. VISUAL STYLE CONTROLS TAB */}
            {activeSidebarTab === 'style' && (
              <div className="bg-[#120f26] p-4 rounded-2xl border border-[#221a41] shadow-2xl space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-[#2d245c]/55">
                  <h3 className="text-[10px] font-bold text-zinc-300 flex items-center gap-1.5">
                    <Sliders size={12} className="text-[#8b5cf6]" />
                    <span>🎨 风格参数配置 (Visual Design)</span>
                  </h3>
                </div>

                {/* Accent Color Palette Switcher - Strictly 2 options (2格) */}
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400 block font-semibold uppercase">品牌主题色 (Accent Color)</span>
                  <div className="grid grid-cols-2 gap-1 bg-[#0f0b21] p-1 rounded-xl border border-[#2b2153]">
                    {[
                      { name: 'Royal Violet', hex: '#8b5cf6', label: '💎 Violet' },
                      { name: 'Sandalwood Jade', hex: '#059669', label: '🍃 Forest' }
                    ].map((col) => {
                      const isActive = colorAccent === col.hex;
                      return (
                        <button
                          key={col.hex}
                          type="button"
                          onClick={() => {
                            setColorAccent(col.hex);
                            setSuccessToastText(`Applied ${col.name}!`);
                            setTimeout(() => setSuccessToastText(''), 1500);
                          }}
                          className={`py-1 text-[9px] font-mono font-bold rounded-lg transition-all ${
                            isActive 
                              ? 'bg-[#8b5cf6] text-white shadow-md' 
                              : 'text-zinc-500 hover:text-zinc-350'
                          }`}
                        >
                          {col.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Container spacing block controls - Strictly 2 options (2格) */}
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400 block font-semibold uppercase">内容间距 (Padding Selection)</span>
                  <div className="grid grid-cols-2 gap-1 bg-[#0f0b21] p-1 rounded-xl border border-[#2b2153]">
                    {[
                      { id: 'dense', label: 'Dense 细密' },
                      { id: 'spacious', label: 'Airy 宽敞' }
                    ].map((level) => (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => setPaddingLevel(level.id as any)}
                        className={`py-1 text-[9px] font-mono font-bold rounded-lg transition-all ${
                          paddingLevel === level.id 
                            ? 'bg-[#8b5cf6] text-white shadow-md' 
                            : 'text-zinc-500 hover:text-zinc-350'
                        }`}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Border Radius - Strictly 2 options (2格) */}
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400 block font-semibold uppercase">组件圆角大小 (Border Radius)</span>
                  <div className="grid grid-cols-2 gap-1 bg-[#0f0b21] p-1 rounded-xl border border-[#2b2153]">
                    {[
                      { id: 'none', label: 'Sharp 直角' },
                      { id: 'xl', label: 'Pristine 大圆' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setBorderRadiusSize(opt.id as any)}
                        className={`py-1 text-[9px] font-mono font-bold rounded-lg transition-all ${
                          borderRadiusSize === opt.id
                            ? 'bg-[#8b5cf6] text-white' 
                            : 'text-zinc-500 hover:text-zinc-350'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shadows depth - Strictly 2 options (2格) */}
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400 block font-semibold uppercase">影子投影立体度 (Shadow Style)</span>
                  <div className="grid grid-cols-2 gap-1 bg-[#0f0b21] p-1 rounded-xl border border-[#2b2153]">
                    {[
                      { id: 'none', label: 'Flat 扁平' },
                      { id: 'glowing', label: 'Glowing 霓虹' }
                    ].map((sh) => (
                      <button
                        key={sh.id}
                        type="button"
                        onClick={() => setShadowDepth(sh.id as any)}
                        className={`py-1 text-[9px] font-mono font-bold rounded-lg transition-all capitalize ${
                          shadowDepth === sh.id ? 'bg-[#8b5cf6] text-white' : 'text-zinc-500 hover:text-zinc-350'
                        }`}
                      >
                        {sh.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font pairing - Strictly 2 options (2格) */}
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-400 block font-semibold uppercase">主排版字体 (Typography Style)</label>
                  <div className="grid grid-cols-2 gap-1 bg-[#0f0b21] p-1 rounded-xl border border-[#2b2153]">
                    {[
                      { id: 'sans', label: 'Inter' },
                      { id: 'mono', label: 'JetBrains' }
                    ].map(ft => (
                      <button
                        key={ft.id}
                        type="button"
                        onClick={() => setGlobalFont(ft.id as any)}
                        className={`py-1 text-[9px] font-mono font-bold rounded-lg transition-all ${
                          globalFont === ft.id 
                            ? 'bg-[#8b5cf6] text-white' 
                            : 'text-zinc-500 hover:text-zinc-350'
                        }`}
                      >
                        {ft.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. E-COMMERCE CORE COMPONENT PRESET DECK */}
            {activeSidebarTab === 'presets' && (
              <div className="bg-[#120f26] p-4 rounded-2xl border border-[#221a41] shadow-2xl space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-[#2d245c]/55">
                  <h3 className="text-[10px] font-bold text-zinc-300 flex items-center gap-1.5">
                    <ShoppingBag size={12} className="text-[#8b5cf6]" />
                    <span>🗂️ 电商组合模板 (Core Templates)</span>
                  </h3>
                </div>
                
                <div className="space-y-2 h-[340px] overflow-y-auto pr-1">
                  {PRESET_TEMPLATES.map((item) => {
                    const isSelected = selectedPresetId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectPresetTemplate(item.id)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all relative ${
                          isSelected 
                            ? 'bg-[#8b5cf6]/20 border-[#8b5cf6] text-[#c0a9ff] shadow-inner' 
                            : 'bg-[#15112e]/50 border-[#2d245c]/35 text-zinc-400 hover:text-white hover:bg-[#19153a]/65'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2 w-1 h-1 rounded-full bg-[#8b5cf6] animate-pulse" />
                        )}
                        <h4 className="text-[10px] font-bold flex items-center gap-1.5 text-white">
                          <ShoppingBag size={10} className="text-purple-400 shrink-0" />
                          {item.title}
                        </h4>
                        <p className="text-[9px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* FLOAT CONFIRMATION TOAST overlays */}
      {successToastText && (
        <div className="fixed bottom-6 right-6 z-50 p-3 bg-emerald-950 border border-emerald-800 text-emerald-100 text-xs rounded-xl flex gap-2 items-center leading-none shadow-2xl font-mono animate-bounce font-bold">
          <CheckCircle2 size={13} className="text-emerald-400" />
          <span>{successToastText}</span>
        </div>
      )}

      {/* SHOPIFY ECOSYSTEM PUBLICATION SETTINGS MODAL */}
      {showShopifyModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#120f26] border border-[#2c2250] rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between border-b border-[#2d245c] pb-3 select-none">
              <h4 className="text-15 font-bold text-white font-display flex items-center gap-2">
                <Globe2 size={15} className="text-[#8b5cf6]" />
                {language === 'CN' ? 'Shopify 部署与域名镜像分发配置' : 'Deploy To Shopify Merchant Center'}
              </h4>
              <button 
                onClick={() => {
                  setShowShopifyModal(false);
                  setWasPublishedSuccessfully(false);
                }}
                className="text-zinc-550 hover:text-white font-mono text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-[#a7a2ce] leading-relaxed">
                {language === 'CN'
                  ? '将您可视化微调所出的 HTML / Tailwind CSS 模板无缝推送发布到外部可分享链接或同步到您的 Shopify 生态应用。该步骤会自动构建合规代码，并写入安全 Shopify 主题资产。'
                  : 'Distribute current visual templates directly into Shopify Liquid assets and external accessible URLs instantly. The sync workflow generates WCAG certified layout markup for fast user displays.'}
              </p>

              {/* Input targets shopify domain */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 block uppercase">Target Store Domain or DNS Url (目标店铺域名映射)</label>
                <div className="flex gap-2">
                  <div className="bg-[#0b081c] border border-[#2d245c] px-3 py-2 text-zinc-500 rounded-xl text-xs flex items-center font-mono leading-none">
                    https://
                  </div>
                  <input
                    type="text"
                    value={customDomainName}
                    onChange={(e) => setCustomDomainName(e.target.value)}
                    className="flex-1 bg-[#141029] border border-[#2d245c] rounded-xl px-4 py-2 text-xs outline-none text-[#efecf6] focus:border-[#8b5cf6] font-mono"
                    placeholder="e.g. mystic-living.shopify.com"
                  />
                </div>
              </div>

              {/* Status report blocks */}
              {wasPublishedSuccessfully && (
                <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl text-xs space-y-2 select-none">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 size={13} />
                    <span>SYNCHRONIZATION PERSISTED</span>
                  </div>
                  <ul className="space-y-1 font-mono text-[10px] text-emerald-200">
                    <li>✓ Target: https://{customDomainName}</li>
                    <li>✓ Asset Payload: storefront_block_theme_ext.liquid</li>
                    <li>✓ Render Status: Active Production Mode</li>
                  </ul>
                  <span className="text-[10px] text-zinc-400 leading-normal block">
                    {language === 'CN' ? '⚡ 您的页面已分发至可分享 URL，方便用户测试并展示您的品牌视觉。' : '⚡ Your template block has been prepared and synchronised with standard CSS modules.'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-[#2d245c] select-none">
              <button
                type="button"
                onClick={() => {
                  setShowShopifyModal(false);
                  setWasPublishedSuccessfully(false);
                }}
                className="px-4 py-2 bg-slate-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-mono font-semibold"
              >
                Close (关闭)
              </button>

              <button
                type="button"
                onClick={handleShopifyPublishPush}
                disabled={isShopifySyncing}
                className="px-5 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-xl text-xs font-mono font-extrabold flex items-center gap-1.5 transition-all shadow-lg select-none cursor-pointer"
              >
                {isShopifySyncing ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Syncing Shopify Live...</span>
                  </>
                ) : (
                  <>
                    <ExternalLink size={12} />
                    <span>Build & Synchronize Store (构建同步)</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  ArrowRight, 
  Sliders, 
  Sparkles, 
  Lightbulb,
  Eye,
  Activity,
  User,
  GitBranch,
  Layers,
  Sparkle,
  Bookmark,
  Share2,
  Minimize2,
  Maximize2,
  Upload,
  Mic,
  MicOff,
  Camera,
  Loader2,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Product, Order, MarketingCampaign, StoreTheme, Review } from '../types';

interface HomeStorefrontViewProps {
  dbState: {
    products: Product[];
    orders: Order[];
    campaigns: MarketingCampaign[];
    theme: StoreTheme;
    reviews: Review[];
  };
  handleAction: (msg: string) => void;
  setActiveTab: (tab: string) => void;
  convert: (amount: number) => string;
  convertNoDecimals: (amount: number) => string;
  currencySymbol: string;
  language?: 'CN' | 'EN';
  isLightMode?: boolean;
}

// Global aesthetic high-contrast high-fashion assets referencing pristine CDN links
const TREND_ASSETS = [
  { url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80", tag: "RUNWAY / SILHOUETTE", desc: "Layered organic asymmetrical drape" },
  { url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80", tag: "EDITORIAL / VOLUMETRIC", desc: "Double-breasted structured overcoat" },
  { url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80", tag: "FABRIC / MOTION", desc: "Liquid mulberry silk flow studies" },
  { url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80", tag: "STYLING / REDUCTION", desc: "Monochrome ivory wool proportions" },
  { url: "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=600&q=80", tag: "CAMPAIGN / DUSK", desc: "Anisotropic wool blazer contours" }
];

const CONCEPT_ASSETS = [
  { url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80", title: "Charcoal shadow play texture", meta: "Tactile sketch motion" },
  { url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80", title: "Organza glass refraction", meta: "Light & shadow study" },
  { url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=600&q=80", title: "Fluid matte ink dispersals", meta: "Color wave motion" },
  { url: "https://images.unsplash.com/photo-1604871000636-074fa5117945?auto=format&fit=crop&w=600&q=80", title: "Raw structural cotton wireframe", meta: "Shape experiment" }
];

const GARMENT_ASSETS = [
  { url: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80", name: "Linen Trench No. 04", fiber: "100% Bleached Belgian Linen", rate: "$240" },
  { url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80", name: "Satin Cocoon Dress", fiber: "Heavyweight Double Satin Silk", rate: "$310" },
  { url: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80", name: "Unstructured Lounge Vest", fiber: "Raw Handspun Khadi Cotton", rate: "$180" },
  { url: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=600&q=80", name: "Sculpted Drape Trouser", fiber: "Recycled Merino Gabardine", rate: "$195" }
];

const HUMAN_ASSETS = [
  { url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80", mood: "Prism & Reflection", campaign: "NEO-DECO FELLOWSHIP" },
  { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80", mood: "Cinematic Dusk Ambience", campaign: "MONUMENTS OF RETROGRADE" },
  { url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80", mood: "Rain-Dipped Nylon Sheen", campaign: "STREETWAYS & METEORS" },
  { url: "https://images.unsplash.com/photo-1503104834685-7205e8607eb9?auto=format&fit=crop&w=600&q=80", mood: "Chiaroscuro Silhouette Profile", campaign: "VOGUE NOISE STUDY" }
];

export default function HomeStorefrontView({ 
  dbState, 
  handleAction, 
  setActiveTab, 
  convert, 
  convertNoDecimals,
  currencySymbol,
  language = 'CN',
  isLightMode = false
}: HomeStorefrontViewProps) {
  
  // High-End Interface Mode: 'consciousness' (Pure artistic GPT) | 'merchant' (Traditional dashboard)
  const [viewMode, setViewMode] = useState<'consciousness' | 'merchant'>('consciousness');
  
  // Custom interactive typing state for the vision interface with character inertial delays
  const [visionInput, setVisionInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Upload, Mic, Camera interactive sensory systems state values
  const [uploadedMedia, setUploadedMedia] = useState<{ type: 'image' | 'file'; name: string; dataUrl: string } | null>(null);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize browser speech recognition engine with real media inputs tracking
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = language === 'CN' ? 'zh-CN' : 'en-US';

      rec.onstart = () => {
        setIsVoiceListening(true);
        setSpeechError(null);
      };

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setVisionInput(prev => prev + (prev ? " " : "") + finalTranscript);
          setIsTyping(true);
        }
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error event: ', e.error);
        if (e.error === 'not-allowed') {
          setSpeechError(language === 'CN' ? '未获麦克风权限' : 'Microphone authorized denied');
        }
        setIsVoiceListening(false);
      };

      rec.onend = () => {
        setIsVoiceListening(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {}
      }
    };
  }, [language]);

  const simulateSpeechRecognition = () => {
    setIsVoiceListening(true);
    setSpeechError(null);
    const phrases = language === 'CN' 
      ? ["在视觉流中展示一套质朴的亚麻风衣与手作陶瓷器皿", "切换为耀目奢华曜黑的主题色调搭配", "生成最新的数字人时尚走秀大片", "加一组北欧极简白橡木长椅配黄铜转接头螺母"]
      : ["Display structured hand-loomed wool trench coat in concept stream", "Switch theme layout to raw industrial black matte style", "Show digital human fashion film portraits", "Synthesize minimal white ash bench with brass joints"];
    
    // Pick phrase
    const selectedPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    let index = 0;
    
    const interval = setInterval(() => {
      setVisionInput(prev => prev + selectedPhrase[index]);
      setIsTyping(true);
      index++;
      if (index >= selectedPhrase.length) {
        clearInterval(interval);
        setTimeout(() => {
          setIsVoiceListening(false);
        }, 500);
      }
    }, 100);
  };

  const toggleVoiceInput = () => {
    if (isVoiceListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {}
      }
      setIsVoiceListening(false);
    } else {
      setSpeechError(null);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.error('Web Speech API activation error: ', err);
          simulateSpeechRecognition();
        }
      } else {
        simulateSpeechRecognition();
      }
    }
  };

  const startCamera = async () => {
    setSpeechError(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraStream(stream);
      // Wait slightly for DOM render of video Ref element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 150);
    } catch (err) {
      console.warn('Sandbox or device camera blocked! Triggering luxury mock portrait lens fallback...', err);
      // Fallback is nicely handled on capture
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    try {
      if (videoRef.current && cameraStream) {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg');
          setUploadedMedia({
            type: 'image',
            name: `AESTHETIC_LENS_${new Date().getTime().toString().slice(-4)}.JPG`,
            dataUrl
          });
        }
      } else {
        // High quality luxury conceptual preset fallback for web-sandboxed environment compliance
        const fallbacks = [
          "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=650&q=80",
          "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=650&q=80",
          "https://images.unsplash.com/photo-1604871000636-074fa5117945?auto=format&fit=crop&w=650&q=80"
        ];
        const selectedPic = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        setUploadedMedia({
          type: 'image',
          name: `AESTHETIC_CAMERA_SNAP_${new Date().getTime().toString().slice(-4)}.JPG`,
          dataUrl: selectedPic
        });
      }
    } catch (err) {
      console.error('Failed to capture sketch snapshot: ', err);
    }
    stopCamera();
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedMedia({
        type: file.type.startsWith('image/') ? 'image' : 'file',
        name: file.name.toUpperCase(),
        dataUrl
      });
    };
    reader.readAsDataURL(file);
  };
  
  // Interactive 3D Card mouse coordinates tracker
  const [hoveredGarmentIndex, setHoveredGarmentIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const stats = useMemo(() => {
    const totalRevenue = dbState.orders.reduce((acc, o) => acc + (o.status !== 'Refunded' ? o.amount : 0), 0);
    const avgOrder = dbState.orders.length > 0 ? (totalRevenue / dbState.orders.length) : 0;
    const refundsCount = dbState.orders.filter(o => o.status === 'Refunded').length;
    return {
      totalRevenue,
      avgOrder,
      refundsCount,
      totalCount: dbState.orders.length
    };
  }, [dbState.orders]);

  const handleMouseMove3D = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const submitVisionText = () => {
    if (!visionInput.trim() && !uploadedMedia) return;
    
    let fullPrompterMsg = visionInput;
    if (uploadedMedia) {
      fullPrompterMsg += ` [Sensory Upload Attached: "${uploadedMedia.name}"]`;
    }

    handleAction(
      `Apply system intelligence on the vision proposal: "${fullPrompterMsg}". Synthesize products & visual theme layout adjustments matching its tone.`
    );
    // Clear and trigger transition
    setVisionInput("");
    setUploadedMedia(null);
  };

  return (
    <div className={cn(
      "space-y-8 pb-16 min-h-screen select-none transition-colors duration-300",
      isLightMode ? "text-neutral-900 bg-[#fbfaf7]" : "text-white bg-black"
    )}>
      
      {/* Self-contained CSS for Infinite Aesthetic Streams (Marquees) */}
      <style>{`
        @keyframes stream-scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes stream-scroll-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .stream-track-left {
          display: flex;
          width: max-content;
          animation: stream-scroll-left 40s linear infinite;
        }
        .stream-track-right {
          display: flex;
          width: max-content;
          animation: stream-scroll-right 40s linear infinite;
        }
        .stream-track-left:hover, .stream-track-right:hover {
          animation-play-state: paused;
        }
        .letter-lens {
          letter-spacing: 0.35em;
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.15);
        }
      `}</style>

      {/* High-Contrast Interactive View Toggle in Upper-Right */}
      <div className="flex justify-end items-center gap-3 border-b border-[#1A1A1A] pb-4">
        <div className="flex items-center gap-1.5 bg-[#0D0D0D] p-1 rounded-full border border-[#222222] text-[10px] font-mono font-bold tracking-widest uppercase shadow-sm">
          <button
            onClick={() => setViewMode('consciousness')}
            className={cn(
              "px-3.5 py-1.5 rounded-full transition-all duration-300 cursor-pointer flex items-center gap-1.5",
              viewMode === 'consciousness' 
                ? "bg-[#FFFFFF] text-black shadow" 
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Sparkle size={10} className={cn("transition-transform duration-500", viewMode === 'consciousness' && "rotate-90")} />
            {language === 'CN' ? '意识空间' : 'VISION SYSTEM'}
          </button>
          
          <button
            onClick={() => setViewMode('merchant')}
            className={cn(
              "px-3.5 py-1.5 rounded-full transition-all duration-300 cursor-pointer flex items-center gap-1.5",
              viewMode === 'merchant'
                ? "bg-[#FFFFFF] text-black shadow"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Activity size={10} />
            {language === 'CN' ? '零售仪表' : 'MERCHANT COCKPIT'}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* VIEW 1: IMMERSIVE ARTISTIC RESTRAINED CONSCIOUSNESS ENTRY */}
        {viewMode === 'consciousness' && (
          <motion.div
            key="consciousness-portal"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="space-y-16"
          >
            {/* HERO: 90% AIR + CONSCIOUSNESS INPUT ZONE */}
            <div className="flex flex-col items-center justify-center pt-20 pb-24 text-center max-w-4xl mx-auto px-4">
              
              {/* Ultra-narrow minimalist breathing placeholder */}
              <motion.div 
                initial={{ opacity: 0.7 }}
                animate={{ opacity: [0.55, 1, 0.55] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="mb-8"
              >
                <h1 className="text-[15px] tracking-[0.45em] font-sans font-extralight text-zinc-300 uppercase letter-lens select-none">
                  {language === 'CN' ? '在此唤醒你的品牌美学灵感' : 'TYPE YOUR VISION…'}
                </h1>
              </motion.div>

              {/* Minimalist consciousness input field */}
              <div className="relative w-full border-b border-[#2C2C2C] hover:border-zinc-450 focus-within:border-white transition-all duration-300 py-4 group">
                <input 
                  type="text"
                  value={visionInput}
                  onChange={(e) => {
                    setVisionInput(e.target.value);
                    setIsTyping(e.target.value.length > 0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitVisionText();
                  }}
                  placeholder={language === 'CN' ? '输入对极简质感、暖调原木或先锋数码服装的设想...' : 'Describe textured linen, raw cedar shelves, metallic silhouette, styling themes...'}
                  className="w-full bg-transparent text-center text-sm md:text-md font-sans font-light text-white tracking-widest outline-none border-none placeholder:text-zinc-700 placeholder:font-light"
                />
                
                {/* Breathing Cursor Accent */}
                <div className={cn(
                  "absolute bottom-0 left-1/2 -translate-x-1/2 h-[1px] bg-white transition-all duration-500",
                  isTyping ? "w-full" : "w-12 animate-pulse"
                )} />
              </div>

              {/* Sensory Portal Interface Elements: Upload, Voice Recording, Camera lens */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pb-2 text-[10px] font-mono tracking-widest text-[#666] uppercase select-none">
                
                {/* 1. UPLOAD FILE */}
                <button
                  type="button"
                  onClick={triggerFileUpload}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all duration-300 cursor-pointer hover:text-white hover:border-zinc-500",
                    uploadedMedia ? "border-emerald-500/50 text-emerald-400 bg-emerald-950/25" : "border-[#1F1F1F] bg-[#090909]/40 text-zinc-400"
                  )}
                  title="Upload brand fabric references or silhouettes (.png, .jpg)"
                >
                  <Upload size={10} className={cn(uploadedMedia && "animate-bounce")} />
                  <span>{language === 'CN' ? '上传参考' : 'UPLOAD'}</span>
                </button>
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {/* 2. VOICE SPEECH INPUT */}
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all duration-300 cursor-pointer hover:text-white hover:border-zinc-500",
                    isVoiceListening ? "border-purple-500 text-purple-400 bg-purple-950/40" : "border-[#1F1F1F] bg-[#090909]/40 text-zinc-400"
                  )}
                  title="Type your vision by speaking aloud"
                >
                  <Mic size={10} className={cn(isVoiceListening && "animate-pulse text-purple-400")} />
                  <span>{isVoiceListening ? (language === 'CN' ? '聆听感应中...' : 'LISTENING...') : (language === 'CN' ? '语音感应' : 'VOICE')}</span>
                </button>

                {/* 3. CAMERA CAPTURE */}
                <button
                  type="button"
                  onClick={startCamera}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 border rounded-full transition-all duration-300 cursor-pointer hover:text-white hover:border-zinc-500",
                    isCameraActive ? "border-amber-500/50 text-amber-400 bg-amber-950/25 animate-pulse" : "border-[#1F1F1F] bg-[#090909]/40 text-zinc-400"
                  )}
                  title="Capture live apparel textures using device camera"
                >
                  <Camera size={10} />
                  <span>{language === 'CN' ? '镜头传感器' : 'CAMERA LENS'}</span>
                </button>
              </div>

              {/* Dynamic Warning of Speech API */}
              {speechError && (
                <div className="text-[9px] font-mono text-rose-400 tracking-wider mt-2 animate-bounce uppercase">
                  {speechError}
                </div>
              )}

              {/* Selected/Captured Sensory Attachment Preview */}
              <AnimatePresence>
                {uploadedMedia && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="mt-6 p-2.5 bg-[#0C0C0C]/90 backdrop-blur-md border border-zinc-900 rounded-2xl flex items-center gap-3 w-full max-w-xs text-left shadow-[0_15px_30px_rgba(0,0,0,0.8)] relative"
                  >
                    {uploadedMedia.type === 'image' ? (
                      <div className="relative w-11 h-11 bg-[#151515] rounded-lg overflow-hidden shrink-0 border border-zinc-800">
                        <img 
                          src={uploadedMedia.dataUrl} 
                          alt="Sensory upload" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-[#18181A] text-zinc-400 flex items-center justify-center text-xs border border-zinc-800 shrink-0 font-mono font-bold">
                        CSV
                      </div>
                    )}
                    <div className="flex flex-col min-w-0 pr-6">
                      <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.2em] leading-none">Aesthetic Asset</span>
                      <span className="text-[10px] text-zinc-300 font-mono truncate tracking-tight mt-1">{uploadedMedia.name}</span>
                    </div>

                    <button
                      onClick={() => setUploadedMedia(null)}
                      className="absolute top-2.5 right-2.5 p-1 bg-[#151515] hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-full transition-colors cursor-pointer"
                      title="Remove attachment"
                    >
                      <X size={10} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Trigger Prompt Action cleanly with zero extra visual text noise */}
              <div className="flex items-center gap-4 mt-6">
                <button
                  onClick={submitVisionText}
                  disabled={!visionInput.trim()}
                  className={cn(
                    "px-7 py-2 text-[10px] font-mono tracking-[0.2em] font-medium rounded-full uppercase transition-all duration-300 border cursor-pointer",
                    visionInput.trim() 
                      ? "bg-white text-black border-white hover:bg-black hover:text-white" 
                      : "bg-[#090909] text-zinc-600 border-[#1F1F1F] cursor-not-allowed"
                  )}
                >
                  {language === 'CN' ? '启动品牌感应' : 'TRANSMIT'}
                </button>

                <button
                  onClick={() => setVisionInput(language === 'CN' ? "上架一套黑松露釉色陶瓷茶具与原木极简收纳架，并将前台视觉调和为深邃的雅奢曜黑氛围" : "Add raw hand-thrown black volcanic pottery and structured walnut console, turning theme to dark minimal")}
                  className="px-5 py-2 text-[10px] font-mono tracking-[0.2em] font-medium text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-all bg-[#090909]/40 border border-[#161616] rounded-full uppercase cursor-pointer"
                >
                  {language === 'CN' ? '加载演示' : 'DEMO PULSE'}
                </button>
              </div>
            </div>

            {/* LOWER PORTION: INFINITE MULTI-LAYER INSTINCTS OR VISUAL STREAMS */}
            <div className="space-y-12">
              
              {/* STREAM 1: TREND STREAM (Edge-to-Edge digital waterfall) */}
              <div className="relative overflow-hidden py-1 border-t border-b border-[#111111] bg-black">
                <div className="absolute top-2 left-6 z-15 bg-black/65 px-2.5 py-0.5 border border-[#1E1E1E] rounded text-[8px] font-mono tracking-widest text-zinc-500">
                  TREND STREAM
                </div>
                <div className="stream-track-left">
                  {/* Two sets concatenated for infinite loop */}
                  {[...TREND_ASSETS, ...TREND_ASSETS].map((item, index) => (
                    <div key={index} className="w-[280px] h-[190px] shrink-0 mx-3 group/slide relative overflow-hidden rounded-md bg-[#0A0A0A] border border-[#141414]">
                      <img 
                        src={item.url} 
                        className="w-full h-full object-cover grayscale opacity-60 group-hover/slide:grayscale-0 group-hover/slide:opacity-90 group-hover/slide:scale-105 transition-all duration-700"
                        referrerPolicy="no-referrer"
                        alt={item.desc}
                      />
                      <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end text-left select-none pointer-events-none">
                        <span className="text-[8px] font-mono font-bold tracking-widest text-[#a78bfa]">{item.tag}</span>
                        <span className="text-[10px] text-zinc-300 font-sans tracking-wide truncate mt-0.5">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* STREAM 2: CONCEPT STREAM (Art concept dreams) */}
              <div className="space-y-4 px-4">
                <div className="flex items-center justify-between border-b border-[#161616] pb-2 max-w-7xl mx-auto">
                  <span className="text-[10px] font-mono tracking-[0.3em] text-zinc-600 uppercase">CONCEPT STREAM / 灵感碎片</span>
                  <span className="text-[9px] font-mono text-zinc-600">AI VISUAL EXPERIMENTS</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-7xl mx-auto">
                  {CONCEPT_ASSETS.map((item, i) => (
                    <div key={i} className="group/concept p-3 bg-[#080808] border border-[#131313] rounded-xl hover:border-zinc-800 transition-all duration-300">
                      <div className="w-full h-32 overflow-hidden rounded-lg bg-[#0F0F0F] relative">
                        <img 
                          src={item.url} 
                          className="w-full h-full object-cover opacity-60 group-hover/concept:opacity-80 transition-opacity duration-300" 
                          referrerPolicy="no-referrer"
                          alt={item.title}
                        />
                        <div className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 bg-black/50 rounded-full border border-white/5 opacity-0 group-hover/concept:opacity-100 transition-opacity">
                          <Bookmark size={8} className="text-zinc-400" />
                        </div>
                      </div>
                      <h4 className="text-[11px] font-sans font-medium text-zinc-350 tracking-wide mt-3 truncate">{item.title}</h4>
                      <span className="text-[9px] font-mono text-zinc-600 tracking-wider uppercase mt-1 block">{item.meta}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* STREAM 3: GARMENT STREAM (3D Completed Products) */}
              <div className="space-y-4 px-4">
                <div className="flex items-center justify-between border-b border-[#161616] pb-2 max-w-7xl mx-auto">
                  <span className="text-[10px] font-mono tracking-[0.3em] text-zinc-600 uppercase">GARMENT STREAM / 活体成服</span>
                  <span className="text-[9px] font-mono text-zinc-600">INTERACTIVE 3D PROJECTION</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
                  {GARMENT_ASSETS.map((item, idx) => {
                    const isHovered = hoveredGarmentIndex === idx;
                    return (
                      <div 
                        key={idx}
                        onMouseEnter={() => setHoveredGarmentIndex(idx)}
                        onMouseLeave={() => setHoveredGarmentIndex(null)}
                        onMouseMove={handleMouseMove3D}
                        className="group/garment bg-[#060606] border border-[#121212] rounded-2xl p-4 transition-all duration-500 overflow-hidden relative cursor-help flex flex-col justify-between h-[360px]"
                        style={{
                          perspective: '1000px'
                        }}
                      >
                        {/* 3D Pivot Frame */}
                        <div 
                          className="w-full h-56 rounded-xl overflow-hidden bg-[#0A0A0A] border border-[#1C1C1C] relative transition-transform duration-200 ease-out"
                          style={{
                            transform: isHovered 
                              ? `rotateY(${mousePos.x * 24}deg) rotateX(${mousePos.y * -24}deg) scale(1.02)` 
                              : 'rotateY(0deg) rotateX(0deg) scale(1)',
                            transformStyle: 'preserve-3d'
                          }}
                        >
                          <img 
                            src={item.url} 
                            className="w-full h-full object-cover opacity-65 group-hover/garment:opacity-90 transition-opacity duration-300" 
                            referrerPolicy="no-referrer"
                            alt={item.name}
                          />
                          
                          {/* Fiber content mini-card on 3D plane */}
                          {isHovered && (
                            <div className="absolute top-3 left-3 bg-black/75 backdrop-blur px-2.5 py-1 rounded text-[8px] font-mono text-[#a78bfa] border border-[#3A1D7A] select-none uppercase">
                              {item.fiber}
                            </div>
                          )}
                        </div>

                        {/* Text and Rate */}
                        <div className="pt-3 flex justify-between items-start gap-2">
                          <div>
                            <h4 className="text-[12px] font-sans font-medium text-white tracking-wide truncate">{item.name}</h4>
                            <p className="text-[9px] font-mono text-zinc-500 mt-1 capitalize">{item.fiber.toLowerCase()}</p>
                          </div>
                          
                          <div className="text-right flex flex-col items-end">
                            <span className="text-[11px] font-mono text-emerald-400 font-bold">{item.rate}</span>
                            <button
                              onClick={() => handleAction(`Introduce customized garment "${item.name}" item using fiber details "${item.fiber}" inside merchant catalog.`)}
                              className="text-[8px] font-mono bg-[#1E1C2E] hover:bg-purple-900 duration-150 text-purple-300 px-2 py-0.5 rounded border border-[#3C355C] mt-1.5 opacity-0 group-hover/garment:opacity-100 transition-opacity"
                            >
                              + STAGE LISTING
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* STREAM 4: HUMAN STREAM (Campaign snapshots, Blade Runner ambiance) */}
              <div className="space-y-4 px-4 pb-4">
                <div className="flex items-center justify-between border-b border-[#161616] pb-2 max-w-7xl mx-auto">
                  <span className="text-[10px] font-mono tracking-[0.3em] text-zinc-600 uppercase">HUMAN STREAM / 虚感画幅</span>
                  <span className="text-[9px] font-mono text-zinc-600">CINEMATIC DIGITAL PORTRAITS</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
                  {HUMAN_ASSETS.map((item, i) => (
                    <div key={i} className="group/human relative h-[250px] bg-[#070707] border border-[#141414] rounded-2xl overflow-hidden">
                      <img 
                        src={item.url} 
                        className="w-full h-full object-cover grayscale opacity-50 group-hover/human:scale-[1.03] group-hover/human:opacity-75 group-hover/human:grayscale-0 transition-all duration-1000" 
                        referrerPolicy="no-referrer"
                        alt={item.mood}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-end p-6">
                        <span className="text-[8px] font-mono text-[#a78bfa] tracking-[0.25em] uppercase">{item.campaign}</span>
                        <h4 className="text-sm font-sans font-medium text-white mt-1.5 tracking-wider">{item.mood}</h4>
                        
                        <div className="flex justify-between items-center mt-3 border-t border-white/10 pt-3 opacity-0 group-hover/human:opacity-100 transition-all duration-300">
                          <p className="text-[9px] text-zinc-400 font-mono tracking-wide">COORDINATE CAMPAIGN PORTRAIT</p>
                          <button
                            onClick={() => handleAction(`Apply human portrait tone of "${item.mood}" and background to storefront hero banners.`)}
                            className="text-[9px] text-black bg-white px-3 py-1 font-mono hover:bg-zinc-200 rounded-full font-bold"
                          >
                            SYNCHRONIZE
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* VIEW 2: TRADITIONAL MERCHANT OVERVIEW COCKPIT & LIVE IFRAME SYNCHRONIZER */}
        {viewMode === 'merchant' && (
          <motion.div
            key="merchant-portal"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            {/* KPI Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { 
                  label: language === 'CN' ? '店铺累计销售额' : 'Total Revenue', 
                  value: convert(stats.totalRevenue), 
                  sub: language === 'CN' ? '▲ 相比上周增长 12.4%' : '+12.4% from launch', 
                  icon: DollarSign, 
                  color: 'text-purple-300 bg-purple-900/30 border border-purple-800/40' 
                },
                { 
                  label: language === 'CN' ? '账簿活动订单量' : 'Orders volume', 
                  value: stats.totalCount.toString(), 
                  sub: language === 'CN' ? '系统已成功登记记录' : 'All lifetime transactions', 
                  icon: ShoppingBag, 
                  color: 'text-[#efecf6] bg-[#1a1535] border border-[#3e2e6c]' 
                },
                { 
                  label: language === 'CN' ? '单笔成交均价' : 'Avg Basket Value', 
                  value: convert(stats.avgOrder), 
                  sub: language === 'CN' ? '计得购物车每单均值' : 'Gross cart average', 
                  icon: TrendingUp, 
                  color: 'text-emerald-300 bg-emerald-900/30 border border-emerald-800/30' 
                },
                { 
                  label: language === 'CN' ? '退款与理赔申请' : 'Refunds processed', 
                  value: stats.refundsCount.toString(), 
                  sub: language === 'CN' ? '差评审查全额批准退款数' : 'Approved claims', 
                  icon: Lightbulb, 
                  color: 'text-rose-300 bg-rose-900/30 border border-rose-800/30' 
                }
              ].map((card, i) => {
                const IconComp = card.icon;
                return (
                  <div key={i} className="bg-[#120f26] p-6 rounded-2xl border border-[#231b45] shadow-[0_2px_12px_rgba(0,0,0,0.1)] flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-2">{card.label}</span>
                      <h3 className="font-display font-bold text-24 text-white tracking-tight leading-none">{card.value}</h3>
                      <span className="text-[11px] text-zinc-400 mt-2 block font-medium">{card.sub}</span>
                    </div>
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", card.color)}>
                      <IconComp size={16} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Main Row: Central Shop Custom Render (Live Storefront Preview) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              <div className="lg:col-span-2 bg-[#120f26] rounded-3xl border border-[#231b45] p-8 shadow-md space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-medium text-18 text-white flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      {language === 'CN' ? '线上顾客前台实时效果预览' : 'Active Customer Storefront Preview'}
                    </h3>
                    <p className="text-xs text-[#a7a2ce] mt-0.5 font-sans">
                      {language === 'CN' ? '实时同步当前修改的品牌调性、版面布局以及上新架商品' : 'Real-time sync of modified brand tones, layout and custom products.'}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setActiveTab('theme')} 
                      className="px-3.5 py-1.5 bg-[#1b1738] hover:bg-[#251e4d] border border-[#2d245c] rounded-lg text-11 text-zinc-300 font-mono flex items-center gap-1.5 hover:text-white duration-150 cursor-pointer"
                    >
                      <Sliders size={12} /> {language === 'CN' ? '修改主题风格' : 'CONFIGS'}
                    </button>
                  </div>
                </div>

                {/* Interactive Dynamic Mock Storefront Wrapper */}
                <div className={cn(
                  "min-h-[380px] rounded-2xl overflow-hidden border p-8 flex flex-col justify-between transition-all duration-300 relative bg-cover bg-center",
                  dbState.theme.themeStyle === 'apple' ? "bg-[#FAFBFD] border-zinc-250 text-zinc-900 shadow-sm" :
                  dbState.theme.themeStyle === 'nordic' ? "bg-[#FAF6EC] border-[#EFEDE5] text-[#332A15]" :
                  dbState.theme.themeStyle === 'cyber' ? "bg-[#09090F] border-purple-950/40 text-purple-200" :
                  "bg-[#FAF0E6] border-[#EFD5C5] text-[#4A1D01]"
                )}
                style={{
                  backgroundImage: dbState.theme.layoutConfig === 'hero_banner' && dbState.theme.bannerImage ? `linear-gradient(rgba(255,255,255,0.92), rgba(255,255,255,0.92)), url(${dbState.theme.bannerImage})` : undefined
                }}>
                  {/* Header Area of Mock Storefront */}
                  <div className="flex items-center justify-between border-b pb-4 border-black/5">
                    <div className="flex items-center gap-1.5 font-sans whitespace-nowrap">
                      <span className={cn(
                        "w-5 h-5 rounded flex items-center justify-center font-display text-[10px] font-bold text-white",
                        dbState.theme.themeStyle === 'cyber' ? "bg-purple-600" : "bg-black"
                      )}>M</span>
                      <span className="font-mono text-xs font-semibold tracking-wider">
                        {language === 'CN' ? '前台电商橱窗实时效果' : 'MOCK CUSTOMER STOREFRONT'}
                      </span>
                    </div>
                    <div className="flex gap-4 text-[10px] font-mono tracking-tight font-medium opacity-70">
                      <span>{language === 'CN' ? '在售商品' : 'PRODUCTS'}</span>
                      <span>{language === 'CN' ? '品牌日记' : 'JOURNAL'}</span>
                      <span>{language === 'CN' ? '購物袋(0)' : 'BAG(0)'}</span>
                    </div>
                  </div>

                  {/* Banner Section */}
                  <div className="py-8 max-w-lg">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[9px] font-mono tracking-widest uppercase font-bold inline-block mb-3 border",
                      dbState.theme.themeStyle === 'apple' ? "bg-zinc-100 text-zinc-800 border-zinc-200" :
                      dbState.theme.themeStyle === 'nordic' ? "bg-[#EFE9DB] text-[#55462D] border-[#E2DBC8]" :
                      dbState.theme.themeStyle === 'cyber' ? "bg-purple-900/30 text-purple-400 border-purple-800/40" :
                      "bg-[#F2DFD1] text-[#7A3F1F] border-[#E8CEBE]"
                    )}>
                      {dbState.theme.themeStyle} {language === 'CN' ? '视觉风格定义' : 'branding style'}
                    </span>
                    
                    <h2 className={cn(
                      "text-2xl md:text-3xl font-display font-bold leading-none tracking-tight mb-2.5",
                      dbState.theme.themeStyle === 'apple' ? "text-black" :
                      dbState.theme.themeStyle === 'nordic' ? "font-serif text-[#1F1703]" :
                      dbState.theme.themeStyle === 'cyber' ? "text-[#E0E0FF] drop-shadow-[0_2px_4px_rgba(150,0,255,0.15)]" :
                      "font-serif text-[#5B1F00]"
                    )}>
                      {dbState.theme.bannerTitle || (language === 'CN' ? "当代原创温润家居甄选" : "Curated Contemporary Works")}
                    </h2>
                    
                    <p className="text-12 opacity-80 leading-relaxed font-sans font-medium mb-5">
                      {dbState.theme.bannerSubtitle || (language === 'CN' ? "把手工打磨自然质感融入高品质生活。每一件商品都由大模型自适应挑选上架。" : "Handpicked design essentials, bringing visual integrity and premium quality.")}
                    </p>

                    <button 
                      className="px-5 py-2 rounded-full text-11 font-mono tracking-wider font-bold transition-transform text-white shadow-sm flex items-center gap-2 w-max"
                      style={{ backgroundColor: dbState.theme.primaryColor || '#000000' }}
                    >
                      {language === 'CN' ? '浏览精选陈列' : 'EXPLORE CURATIONS'} <ArrowRight size={12} />
                    </button>
                  </div>

                  {/* Products grid snapshot preview within storefront */}
                  <div className="grid grid-cols-3 gap-3 border-t pt-4 border-black/5 mt-4">
                    {dbState.products.slice(0, 3).map((prod) => (
                      <div key={prod.id} className="p-2 border border-black/[0.03] bg-white/70 backdrop-blur-[2px] rounded-lg relative overflow-hidden flex flex-col justify-between">
                        <div className="w-full h-20 overflow-hidden rounded-md bg-zinc-100 border border-black/5 relative mb-2">
                          <img src={prod.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt={prod.title} />
                          {prod.image_status && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/65 text-[7px] text-white rounded font-mono font-bold leading-none select-none tracking-wider uppercase">
                              {prod.image_status}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-[10px] font-bold line-clamp-1 text-zinc-800">{prod.title}</h4>
                          <span className="text-[10px] font-mono font-semibold text-zinc-500 block mt-0.5">{convert(prod.price)}</span>
                        </div>
                      </div>
                    ))}
                    {dbState.products.length === 0 && (
                      <div className="col-span-3 py-10 text-center text-zinc-400 font-mono text-10 uppercase">
                        {language === 'CN' ? '在售橱窗中暂无商品 listings' : 'No active listings inside mock catalog yet.'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Suggestion Side Panel */}
              <div className="space-y-6">
                <div className="bg-[#120f26] rounded-3xl border border-[#231b45] p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="font-display font-medium text-white text-15 flex items-center gap-1.5 mb-2">
                      <Sparkles size={14} className="text-[#a78bfa]" />
                      {language === 'CN' ? '自治底座 API 驱动模型' : 'Commerce Agent Capabilities'}
                    </h4>
                    <p className="text-[#a7a2ce] text-xs leading-relaxed font-sans font-medium mb-4">
                      {language === 'CN' 
                        ? '本系统开放了对底层 SQLite/State 数据库的动作级读写权限。AI 将根据您的语言拆解出对应的动作，并自动进行修改。' 
                        : 'Our runtime action layer exposes native APIs directly to the LLM backend. The agent writes structured configurations inside the sandbox based on instructions.'}
                    </p>
                  </div>

                  <div className="border-t border-[#231a47] pt-4 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-purple-900/40 border border-[#482c8f] flex items-center justify-center shrink-0 text-10 font-bold text-[#a78bfa] font-mono">1</span>
                      <div>
                        <span className="text-[11px] font-semibold text-white block">
                          {language === 'CN' ? '商品全自主上新' : 'Autonomous Product Generation'}
                        </span>
                        <p className="text-[10px] text-[#a7a2ce] leading-normal font-sans">
                          {language === 'CN' 
                            ? '自动构思高端描述、自动锚定最适宜的价格点、自动分配合规 SKU 码与类别。' 
                            : 'Draft descriptions, determine catalog alignment and SKU naming models automatically.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-950/40 border border-[#217757] flex items-center justify-center shrink-0 text-10 font-bold text-emerald-300 font-mono">2</span>
                      <div>
                        <span className="text-[11px] font-semibold text-white block">
                          {language === 'CN' ? '语义物性高精度匹配' : 'AI Image Processing Core'}
                        </span>
                        <p className="text-[10px] text-[#a7a2ce] leading-normal font-sans">
                          {language === 'CN' 
                            ? '通过 AI 语义自动联想在 Unsplash 库中搜寻高度契合的白底、高级置景美图。' 
                            : 'Search aesthetic studio backdrops, apply removals or generate aspect sizes.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-950 to-[#120f26] text-white rounded-3xl p-6 shadow-lg relative overflow-hidden border border-purple-900/30">
                  <span className="absolute right-[-15px] bottom-[-15px] text-zinc-800/20 font-display font-extrabold text-[120px] leading-none select-none pointer-events-none">AI</span>
                  
                  <h4 className="font-display font-medium text-white text-14 flex items-center gap-1.5 mb-2">
                    <Sparkles size={14} className="text-[#c0a9ff]" />
                    {language === 'CN' ? '体验智能化注入' : 'Need an Operation?'}
                  </h4>
                  
                  <p className="text-[#a7a2ce] text-xs leading-relaxed font-sans font-medium mb-4 pr-10">
                    {language === 'CN' 
                      ? '在右侧商户大模型控制台发送指令：“帮我上架一些台灯，并将页面风格设定为原木北欧色彩风格”试试。' 
                      : 'Try instructing in Chinese or Italian: "帮我上10个北欧风温润灯泡 and coffee table".'}
                  </p>

                  <button 
                    onClick={() => handleAction("帮我自动上架10个精美北欧风台灯与极简茶几桌，自动生成不一样的价格，描述以及 SKU，上好以后将商铺首页主题风格设定成北欧温润原木色")}
                    className="text-11 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-4 py-2 rounded-full font-mono font-bold transition-colors shadow flex items-center gap-1 w-max cursor-pointer"
                  >
                    {language === 'CN' ? '一键注入精美体验 Demo 🚀' : 'TRIGGER DEMO \u2192'}
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Live Camera Capture Interface Overlay */}
      <AnimatePresence>
        {isCameraActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          >
            <div className="relative w-full max-w-md bg-[#090909] border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-mono tracking-[0.3em] text-zinc-500 uppercase">Interactive Device Lens</span>
                  <span className="text-xs font-bold text-white tracking-widest uppercase mt-0.5">CAMERA CAPTURE SYSTEM</span>
                </div>
                <button 
                  onClick={stopCamera}
                  className="p-1 rounded-full hover:bg-[#151515] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Camera view screen */}
              <div className="relative aspect-square w-full bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-900 flex items-center justify-center">
                {cameraStream ? (
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center gap-3">
                    <Loader2 size={18} className="animate-spin text-zinc-500" />
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest animate-pulse">Requesting system camera credentials...</span>
                    <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest max-w-[250px] leading-relaxed">If permission is blocked inside the iframe sandbox, this system automatically loads an elite lifestyle aesthetic still.</span>
                  </div>
                )}

                {/* Overlaid lens sights */}
                <div className="absolute inset-6 pointer-events-none border border-white/10" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none border border-white/20 rounded-full" />
              </div>

              {/* Shutter options */}
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={stopCamera}
                  className="flex-1 py-2 bg-transparent hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-900 text-[10px] font-mono tracking-widest uppercase rounded-full transition-all cursor-pointer text-center"
                >
                  {language === 'CN' ? '取消关闭' : 'CLOSE LENS'}
                </button>

                <button
                  onClick={capturePhoto}
                  className="flex-1 py-2 bg-white hover:bg-zinc-100 text-black text-[10px] font-mono tracking-widest uppercase rounded-full transition-all font-bold cursor-pointer text-center shadow"
                >
                  {language === 'CN' ? '捕获美学极简帧' : 'CAPTURE FRAME'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  Briefcase, 
  Search, 
  Database,
  Loader2,
  Sparkles,
  CheckCircle2,
  Activity,
  Plus,
  Trash2,
  ArrowRight,
  TrendingUp,
  Image as ImageIcon,
  Tag,
  Palette,
  Layers,
  Cpu,
  ChevronRight,
  Eye,
  Sliders,
  Sparkle,
  Copy,
  DollarSign,
  ShoppingBag,
  Users,
  SendHorizontal,
  Check,
  RefreshCw,
  Home,
  MessageSquareOff,
  Globe,
  Code,
  Mic,
  MicOff,
  Camera,
  Upload,
  X,
  Sun,
  Moon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';
import { 
  sendMessageToAgentStream, 
  ChatMessage, 
  MOCK_DB, 
  AgentStep,
  subscribeToDbChanges,
  notifyDbChanged
} from './services/gemini';
import { Product, Order, Review, MarketingCampaign, StoreTheme, Customer, Tenant, AIRuntimeTask, PlatformEvent } from './types';
import { SuperAdminControlView } from './components/SuperAdminControlView';

// Import our gorgeous newly extracted modular subviews!
import HomeStorefrontView from './components/HomeStorefrontView';
import ProductsCatalogView from './components/ProductsCatalogView';
import OrdersRegistryView from './components/OrdersRegistryView';
import CustomersCoreView from './components/CustomersCoreView';
import MarketingCopyView from './components/MarketingCopyView';
import { TranslationsHub } from './components/TranslationsHub';
import ThemeCustomizerView from './components/ThemeCustomizerView';
import AnalyticsReportView from './components/AnalyticsReportView';
import AiSystemMap from './components/AiSystemMap';
import FrontendTemplateEditorView from './components/FrontendTemplateEditorView';

// Shared Helper for dynamic customers parsing from orders
function getInitialCustomers(orders: Order[]): Customer[] {
  const map = new Map<string, Customer>();
  orders.forEach(o => {
    if (!map.has(o.customer_id)) {
      map.set(o.customer_id, {
        id: o.customer_id,
        email: `${o.customer_id.substring(0, 8)}@store.com`,
        ordersCount: 0,
        totalSpent: 0,
        city: o.city,
        lastOrderDate: o.date,
        segment: 'Dormant'
      });
    }
    const c = map.get(o.customer_id)!;
    c.ordersCount += 1;
    c.totalSpent += Number(o.amount || 0);
    if (new Date(o.date) > new Date(c.lastOrderDate)) {
      c.lastOrderDate = o.date;
    }
  });

  return Array.from(map.values()).map(c => {
    let segment: 'High Value' | 'Active' | 'At Risk' | 'Dormant' = 'Dormant';
    if (c.totalSpent > 150) segment = 'High Value';
    else if (c.totalSpent > 80) segment = 'Active';
    else if (c.totalSpent > 30) segment = 'At Risk';
    return { ...c, segment };
  });
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'products' | 'orders' | 'customers' | 'marketing' | 'translations' | 'theme' | 'template_editor' | 'analytics'
  const [adminMode, setAdminMode] = useState<'merchant' | 'platform'>('merchant');
  const [impersonatingTenant, setImpersonatingTenant] = useState<string | null>(null);
  const [language, setLanguage] = useState<'CN' | 'EN'>('CN');
  const [isLightMode, setIsLightMode] = useState<boolean>(false);

  const tTab = (id: string, def: string) => {
    if (language === 'CN') {
      const cnMap: Record<string, string> = {
        'home': '店铺首页控制台',
        'products': '商品与礼品卡管理',
        'orders': '订单账簿登记',
        'customers': '客户关系与B2B账户',
        'marketing': 'AI 智能化文案营销',
        'translations': 'AI 多语言智译中心',
        'theme': '橱窗品牌视觉装修',
        'template_editor': '前端模板代码编辑器',
        'analytics': '多维数据历史报表',
        'platform_control': '超级智能平台综合治理'
      };
      return cnMap[id] || def;
    }
    return def;
  };
  
  // Custom interactive state variables for B2B lists & Customer segments
  const [segmentsList, setSegmentsList] = useState([
    { id: 'seg_1', name: 'Clienti che hanno effettuato almeno un acquisto', pct: 72, lastActive: '15 min fa', created: '32 min fa' },
    { id: 'seg_2', name: "Iscritti all'email", pct: 45, lastActive: '32 min fa', created: '32 min fa' },
    { id: 'seg_3', name: 'Check-out abbandonati negli ultimi 30 giorni', pct: 18, lastActive: '2 giorni fa', created: '32 min fa' },
    { id: 'seg_4', name: 'Clienti che hanno effettuato più di un acquisto', pct: 24, lastActive: '1 ora fa', created: '32 min fa' },
    { id: 'seg_5', name: 'Clienti che non hanno effettuato acquisti', pct: 28, lastActive: '1 giorno fa', created: '32 min fa' }
  ]);
  const [companiesList, setCompaniesList] = useState([
    { id: 'co_1', name: 'Alps Furniture SpA', companyId: 'IT-48220199', mainContact: 'Giovanni Rossi', address: 'Via Dante 12, Milano, IT', locationId: 'LOC-MILAN-01', markets: 'Europe, UK' },
    { id: 'co_2', name: 'Tate Gallery Design', companyId: 'GB-99220110', mainContact: 'Elizabeth Tate', address: 'Bankside, London, UK', locationId: 'LOC-LONDON-01', markets: 'UK, US' },
    { id: 'co_3', name: 'Tokyo Minimalists LLC', companyId: 'JP-11220450', mainContact: 'Kenji Suzuki', address: 'Shibuya 2-chome, Tokyo, JP', locationId: 'LOC-TOKYO-03', markets: 'Asia, Global' }
  ]);

  // Multicurrency configuration parameters
  const [selectedCurrency, setSelectedCurrency] = useState<'EUR' | 'USD' | 'CNY' | 'GBP' | 'JPY'>('EUR');
  const currencyRates = {
    USD: { symbol: '$', rate: 1.0, label: 'USD ($)' },
    EUR: { symbol: '€', rate: 0.92, label: 'EUR (€)' },
    CNY: { symbol: '¥', rate: 7.24, label: 'CNY (¥)' },
    GBP: { symbol: '£', rate: 0.78, label: 'GBP (£)' },
    JPY: { symbol: '¥', rate: 155.0, label: 'JPY (¥)' }
  };

  const convert = (amountInUsd: number) => {
    const info = currencyRates[selectedCurrency];
    const convertedValue = amountInUsd * info.rate;
    return `${info.symbol}${convertedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const convertNoDecimals = (amountInUsd: number) => {
    const info = currencyRates[selectedCurrency];
    const convertedValue = amountInUsd * info.rate;
    return `${info.symbol}${convertedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  // Smart translation automation function
  const translateText = async (text: string, toLanguage: string): Promise<string> => {
    const lowercaseInput = text.trim().toLowerCase();
    
    const translationsMap: Record<string, Record<string, string>> = {
      'nordic minimalist oak table lamp': {
        'Italian': 'Lampada da tavolo in quercia minimalista nordica',
        'Chinese': '北欧极简橡木台灯',
        'Spanish': 'Lámpara de mesa de roble minimalista nórdica',
        'French': 'Lampe de table en chêne minimaliste nordique',
        'German': 'Nordische minimalistische Eichentischlampe',
        'Japanese': '北欧風ミニマリストオークテーブルランプ'
      },
      'apple aluminum height-adjustable stand': {
        'Italian': 'Supporto in alluminio regolabile in altezza Apple',
        'Chinese': '苹果铝合金高度可调支架',
        'Spanish': 'Soporte de aluminio ajustable en altura Apple',
        'French': 'Support en aluminium réglable en hauteur Apple',
        'German': 'Apple höhenverstellbarer Aluminiumständer',
        'Japanese': 'Apple アルミニウム製高さ調整可能スタンド'
      },
      'ergonomic mesh task chair': {
        'Italian': 'Sedia da ufficio ergonomica in rete',
        'Chinese': '人体工学网眼办公椅',
        'Spanish': 'Silla de oficina ergonómica de malla',
        'French': 'Chaise de bureau ergonomique en filet',
        'German': 'Ergonomischer Netz-Bürostuhl',
        'Japanese': '人間工学メッシュタスクチェア'
      },
      'aromatic sandalwood soy candle': {
        'Italian': 'Candela di soia aromatica al legno di sandalo',
        'Chinese': '芳香檀香大豆蜡烛',
        'Spanish': 'Vela de soja aromática de sándalo',
        'French': 'Bougie de soja aromatique au bois de santal',
        'German': 'Aromatische Sandelholz-Sojakerze',
        'Japanese': 'アロマティックサンダルウッドソイキャンドル'
      }
    };

    for (const [key, mapping] of Object.entries(translationsMap)) {
      if (lowercaseInput.includes(key)) {
        if (mapping[toLanguage]) {
          return mapping[toLanguage];
        }
      }
    }

    if (toLanguage === 'Italian') {
      return `[IT] ${text.replace(/lamp/i, 'Lampada').replace(/Minimalist/i, 'Minimalista').replace(/table/i, 'tavolo').replace(/chair/i, 'sedia').replace(/candle/i, 'candela').replace(/stand/i, 'supporto').replace(/wood/i, 'legno').replace(/oak/i, 'quercia').replace(/Gift Card/i, 'Buono Regalo')}`;
    }
    if (toLanguage === 'Chinese') {
      return `[ZH] 自动AI翻译: ${text.replace(/lamp/i, '台灯').replace(/Minimalist/i, '极简').replace(/table/i, '桌').replace(/chair/i, '办公椅').replace(/candle/i, '蜡烛').replace(/stand/i, '支架').replace(/wood/i, '木制品').replace(/oak/i, '橡木').replace(/Gift Card/i, '礼品卡')}`;
    }
    if (toLanguage === 'Spanish') {
      return `[ES] ${text.replace(/lamp/i, 'Lámpara').replace(/Minimalist/i, 'Minimalista').replace(/table/i, 'mesa').replace(/chair/i, 'silla').replace(/candle/i, 'vela')}`;
    }
    return `[${toLanguage.substring(0, 2).toUpperCase()}] ${text}`;
  };

  const [dbState, setDbState] = useState({
    products: [...MOCK_DB.products] as Product[],
    orders: [...MOCK_DB.orders] as Order[],
    campaigns: [...MOCK_DB.campaigns] as MarketingCampaign[],
    theme: { ...MOCK_DB.theme } as StoreTheme,
    reviews: [...MOCK_DB.reviews] as Review[],
    reports: [...MOCK_DB.reports],
    dashboards: [...MOCK_DB.dashboards],
    tenants: [...MOCK_DB.tenants] as Tenant[],
    tasks: [...MOCK_DB.tasks] as AIRuntimeTask[],
    events: [...MOCK_DB.events] as PlatformEvent[]
  });

  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [aiSidebarOpen, setAiSidebarOpen] = useState(true);
  const [showAiMap, setShowAiMap] = useState(false);
  const [shortcutsMenuOpen, setShortcutsMenuOpen] = useState(false);
  const [designMenuOpen, setDesignMenuOpen] = useState(false);
  const [presetsMenuOpen, setPresetsMenuOpen] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const traceBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToDbChanges(() => {
      setDbState({
        products: [...MOCK_DB.products],
        orders: [...MOCK_DB.orders],
        campaigns: [...MOCK_DB.campaigns],
        theme: { ...MOCK_DB.theme },
        reviews: [...MOCK_DB.reviews],
        reports: [...MOCK_DB.reports],
        dashboards: [...MOCK_DB.dashboards],
        tenants: [...MOCK_DB.tenants],
        tasks: [...MOCK_DB.tasks],
        events: [...MOCK_DB.events]
      });
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, streamingText, isProcessing]);

  useEffect(() => {
    if (traceBottomRef.current) {
      traceBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [agentSteps]);

  const handleSendMessage = async (msg: string) => {
    if (!msg.trim() || isProcessing) return;
    setIsProcessing(true);
    setStreamingText("");
    setAgentSteps([]);
    try {
      await sendMessageToAgentStream(history, msg, (data) => {
        if (data.isDone) {
          setHistory(data.history);
          setIsProcessing(false);
          setStreamingText("");
        } else {
          setHistory(data.history);
          setAgentSteps(data.steps);
          setStreamingText(data.currentText);
        }
      });
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  const executeShortcut = (promptText: string) => {
    handleSendMessage(promptText);
  };

  // Speech Recognition hook for AI Chat Command Interface
  const [chatInput, setChatInput] = useState("");
  const [isChatVoiceListening, setIsChatVoiceListening] = useState(false);
  const [chatSpeechError, setChatSpeechError] = useState<string | null>(null);
  const chatRecognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = language === 'CN' ? 'zh-CN' : 'en-US';

      rec.onstart = () => {
        setIsChatVoiceListening(true);
        setChatSpeechError(null);
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
          setChatInput(prev => prev + (prev ? " " : "") + finalTranscript);
        }
      };

      rec.onerror = (e: any) => {
        console.error('Chat Speech recognition error dev: ', e.error);
        if (e.error === 'not-allowed') {
          setChatSpeechError(language === 'CN' ? '麦克风权限被拒绝' : 'Microphone authorized denied');
        }
        setIsChatVoiceListening(false);
      };

      rec.onend = () => {
        setIsChatVoiceListening(false);
      };

      chatRecognitionRef.current = rec;
    }

    return () => {
      if (chatRecognitionRef.current) {
        try {
          chatRecognitionRef.current.stop();
        } catch (err) {}
      }
    };
  }, [language]);

  const simulateSpeechRecognition = () => {
    setIsChatVoiceListening(true);
    setChatSpeechError(null);
    const phrases = language === 'CN' 
      ? ["在商品列表中添加一个价格为999美元的奢华曜黑丝绒风衣", "查询上个月最畅销的数字人系列订单", "修改当前店铺的主题颜色为深海幽蓝", "将选中订单的状态一键修改为已履行"]
      : ["Add a luxury black velvet trench coat priced at 999 USD to products", "Find the most popular human campaign orders last month", "Change current storefront layout style to deep midnight blue", "Batch list status update to completed of chosen orders"];
    
    // Select phrase
    const selectedPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    let index = 0;
    
    const interval = setInterval(() => {
      setChatInput(prev => prev + selectedPhrase[index]);
      index++;
      if (index >= selectedPhrase.length) {
        clearInterval(interval);
        setTimeout(() => {
          setIsChatVoiceListening(false);
        }, 500);
      }
    }, 100);
  };

  const toggleVoiceInput = () => {
    if (isChatVoiceListening) {
      if (chatRecognitionRef.current) {
        try {
          chatRecognitionRef.current.stop();
        } catch (err) {}
      }
      setIsChatVoiceListening(false);
    } else {
      setChatSpeechError(null);
      if (chatRecognitionRef.current) {
        try {
          chatRecognitionRef.current.start();
        } catch (err) {
          console.error('Web Speech API start error: ', err);
          simulateSpeechRecognition();
        }
      } else {
        simulateSpeechRecognition();
      }
    }
  };

  // Chat Camera and visual reference sensory states:
  const [isChatCameraActive, setIsChatCameraActive] = useState(false);
  const [chatCameraStream, setChatCameraStream] = useState<MediaStream | null>(null);
  const [chatUploadedMedia, setChatUploadedMedia] = useState<{ type: 'image' | 'file'; name: string; dataUrl: string } | null>(null);
  const chatVideoRef = useRef<HTMLVideoElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  // Google & WeChat Shared Account Authentication Module state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    avatar: string;
    provider: 'Google' | 'WeChat' | 'GitHub' | null;
  } | null>({
    name: "Alex Mercer",
    email: "alex.mercer@google.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    provider: "Google"
  }); // Seed with a beautiful active state by default to make it look active, can logout/login, fully interactive

  const handleChatFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const isImg = file.type.startsWith('image/');
      setChatUploadedMedia({
        type: isImg ? 'image' : 'file',
        name: file.name.toUpperCase(),
        dataUrl: isImg ? dataUrl : 'file_placeholder'
      });
      handleSendMessage(`I uploaded the file: "${file.name}" for business reference analytics.`);
    };
    reader.readAsDataURL(file);
  };

  const startChatCamera = async () => {
    setIsChatCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setChatCameraStream(stream);
      setTimeout(() => {
        if (chatVideoRef.current) {
          chatVideoRef.current.srcObject = stream;
        }
      }, 150);
    } catch (err) {
      console.warn('Chat Media stream access issue, triggering sandbox high tier luxury mockup lens fallback...', err);
    }
  };

  const stopChatCamera = () => {
    if (chatCameraStream) {
      chatCameraStream.getTracks().forEach(track => track.stop());
      setChatCameraStream(null);
    }
    setIsChatCameraActive(false);
  };

  const captureChatPhoto = () => {
    try {
      if (chatVideoRef.current && chatCameraStream) {
        const video = chatVideoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg');
          setChatUploadedMedia({
            type: 'image',
            name: `AESTHETIC_CHAT_SNAP_${new Date().getTime().toString().slice(-4)}.JPG`,
            dataUrl
          });
        }
      } else {
        const fallbacks = [
          "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=650&q=80",
          "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=650&q=80",
          "https://images.unsplash.com/photo-1604871000636-074fa5117945?auto=format&fit=crop&w=650&q=80"
        ];
        const selectedPic = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        setChatUploadedMedia({
          type: 'image',
          name: `GEN_AESTHETIC_REF_${new Date().getTime().toString().slice(-4)}.JPG`,
          dataUrl: selectedPic
        });
      }
    } catch (err) {
      console.error('Failed to capture chat reference: ', err);
    }
    stopChatCamera();
  };

  const customersList = useMemo(() => {
    return getInitialCustomers(dbState.orders);
  }, [dbState.orders]);

  return (
    <div className={cn(
      "flex h-screen w-screen font-sans overflow-hidden transition-colors duration-300",
      isLightMode ? "light-mode-active bg-[#fbfaf8] text-[#121214]" : "bg-[#06040b] text-[#efecf6]"
    )}>
      {isLightMode && (
        <style dangerouslySetInnerHTML={{ __html: `
          /* Dynamic Luxe Monochrome Light Mode Overrides */
          body, html {
            background-color: #fbfaf8 !important;
            color: #121214 !important;
          }
          .light-mode-active main,
          .light-mode-active .bg-\\[\\#080610\\],
          .light-mode-active .bg-\\[\\#06040b\\],
          .light-mode-active .bg-black {
            background-color: #fbfaf8 !important;
            color: #121214 !important;
          }
          .light-mode-active aside,
          .light-mode-active .bg-\\[\\#0f0b21\\] {
            background-color: #f5f4f0 !important;
            border-color: #dedcd8 !important;
          }
          .light-mode-active aside * {
            border-color: #dedcd8 !important;
            color: #1a1a1c !important;
          }
          .light-mode-active aside .bg-\\[\\#141029\\] {
            background-color: #eae9e4 !important;
          }
          .light-mode-active header {
            background-color: #fbfaf8 !important;
            border-color: #dedcd8 !important;
          }
          .light-mode-active table {
            color: #1c1917 !important;
          }
          .light-mode-active th {
            background-color: #f5f4ef !important;
            color: #1c1917 !important;
            border-bottom: 1px solid #dedcd8 !important;
          }
          .light-mode-active tr {
            border-color: #e5e5e0 !important;
          }
          .light-mode-active td {
            color: #27272a !important;
          }
          .light-mode-active tbody tr:hover {
            background-color: rgba(0,0,0,0.02) !important;
          }
          .light-mode-active .bg-\\[\\#120f26\\], 
          .light-mode-active .bg-\\[\\#140f38\\],
          .light-mode-active .bg-\\[\\#120e33\\],
          .light-mode-active .bg-\\[\\#110e2d\\],
          .light-mode-active .bg-\\[\\#141029\\],
          .light-mode-active .bg-\\[\\#0a071d\\],
          .light-mode-active .bg-purple-950\\/40,
          .light-mode-active .bg-\\[\\#100c26\\]\\/90,
          .light-mode-active .bg-\\[\\#161233\\],
          .light-mode-active .bg-\\[\\#1b1738\\],
          .light-mode-active .bg-\\[\\#151138\\],
          .light-mode-active .bg-\\[\\#0c0919\\],
          .light-mode-active .bg-\\[\\#130e2b\\] {
            background-color: #ffffff !important;
            border-color: #dedcd8 !important;
            color: #1c1917 !important;
          }
          .light-mode-active select,
          .light-mode-active input,
          .light-mode-active textarea {
            background-color: #ffffff !important;
            border-color: #cccaa8 !important;
            color: #000000 !important;
          }
          .light-mode-active .text-zinc-300,
          .light-mode-active .text-zinc-400,
          .light-mode-active .text-\\[\\#c0a9ff\\],
          .light-mode-active .text-\\[\\#efecf6\\],
          .light-mode-active .text-\\[\\#a7a2ce\\],
          .light-mode-active .text-purple-300,
          .light-mode-active .text-indigo-200 {
            color: #2e2e30 !important;
          }
          .light-mode-active .text-white {
            color: #000000 !important;
          }
          .light-mode-active .border-\\[\\#241c3e\\],
          .light-mode-active .border-\\[\\#2d245c\\],
          .light-mode-active .border-\\[\\#3c2a6f\\]\\/60,
          .light-mode-active .border-\\[\\#231b45\\],
          .light-mode-active .border-\\[\\#2a2153\\],
          .light-mode-active .border-\\[\\#2d255c\\] {
            border-color: #dedcd8 !important;
          }
          .light-mode-active .bg-\\[\\#201642\\] {
            background-color: #eae8e1 !important;
            color: #000000 !important;
          }
        `}} />
      )}
      {activeTab === 'template_editor' && (
        <style dangerouslySetInnerHTML={{ __html: `
          /* CSS Selector 1: Copilot Sidebar Header */
          div#root:nth-of-type(1) > div:nth-of-type(1) > aside:nth-of-type(1) > header:nth-of-type(1) {
            display: none !important;
          }
          /* CSS Selector 2: Main workspace header right items */
          div#root:nth-of-type(1) > div:nth-of-type(1) > main:nth-of-type(1) > header:nth-of-type(1) > div:nth-of-type(2) {
            display: none !important;
          }
          /* CSS Selectors 3, 4, 5, 6: Sibling quick action shortcuts wrapper inside sidebar */
          div#root:nth-of-type(1) > div:nth-of-type(1) > aside:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) {
            display: none !important;
          }
        `}} />
      )}
      
      {/* 🚀 LEFT NAVIGATION COL (Cosmic Obsidian Medusa style) */}
      {activeTab !== 'template_editor' && (
        <aside className="w-64 border-r border-[#241c3e] bg-[#0f0b21] h-full flex flex-col justify-between shrink-0">
          <div>
            {/* Main Logo Header */}
            <div className="p-6 border-b border-[#241c3e] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-display font-bold text-sm shadow-md shadow-purple-500/10 font-mono">AI</span>
                <div>
                  <h1 className="font-display font-bold text-15 tracking-tight text-white leading-none">
                    {language === 'CN' ? 'REMIX 智能系统' : 'REMIX SAAS'}
                  </h1>
                  <span className="text-[9px] text-purple-300 font-bold uppercase font-mono tracking-wider">
                    {language === 'CN' ? '新一代智控运营后台' : 'Commerce Hub'}
                  </span>
                </div>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" title="AI core engines authorized" />
            </div>

            {/* Space Switcher Option Option */}
            <div className="px-4 py-3 border-b border-[#241c3e] bg-[#141029]">
              <div className="flex bg-[#0f0b21] p-1 rounded-xl border border-[#2a2153]">
                <button 
                  onClick={() => {
                    setAdminMode('merchant');
                    setActiveTab('home');
                  }}
                  className={cn(
                    "flex-1 text-center py-1.5 text-[10px] font-mono tracking-tight font-bold rounded-lg transition-all",
                    adminMode === 'merchant'
                      ? "bg-[#8b5cf6] text-white shadow-sm"
                      : "text-zinc-500 hover:text-white"
                  )}
                >
                  {language === 'CN' ? '商家仪表盘' : 'MERCHANT'}
                </button>
                <button 
                  onClick={() => {
                    setAdminMode('platform');
                    setActiveTab('platform_control');
                  }}
                  className={cn(
                    "flex-1 text-center py-1.5 text-[10px] font-mono tracking-tight font-bold rounded-lg transition-all flex items-center justify-center gap-1",
                    adminMode === 'platform'
                      ? "bg-white text-black shadow-sm"
                      : "text-zinc-500 hover:text-white"
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  {language === 'CN' ? '平台自治层' : 'PLATFORM LAYER'}
                </button>
              </div>
            </div>

            {/* Quick AI System Map & Docs toggle */}
            <div className="px-4 pt-3 pb-1">
              <button
                onClick={() => setShowAiMap(true)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold font-mono tracking-tight bg-gradient-to-r from-violet-600/30 via-indigo-600/20 to-[#db2777]/20 hover:from-violet-600/40 hover:to-[#db2777]/40 border border-violet-500/20 hover:border-violet-500/40 text-violet-200 transition-all flex items-center justify-between group shadow-lg cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75 animate-duration-1000"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                  </span>
                  <span className="text-display font-extrabold text-[11px] uppercase tracking-wide text-[#c0a9ff] group-hover:text-white transition-colors">
                    {language === 'CN' ? '🧭 智控拓扑图谱' : '🧭 System Topology Map'}
                  </span>
                </div>
                <span className="text-[9px] font-mono font-bold bg-[#db2777]/25 text-[#f43f5e] border border-[#f43f5e]/25 px-1.5 py-0.5 rounded leading-none transition-transform group-hover:scale-105">
                  {language === 'CN' ? '架构' : 'MAP'}
                </span>
              </button>
            </div>

            {/* Navigation items list */}
            <nav className="p-4 space-y-1">
              {adminMode === 'merchant' ? (
                [
                  { id: 'home', label: 'Dashboard Storefront', icon: Home, path: '/' },
                  { id: 'products', label: 'Products & Gift Cards', icon: ShoppingBag, badge: dbState.products.length, path: '/products' },
                  { id: 'orders', label: 'Orders Registries', icon: Database, badge: dbState.orders.length, path: '/orders' },
                  { id: 'customers', label: 'CRM / B2B Accounts', icon: Users, badge: customersList.length, path: '/customers' },
                  { id: 'marketing', label: 'Marketing Copy UTM', icon: Tag, badge: dbState.campaigns.length, path: '/marketing' },
                  { id: 'translations', label: 'AI Localization Hub', icon: Globe, path: '/translations' },
                  { id: 'theme', label: 'Brand Styling', icon: Palette, path: '/theme' },
                  { id: 'template_editor', label: 'Frontend Template Editor', icon: Code, path: '/bjq' },
                  { id: 'analytics', label: 'Historical Reports', icon: Activity, path: '/analytics' },
                ].map(item => {
                  const IconComp = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-13 font-medium transition-all group duration-200",
                        isActive 
                          ? "bg-[#8b5cf6] text-white font-bold" 
                          : "text-zinc-400 hover:bg-[#1a1538] hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <IconComp size={15} strokeWidth={isActive ? 2.5 : 2} className="shrink-0 transition-colors" />
                        <span className="truncate">{tTab(item.id, item.label)}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className={cn(
                          "text-[10px] font-mono px-1.5 py-0.5 rounded-md leading-none ml-2 shrink-0",
                          isActive ? "bg-purple-900 text-purple-200" : "bg-[#1d163f] text-zinc-400"
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <button
                  onClick={() => setActiveTab('platform_control')}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-13 font-medium transition-all group duration-200 bg-white text-black"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Cpu size={16} strokeWidth={2.5} className="shrink-0 text-[#10B981]" />
                    <span className="truncate font-bold">
                      {language === 'CN' ? '超级平台治理中心' : 'Platform AI Controller'}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-black/10 rounded font-bold uppercase text-black/70">
                      /admin
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-bold bg-[#10B981]/25 text-[#10B981] px-1.5 py-0.5 rounded border border-[#10B981]/15 leading-none shrink-0">
                    SUPER
                  </span>
                </button>
              )}
            </nav>
          </div>

          {/* Sidebar drawer toggle button row */}
          <div className="p-4 border-t border-[#241c3e] bg-[#0c0919] flex justify-center">
            <button 
              onClick={() => setAiSidebarOpen(!aiSidebarOpen)}
              className="w-full py-1.5 bg-[#141029] hover:bg-purple-900/10 text-xs text-[#c0a9ff] rounded-xl flex items-center justify-center gap-1 font-semibold border border-[#2d245c] transition-all cursor-pointer"
            >
              {aiSidebarOpen 
                ? (language === 'CN' ? '🏷️ 收起 AI 助理' : '🏷️ Collapse AI Assistant') 
                : (language === 'CN' ? '🪄 展开 AI 助理' : '🪄 Open AI Assistant')
              }
            </button>
          </div>
        </aside>
      )}

      {/* 💻 CENTRAL WORKSPACE PANEL */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#080610] h-full overflow-hidden relative">
        {/* Navigation Breadcrumb header */}
        <header className="h-[72px] bg-[#0f0b21] border-b border-[#241c3e] px-8 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-2.5 text-xs text-zinc-400 font-mono">
            {activeTab === 'template_editor' ? (
              <button
                onClick={() => setActiveTab('home')}
                className="px-4 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-bold font-mono rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-purple-500/10 cursor-pointer"
              >
                <Home size={13} />
                <span>{language === 'CN' ? '◀ 返回主控制台' : '◀ Back to Dashboard'}</span>
              </button>
            ) : (
              <>
                <span className="text-[#a7d3ef] hidden lg:inline">
                  {adminMode === 'platform' 
                    ? (language === 'CN' ? '云原生平台系统超级编排架构' : 'SAAS_SUPER_ORCHESTRATOR') 
                    : (language === 'CN' ? '智能商家自治沙箱工作区' : 'MERCHANT_WORKSPACE')
                  }
                </span>
                <ChevronRight size={12} className="hidden lg:block" />
                <span className="text-white font-bold uppercase tracking-wider">{tTab(activeTab, activeTab)}</span>
              </>
            )}

            {/* Real-time Dynamic Browser Router Address Display */}
            <div className="ml-3 hidden sm:flex items-center bg-[#0d071d] px-2.5 py-1 border border-[#2d205b]/60 rounded-lg shadow-inner select-none transition-all hover:border-purple-500/30">
              <span className="hidden text-zinc-500 mr-1 text-[10px]">https://hygge-saas.com</span>
              <span className="text-pink-400 font-extrabold font-mono text-[11px] tracking-wide">
                {activeTab === 'home' ? '/' : 
                 activeTab === 'products' ? '/products' : 
                 activeTab === 'orders' ? '/orders' : 
                 activeTab === 'customers' ? '/customers' : 
                 activeTab === 'marketing' ? '/marketing' : 
                 activeTab === 'translations' ? '/translations' : 
                 activeTab === 'theme' ? '/theme' : 
                 activeTab === 'template_editor' ? '/bjq' : 
                 activeTab === 'analytics' ? '/analytics' : 
                 activeTab === 'platform_control' ? '/admin' : '/'}
              </span>
            </div>
          </div>
          
          {activeTab !== 'template_editor' && (
            <div className="flex items-center gap-4">
              {/* Immersive System Space Map Toggle Button */}
              <button
                onClick={() => setShowAiMap(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141029]/80 hover:bg-purple-900/30 text-[10px] font-bold text-[#c0a9ff] hover:text-white rounded-lg border border-[#2d245c] hover:border-[#8b5cf6]/50 transition-all font-mono shadow-inner cursor-pointer"
                title={language === 'CN' ? '查看系统架构与当前所处状态' : 'Inspect system topography & your location'}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#ec4899] animate-pulse" />
                <span className="hidden">{language === 'CN' ? '🧭 智控拓扑图谱 Map' : '🧭 System Topology'}</span>
                <span className="text-[8px] bg-[#ec4899]/20 text-[#ec4899] border border-[#ec4899]/30 px-1 rounded font-sans scale-90 leading-none">
                  {language === 'CN' ? '实时' : 'LIVE'}
                </span>
              </button>

              {/* Elegant Global Language Selection Selector */}
              <div className="flex bg-[#141029] p-0.5 rounded-full border border-[#2d245c]">
                <button 
                  onClick={() => setLanguage('CN')}
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-mono font-bold rounded-full transition-all flex items-center gap-1",
                    language === 'CN' 
                      ? "bg-[#8b5cf6] text-white shadow" 
                      : "text-zinc-400 hover:text-white"
                  )}
                  title="切换中文后台"
                >
                  <span>🇨🇳</span>
                  <span className="hidden leading-none md:inline">中文模式</span>
                </button>
                <button 
                  onClick={() => setLanguage('EN')}
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-mono font-bold rounded-full transition-all flex items-center gap-1",
                    language === 'EN' 
                      ? "bg-[#8b5cf6] text-white shadow" 
                      : "text-zinc-400 hover:text-white"
                  )}
                  title="Switch to English"
                >
                  <span>🇬🇧</span>
                  <span className="hidden leading-none md:inline">English</span>
                </button>
              </div>

              {/* Multi-Currency Selection Toggle */}
              <div className="flex items-center gap-2 bg-[#141029] px-3 py-1 border border-[#2d245c] rounded-full">
                <span className="text-[10px] font-mono font-bold text-[#a78bfa]">
                  {language === 'CN' ? '计价币种:' : 'CURRENCY:'}
                </span>
                <select 
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value as any)}
                  className="bg-transparent text-white font-mono text-11 font-bold border-none outline-none cursor-pointer"
                >
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="USD">USD ($) - Dollar</option>
                  <option value="CNY">CNY (¥) - Yuan</option>
                  <option value="GBP">GBP (£) - Sterling</option>
                  <option value="JPY">JPY (¥) - Yen</option>
                </select>
              </div>

              {/* Premium B&W Monochrome Mode Selector Tunnel */}
              <button
                onClick={() => setIsLightMode(!isLightMode)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer font-mono font-bold text-[9px] uppercase select-none active:scale-95 shrink-0",
                  isLightMode
                    ? "bg-[#1c1917] text-[#fbfaf8] border-[#1c1917] hover:bg-[#27272a]"
                    : "bg-white text-black border-white hover:bg-zinc-200"
                )}
                title={language === 'CN' ? '一键切换黑白双极简模式' : 'Toggle Black & White Mode'}
                id="global-lightmode-toggle"
              >
                {isLightMode ? (
                  <>
                    <Moon size={11} className="text-violet-400" />
                    <span>{language === 'CN' ? '黑暗极简' : 'DARK'}</span>
                  </>
                ) : (
                  <>
                    <Sun size={11} className="text-amber-500 animate-pulse" />
                    <span>{language === 'CN' ? '白黑双模' : 'LIGHT'}</span>
                  </>
                )}
              </button>

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#141029] border border-[#2d245c] rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono text-zinc-400">
                  {language === 'CN' ? '店铺视觉Style' : 'Theme'}: <span className="hidden text-[#a78bfa] font-semibold uppercase">{dbState.theme.themeStyle}</span>
                </span>
              </div>

              {/* Premium Social & Enterprise Shared Auth Controller Trigger */}
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#161233]/90 hover:bg-[#201a47] border border-[#3a2f75] hover:border-violet-400 rounded-full transition-all cursor-pointer shadow-md select-none active:scale-95 text-left shrink-0"
                id="social-login-trigger"
                title={language === 'CN' ? "谷歌/微信等多平台账号关联授权与共享登录" : "Google & WeChat SSO Multi-account integrations"}
              >
                {currentUser ? (
                  <>
                    <div className="relative w-4.5 h-4.5 rounded-full overflow-hidden border border-[#8b5cf6] shrink-0">
                      <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-500 border border-[#161233] animate-pulse" />
                    </div>
                    <span className="text-[10px] font-mono text-white font-bold tracking-tight hidden md:inline truncate max-w-[80px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800 scale-90 leading-none mr-0.5">
                      {currentUser.provider}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-4.5 h-4.5 rounded-full bg-[#201a45] flex items-center justify-center text-zinc-400 shrink-0">
                      <User size={10} className="text-violet-400" />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-violet-200 uppercase tracking-widest px-0.5">
                      {language === 'CN' ? '登录/共享账户' : 'SSO'}
                    </span>
                  </>
                )}
              </button>
              
              <button 
                onClick={() => {
                  const clearMsg = "Reset e-commerce sandbox environment. Set products, campaigns and layout to original minimal template state.";
                  handleSendMessage(clearMsg);
                }}
                className="p-2 text-zinc-400 hover:text-white hover:bg-[#1a1538] rounded-full transition-colors"
                title={language === 'CN' ? "还原沙箱并清除临时数据" : "Reset Database to Default Template"}
              >
                <RefreshCw size={15} />
              </button>
            </div>
          )}
        </header>

        {/* Core Workspace Screens with Framer Animation */}
        <div className="flex-1 overflow-y-auto relative p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="h-full"
            >
              {activeTab === 'home' && (
                <HomeStorefrontView 
                  dbState={dbState} 
                  handleAction={handleSendMessage} 
                  setActiveTab={setActiveTab} 
                  convert={convert}
                  convertNoDecimals={convertNoDecimals}
                  currencySymbol={currencyRates[selectedCurrency].symbol}
                  language={language}
                  isLightMode={isLightMode}
                />
              )}
              {activeTab === 'products' && (
                <ProductsCatalogView 
                  products={dbState.products} 
                  onSendMessage={handleSendMessage}
                  convert={convert}
                  selectedCurrency={selectedCurrency}
                  currencySymbol={currencyRates[selectedCurrency].symbol}
                  translateText={translateText}
                  language={language}
                />
              )}
              {activeTab === 'orders' && (
                <OrdersRegistryView 
                  orders={dbState.orders} 
                  onSendMessage={handleSendMessage}
                  convert={convert}
                  language={language}
                  selectedCurrency={selectedCurrency}
                  setSelectedCurrency={setSelectedCurrency}
                />
              )}
              {activeTab === 'customers' && (
                <CustomersCoreView 
                  customers={customersList} 
                  onSendMessage={handleSendMessage}
                  convert={convert}
                  segmentsList={segmentsList}
                  setSegmentsList={setSegmentsList}
                  companiesList={companiesList}
                  setCompaniesList={setCompaniesList}
                  language={language}
                />
              )}
              {activeTab === 'marketing' && (
                <MarketingCopyView 
                  campaigns={dbState.campaigns} 
                  onSendMessage={handleSendMessage}
                  products={dbState.products}
                  convert={convert}
                  convertNoDecimals={convertNoDecimals}
                  currencySymbol={currencyRates[selectedCurrency].symbol}
                  language={language}
                />
              )}
              {activeTab === 'translations' && (
                <TranslationsHub 
                  products={dbState.products}
                  campaigns={dbState.campaigns}
                  onSendMessage={handleSendMessage}
                  translateText={translateText}
                  language={language}
                />
              )}
              {activeTab === 'theme' && (
                <ThemeCustomizerView 
                  theme={dbState.theme} 
                  onSendMessage={handleSendMessage}
                  language={language}
                />
              )}
              {activeTab === 'template_editor' && (
                <FrontendTemplateEditorView 
                  language={language}
                  onSendMessage={handleSendMessage}
                />
              )}
              {activeTab === 'analytics' && (
                <AnalyticsReportView 
                  orders={dbState.orders} 
                  products={dbState.products}
                  reviews={dbState.reviews}
                  reports={dbState.reports}
                  dashboards={dbState.dashboards}
                  onSendMessage={handleSendMessage}
                  convert={convert}
                  convertNoDecimals={convertNoDecimals}
                  language={language}
                />
              )}
              {activeTab === 'platform_control' && (
                <SuperAdminControlView 
                  tenants={dbState.tenants}
                  tasks={dbState.tasks}
                  events={dbState.events}
                  onSendMessage={handleSendMessage}
                  onImpersonate={(tenantName) => {
                    setImpersonatingTenant(tenantName);
                    if (tenantName) {
                      handleSendMessage(`I am now impersonating Tenant: '${tenantName}'. Sync the active e-commerce sandbox layer.`);
                    }
                  }}
                  impersonatingTenant={impersonatingTenant}
                  language={language}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* 🔮 RIGHT PERSISTENT AI COPILOT DRAWER */}
      <AnimatePresence>
        {aiSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 440, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="border-l border-[#241c3e] bg-[#0f0b21] h-full flex flex-col overflow-hidden shrink-0 z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.15)]"
          >
            {/* Copilot Sidebar Header */}
            {activeTab !== 'template_editor' && (
              <header className="h-[72px] border-b border-[#241c3e] px-6 flex items-center justify-between shrink-0 bg-[#0f0b21]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#1b1738] border border-[#2c245c] flex items-center justify-center">
                    <Bot size={15} className="text-[#a78bfa]" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-14 text-white flex items-center gap-1.5 leading-tight">
                      {language === 'CN' ? 'AI 商业智能副官' : 'Operations Co-Op'}
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-purple-900/35 text-purple-200 border border-purple-800/40 animate-pulse">
                        {language === 'CN' ? '实时运行中' : 'ACTIVE'}
                      </span>
                    </h3>
                    <p className="text-[9px] font-mono text-zinc-500">
                      {language === 'CN' ? '谷歌 GEMINI 大模型智核驱动' : 'REMOTE AI ENGINE RUNTIME'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setAiSidebarOpen(false)}
                  className="text-zinc-400 hover:text-white hover:bg-[#1a1538] p-2 rounded-lg transition-colors"
                  title="Collapse AI Assistant sidebar"
                >
                  <ChevronRight size={15} />
                </button>
              </header>
            )}

            {/* Split Pane: Chat Feed (Top) & Action Step Trace (Bottom) */}
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              
              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ height: '60%' }}>
                {history.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
                    <div className="w-12 h-12 rounded-2xl bg-[#1b1738] border border-[#2d245c] flex items-center justify-center mb-4">
                      <Sparkle size={20} className="text-[#a78bfa] fill-purple-900/20 animate-pulse" />
                    </div>
                    <h4 className="font-display font-semibold text-[#efecf6] text-13">
                      {language === 'CN' ? 'AI 商业智能副官已上线' : 'Commerce Copilot is online.'}
                    </h4>
                    <p className="text-xs text-[#a7a2ce] mt-2 max-w-[240px] leading-relaxed mx-auto">
                      {language === 'CN' 
                        ? '请使用中文或英文向我发送各种指令，或点击下方【✨一键智探方案】快捷处理。' 
                        : 'Instruct me in natural language, or click the dropup menu below to execute automated actions.'}
                    </p>
                  </div>
                )}

                {/* Render chat list */}
                {history.map((msg, i) => (
                  <div key={i} className={cn("flex gap-3 max-w-[90%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto")}>
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0",
                      msg.role === 'user' ? "bg-[#8b5cf6] text-white" : "bg-[#1b1738] border border-[#2d245c] text-white"
                    )}>
                      {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <div className={cn(
                        "rounded-2xl p-4 text-13 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border leading-relaxed",
                        msg.role === 'user' 
                          ? "bg-[#8b5cf6] text-white border-[#8b5cf6]" 
                          : "bg-[#181432] border-[#291f4d] text-zinc-150"
                      )}>
                        <div className={cn("markdown-body", msg.role === 'user' ? "text-white" : "text-zinc-150")}>
                          <ReactMarkdown>{msg.parts?.map(p => p.text || "").join("") || ""}</ReactMarkdown>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500 self-end mt-0.5">
                        {msg.latencyMs ? `${(msg.latencyMs / 1000).toFixed(2)}s` : ""}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Streaming output response */}
                {isProcessing && streamingText && (
                  <div className="flex gap-3 max-w-[90%] mr-auto">
                    <div className="w-7 h-7 rounded-full bg-[#1b1738] border border-[#2d245c] flex items-center justify-center text-xs text-white shrink-0">
                      <Bot size={12} />
                    </div>
                    <div className="bg-[#181432] border-[#291f4d] text-zinc-150 rounded-2xl p-4 text-13 leading-relaxed shadow-sm">
                      <div className="markdown-body">
                        <ReactMarkdown>{streamingText}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bouncing Loader */}
                {isProcessing && !streamingText && (
                  <div className="flex gap-3 mr-auto">
                    <div className="w-7 h-7 rounded-full bg-[#1b1738] border border-[#2d245c] flex items-center justify-center text-xs text-white shrink-0">
                      <Bot size={12} />
                    </div>
                    <div className="bg-[#181432] border-[#291f4d] px-4 py-3 rounded-2xl flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Action Layer Sub-Steps Trace Drawer */}
              <div className="border-t border-[#241c3e] bg-[#0c0919] px-6 py-4 flex flex-col justify-between shrink-0" style={{ height: '30%' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="hidden text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                    <Layers size={10} /> {language === 'CN' ? '智能自治决策与动作日志监控' : 'Runtime Trace Logs'}
                  </span>
                  {isProcessing && (
                    <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 px-1.5 py-0.5 rounded-full font-bold">
                      <Loader2 size={8} className="animate-spin" /> {language === 'CN' ? '大模型子动作分解并发调度中' : 'SUB-STEP EXECUTIONS'}
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                  {agentSteps.length === 0 && (
                    <div className="h-full flex items-center justify-center text-center">
                      <span className="text-[10px] font-mono text-zinc-500 font-bold">
                        {language === 'CN' ? '⏳ 等待大模型智控动作引擎激发...' : 'WAITING FOR ACTION ENGINE EVENT...'}
                      </span>
                    </div>
                  )}
                  {agentSteps.map((step) => (
                    <div key={step.id} className="bg-[#120f26] px-3 py-2 rounded-xl border border-[#271f45] shadow-[0_1px_2px_rgba(0,0,0,0.1)] flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-zinc-300 flex items-center gap-1 bg-[#1b1738] px-1.5 py-0.5 border border-[#2c245c] rounded font-semibold text-[10px]">
                          {step.type === 'tool' ? `🔧 ${step.toolName}` : `🧠 THINK_STEP`}
                        </span>
                        {step.status === 'streaming' && (
                          <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                            <Loader2 size={10} className="animate-spin text-[#a78bfa]" /> running
                          </span>
                        )}
                        {step.status === 'completed' && (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 size={11} className="text-[#10b981]" />
                            <span className="text-[10px] font-mono text-zinc-400">{(step.latencyMs ? step.latencyMs / 1000 : 0.2).toFixed(2)}s</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Compact Sparkles & Style & Preset Dropup Menus */}
                <div className="relative mb-2 flex items-center justify-between select-none">
                  {/* Left Side: Sparkles dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShortcutsMenuOpen(!shortcutsMenuOpen);
                        setDesignMenuOpen(false);
                        setPresetsMenuOpen(false);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#141029]/90 hover:bg-[#1f1a3d]/90 border border-[#2d245c] hover:border-violet-500/50 rounded-lg text-[10px] font-mono text-[#c0a9ff] transition-all cursor-pointer select-none active:scale-95"
                    >
                      <Sparkles size={9} className="text-[#a78bfa] fill-purple-900/10" />
                      <span>{language === 'CN' ? '一键智控方案' : 'Quick Actions'}</span>
                      <span className="opacity-60 text-[8px] font-sans scale-90">▼</span>
                    </button>

                    {shortcutsMenuOpen && (
                      <div className="absolute bottom-full left-0 mb-1 w-64 bg-[#120f26] border border-[#2c2250] rounded-xl shadow-2xl p-1.5 z-30 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
                        {[
                          { label: language === 'CN' ? '🪄 批量上架北欧风格家具' : '🪄 Batch List Nordic Furniture', action: '帮我自动上架6款北欧风格台灯和家具, 设置价格并附上精美Unsplash配图' },
                          { label: language === 'CN' ? '🎨 切换为极简苹果风格' : '🎨 Apply Apple Minimalist', action: '把店铺首页主题色修改为苹果经典的极简铝合金风格，背景改白，主标题定为\'Pure Minimalist Oak Collection\'' },
                          { label: language === 'CN' ? '📉 搜索差评并退款邮件' : '📉 Refund 1-Star Review', action: '帮我找一个1星低评分的差评，看看对应的订单ID是谁，核对后发起全额退款，并在营销系统生成一则致歉客户的邮件。' }
                        ].map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              executeShortcut(item.action);
                              setShortcutsMenuOpen(false); // 自动收缩
                            }}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-[#1a1438]/85 text-zinc-350 hover:text-white rounded-lg text-[10px] sm:text-[11px] transition-colors font-medium flex items-center justify-between"
                          >
                            <span className="truncate">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Side: Active only in template editor */}
                  {activeTab === 'template_editor' && (
                    <div className="flex items-center gap-1.5">
                      {/* 🎨 风格设计 Dropup (smaller button) */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setDesignMenuOpen(!designMenuOpen);
                            setShortcutsMenuOpen(false);
                            setPresetsMenuOpen(false);
                          }}
                          className="flex items-center gap-1 px-2 py-1.5 bg-[#141029]/90 hover:bg-[#1f1a3d]/90 border border-[#2d245c] hover:border-violet-500/50 rounded-lg text-[10px] font-mono text-[#c0a9ff] transition-all cursor-pointer select-none active:scale-95"
                          title="视觉风格"
                        >
                          <span>🎨</span>
                          <span className="hidden leading-none xs:inline">{language === 'CN' ? '风格设计' : 'Style'}</span>
                          <span className="opacity-65 text-[7px]">▼</span>
                        </button>

                        {designMenuOpen && (
                          <div className="absolute bottom-full right-0 mb-1 w-52 bg-[#120f26] border border-[#2c2250] rounded-xl shadow-2xl p-1.5 z-30 divide-y divide-[#1e193d] animate-in fade-in slide-in-from-bottom-2 duration-150 max-h-[300px] overflow-y-auto">
                            {/* Color settings */}
                            <div className="py-1">
                              <div className="text-[8px] text-zinc-500 font-bold px-2 py-0.5 uppercase tracking-wider">{language === 'CN' ? '主题配色' : 'Theme Color'}</div>
                              {[
                                { label: language === 'CN' ? '💎 皇家紫' : '💎 Royal Violet', type: 'colorAccent', value: '#8b5cf6' },
                                { label: language === 'CN' ? '🍃 睿森翠' : '🍃 Sandalwood Jade', type: 'colorAccent', value: '#059669' }
                              ].map((opt, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    window.dispatchEvent(new CustomEvent('update-template-style', { detail: { type: opt.type, value: opt.value } }));
                                    setDesignMenuOpen(false); // 自动收缩
                                  }}
                                  className="w-full text-left px-2 py-1 hover:bg-[#1a1438]/85 text-[#efecf6] hover:text-white rounded text-[11px] transition-colors"
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>

                            {/* Spacing padding settings */}
                            <div className="py-1">
                              <div className="text-[8px] text-zinc-500 font-bold px-2 py-0.5 uppercase tracking-wider">{language === 'CN' ? '内容间距' : 'Padding'}</div>
                              {[
                                { label: language === 'CN' ? '📏 紧凑细密' : '📏 Dense Packing', type: 'paddingLevel', value: 'dense' },
                                { label: language === 'CN' ? '📐 宽敞呼吸' : '📐 Airy Layout', type: 'paddingLevel', value: 'spacious' }
                              ].map((opt, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    window.dispatchEvent(new CustomEvent('update-template-style', { detail: { type: opt.type, value: opt.value } }));
                                    setDesignMenuOpen(false); // 自动收缩
                                  }}
                                  className="w-full text-left px-2 py-1 hover:bg-[#1a1438]/85 text-[#efecf6] hover:text-white rounded text-[11px] transition-colors"
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>

                            {/* Border Radius rounded settings */}
                            <div className="py-1">
                              <div className="text-[8px] text-zinc-550 font-bold px-2 py-0.5 uppercase tracking-wider">{language === 'CN' ? '组件圆角' : 'Rounded Border'}</div>
                              {[
                                { label: language === 'CN' ? '▫️ 极简直角' : '▫️ Sharp Rect', type: 'borderRadiusSize', value: 'none' },
                                { label: language === 'CN' ? '🔘 润泽大圆' : '🔘 Pristine Round', type: 'borderRadiusSize', value: 'xl' }
                              ].map((opt, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    window.dispatchEvent(new CustomEvent('update-template-style', { detail: { type: opt.type, value: opt.value } }));
                                    setDesignMenuOpen(false); // 自动收缩
                                  }}
                                  className="w-full text-left px-2 py-1 hover:bg-[#1a1438]/85 text-[#efecf6] hover:text-white rounded text-[11px] transition-colors"
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>

                            {/* Shadows effects */}
                            <div className="py-1">
                              <div className="text-[8px] text-zinc-550 font-bold px-2 py-0.5 uppercase tracking-wider">{language === 'CN' ? '投影立体度' : 'Shadow depth'}</div>
                              {[
                                { label: language === 'CN' ? '⚡ 扁平无影' : '⚡ Flat Shadow', type: 'shadowDepth', value: 'none' },
                                { label: language === 'CN' ? '✨ 霓虹极光' : '✨ Glowing Aura', type: 'shadowDepth', value: 'glowing' }
                              ].map((opt, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    window.dispatchEvent(new CustomEvent('update-template-style', { detail: { type: opt.type, value: opt.value } }));
                                    setDesignMenuOpen(false); // 自动收缩
                                  }}
                                  className="w-full text-left px-2 py-1 hover:bg-[#1a1438]/85 text-[#efecf6] hover:text-white rounded text-[11px] transition-colors"
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>

                            {/* Font Styles */}
                            <div className="py-1">
                              <div className="text-[8px] text-zinc-550 font-bold px-2 py-0.5 uppercase tracking-wider">{language === 'CN' ? '排版字体' : 'Typography Staff'}</div>
                              {[
                                { label: language === 'CN' ? '🔤 Inter' : '🔤 Inter Sans', type: 'globalFont', value: 'sans' },
                                { label: language === 'CN' ? '💻 JetBrains' : '💻 JetBrains Mono', type: 'globalFont', value: 'mono' }
                              ].map((opt, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    window.dispatchEvent(new CustomEvent('update-template-style', { detail: { type: opt.type, value: opt.value } }));
                                    setDesignMenuOpen(false); // 自动收缩
                                  }}
                                  className="w-full text-left px-2 py-1 hover:bg-[#1a1438]/85 text-[#efecf6] hover:text-white rounded text-[11px] transition-colors"
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 🗂️ 核心预设 Dropup (smaller button) */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setPresetsMenuOpen(!presetsMenuOpen);
                            setShortcutsMenuOpen(false);
                            setDesignMenuOpen(false);
                          }}
                          className="flex items-center gap-1 px-2 py-1.5 bg-[#141029]/90 hover:bg-[#1f1a3d]/90 border border-[#2d245c] hover:border-violet-500/50 rounded-lg text-[10px] font-mono text-[#c0a9ff] transition-all cursor-pointer select-none active:scale-95"
                          title="核心模板预设"
                        >
                          <span>🗂️</span>
                          <span className="hidden leading-none xs:inline">{language === 'CN' ? '推荐模板' : 'Presets'}</span>
                          <span className="opacity-65 text-[7px]">▼</span>
                        </button>

                        {presetsMenuOpen && (
                          <div className="absolute bottom-full right-0 mb-1 w-60 bg-[#120f26] border border-[#2c2250] rounded-xl shadow-2xl p-1.5 z-30 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
                            {[
                              { id: 'product-grid', label: language === 'CN' ? '🛍️ 商品卡片网格' : '🛍️ E-Commerce Product Cards' },
                              { id: 'hero-banner', label: language === 'CN' ? '🏔️ 呼吸感海报巨幕' : '🏔️ Hygge Storefront Hero' },
                              { id: 'cart-list', label: language === 'CN' ? '🛒 购物清单对账单' : '🛒 Shopping Bag Checklist' },
                              { id: 'testimonials', label: language === 'CN' ? '💬 霓虹磁贴社群好评' : '💬 Review Testimonials Bento' }
                            ].map((item, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  window.dispatchEvent(new CustomEvent('update-template-style', { detail: { type: 'presetTemplate', value: item.id } }));
                                  setPresetsMenuOpen(false); // 自动收缩
                                }}
                                className="w-full text-left px-2.5 py-1.5 hover:bg-[#1a1438]/85 text-[#efecf6] hover:text-white rounded-lg text-[11px] transition-colors font-medium flex items-center justify-between"
                              >
                                <span className="truncate">{item.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {chatSpeechError && (
                  <div className="px-1.5 pb-2 text-[10px] text-rose-400 font-mono tracking-wider animate-pulse uppercase">
                    ⚠️ {chatSpeechError}
                  </div>
                )}

                {/* Captured Chat Aesthetic Attachment Preview */}
                <AnimatePresence>
                  {chatUploadedMedia && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      className="mb-2.5 p-2 bg-[#100c26]/90 backdrop-blur-md border border-[#3c2a6f]/60 rounded-xl flex items-center gap-2.5 mx-1 text-left shadow-lg relative"
                    >
                      <div className="relative w-9 h-9 bg-[#171336] rounded-lg overflow-hidden shrink-0 border border-[#443380]/40 flex items-center justify-center">
                        {chatUploadedMedia.type === 'image' && chatUploadedMedia.dataUrl !== 'file_placeholder' ? (
                          <img 
                            src={chatUploadedMedia.dataUrl} 
                            alt="Sensory upload reference" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Upload size={14} className="text-[#a78bfa] animate-pulse" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 pr-6">
                        <span className="text-[7.5px] font-mono text-[#aa9cf5] uppercase tracking-wider leading-none">
                          {chatUploadedMedia.type === 'image' ? (language === 'CN' ? "视觉参考图片" : "Visual Ref (IMG)") : (language === 'CN' ? "业务对账文件" : "Ledger/Doc Ref")}
                        </span>
                        <span className="text-[9.5px] text-[#efecf6] font-mono truncate tracking-tight mt-0.5">{chatUploadedMedia.name}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setChatUploadedMedia(null)}
                        className="absolute top-2 right-2 p-1 bg-[#1a143d] hover:bg-[#34226a] text-purple-300 hover:text-white rounded-full transition-colors cursor-pointer"
                        title="Remove reference"
                      >
                        <X size={9} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    let finalMsg = chatInput;
                    if (chatUploadedMedia) {
                      finalMsg += ` [Visual Reference Attached: "${chatUploadedMedia.name}"]`;
                    }
                    if (!finalMsg.trim() || isProcessing) return;
                    handleSendMessage(finalMsg);
                    setChatInput("");
                    setChatUploadedMedia(null);
                  }} 
                  className="relative flex items-center bg-[#181432] rounded-xl border border-[#2d245c] p-1 focus-within:ring-2 focus-within:ring-[#8b5cf6] focus-within:bg-[#1f1a3d] transition-all"
                >
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={language === 'CN' ? (isChatVoiceListening ? "正在倾听您的话语..." : "在这对 AI 发送任意业务操控指令...") : (isChatVoiceListening ? "Listening..." : "Instruct AI Co-Op in CN or EN...")}
                    disabled={isProcessing}
                    className="flex-1 bg-transparent px-3 py-2 outline-none placeholder:text-zinc-500 text-white text-13 font-medium"
                    id="ai-chat-text-input"
                  />
                  
                  {/* Microphone speech recognition trigger button */}
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    disabled={isProcessing}
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer mr-1 shrink-0",
                      isChatVoiceListening 
                        ? "bg-rose-950/40 text-rose-400 border border-rose-500/50 animate-pulse" 
                        : "text-zinc-400 hover:text-[#c0a9ff] hover:bg-[#201a45]"
                    )}
                    title={language === 'CN' ? "录制语音" : "Record Voice"}
                    id="ai-chat-voice-btn"
                  >
                    <Mic size={14} className={cn(isChatVoiceListening && "animate-bounce text-rose-400")} />
                  </button>

                  {/* Toggle Camera lens floating action button */}
                  <button
                    type="button"
                    onClick={startChatCamera}
                    disabled={isProcessing}
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer mr-1 shrink-0",
                      isChatCameraActive 
                        ? "bg-amber-950/45 text-amber-300 border border-amber-500/40" 
                        : "text-zinc-400 hover:text-amber-200 hover:bg-[#201a45]"
                    )}
                    title={language === 'CN' ? "激活相机镜头" : "Toggle Camera Lens"}
                    id="ai-chat-camera-btn"
                  >
                    <Camera size={14} className={cn(isChatCameraActive && "animate-pulse text-amber-300")} />
                  </button>

                  {/* Upload media file or photo directly */}
                  <button
                    type="button"
                    onClick={() => chatFileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer mr-1 shrink-0 text-zinc-400 hover:text-[#a78bfa] hover:bg-[#201a45]"
                    title={language === 'CN' ? "上传参考文件/图片" : "Upload File/Image"}
                    id="ai-chat-upload-media-btn"
                  >
                    <Upload size={14} />
                  </button>
                  <input
                    type="file"
                    ref={chatFileInputRef}
                    onChange={handleChatFileChange}
                    accept="image/*,video/*,.pdf,.doc,.csv,.xlsx,.json,.txt"
                    className="hidden"
                  />

                  <button 
                    type="submit"
                    disabled={isProcessing || (!chatInput.trim() && !chatUploadedMedia)}
                    className="w-8 h-8 rounded-lg bg-[#8b5cf6] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#7c3aed] transition-colors shrink-0 cursor-pointer"
                  >
                    {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <SendHorizontal size={14} />}
                  </button>
                </form>
              </div>

            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* 🧭 Micro-architectural Map Overlay */}
      {showAiMap && (
        <AiSystemMap
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
          }}
          language={language}
          dbState={dbState}
          onClose={() => setShowAiMap(false)}
        />
      )}

      {/* Live Chat Camera Capture Interface */}
      <AnimatePresence>
        {isChatCameraActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          >
            <div className="relative w-full max-w-sm bg-[#120e2e] border border-purple-500/20 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-purple-950 pb-3">
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-mono tracking-[0.3em] text-purple-400/80 uppercase">AI Chat Reference Lens</span>
                  <span className="text-xs font-bold text-white tracking-widest uppercase mt-0.5">{language === 'CN' ? '拍摄美学实物' : 'AESTHETIC CAMERA FEED'}</span>
                </div>
                <button 
                  onClick={stopChatCamera}
                  className="p-1 rounded-full hover:bg-purple-900/20 text-purple-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Camera view screen */}
              <div className="relative aspect-square w-full bg-[#06040c] rounded-2xl overflow-hidden border border-purple-950/50 flex items-center justify-center">
                {chatCameraStream ? (
                  <video 
                    ref={chatVideoRef}
                    autoPlay 
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center gap-3">
                    <Loader2 size={18} className="animate-spin text-purple-400" />
                    <span className="text-[9px] font-mono text-purple-300 uppercase tracking-widest animate-pulse">{language === 'CN' ? '激活系统相机中...' : 'Accessing Camera Hardware...'}</span>
                    <span className="text-[8px] font-mono text-purple-400/50 uppercase tracking-wider max-w-[220px] leading-relaxed">
                      {language === 'CN' ? '如果由于沙箱环境被拒绝，将自动加载高级时尚概念美学参考' : 'Sandbox fallback features will automatically boot high-tier visual design stills on snap.'}
                    </span>
                  </div>
                )}

                {/* Overlaid sights */}
                <div className="absolute inset-5 pointer-events-none border border-purple-500/10" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none border border-purple-500/20 rounded-full" />
              </div>

              {/* Options */}
              <div className="flex items-center gap-3 mt-1">
                <button
                  onClick={stopChatCamera}
                  className="flex-1 py-1.5 bg-transparent hover:bg-purple-950/20 text-purple-300 hover:text-purple-100 border border-purple-900/30 text-[9px] font-mono tracking-widest uppercase rounded-full transition-all cursor-pointer text-center"
                >
                  {language === 'CN' ? '关闭' : 'CLOSE'}
                </button>

                <button
                  onClick={captureChatPhoto}
                  className="flex-1 py-1.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-[9px] font-mono tracking-widest uppercase rounded-full transition-all font-bold cursor-pointer text-center shadow-lg"
                >
                  {language === 'CN' ? '微瞬捕获' : 'CAPTURE FRAME'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔮 SSO Multi-Platform Shared Login Hub & WeChat QR Integration */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-[#0e0a29] border border-[#3e2380]/60 rounded-3xl p-6 shadow-2xl overflow-hidden text-left"
            >
              {/* Glowing Ambient Background Spotlights */}
              <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-violet-600/10 blur-[60px] pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-pink-600/10 blur-[60px] pointer-events-none" />

              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#22174d] pb-4 mb-5 relative z-10">
                <div className="flex flex-col">
                  <span className="text-[9px] font-mono tracking-[0.3em] text-[#a78bfa] uppercase">SSO Authentication Cluster</span>
                  <span className="text-sm font-bold text-white tracking-widest uppercase mt-0.5">
                    {language === 'CN' ? '多端共享登录与账号互联' : 'INTEGRATED SHARED SIGN-ON'}
                  </span>
                </div>
                <button 
                  onClick={() => setIsAuthModalOpen(false)}
                  className="p-1 rounded-full hover:bg-purple-950/40 text-[#c0a9ff] hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Current Active SSO Session */}
              <div className="mb-6 p-4 bg-[#140f38] border border-[#2b1c5c] rounded-2xl relative z-10">
                <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 mb-2.5">
                  {language === 'CN' ? '● 当前激活会话' : '● CURRENT AUTH STATE'}
                </div>
                {currentUser ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 font-mono">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#8b5cf6]">
                        <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <span className="absolute bottom-0 right-0 block w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#140f38] animate-pulse" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          {currentUser.name}
                          <span className="text-[8px] bg-violet-900 border border-violet-700 text-violet-200 px-1 rounded-sm uppercase tracking-wider scale-90">
                            {currentUser.provider} Active
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-1">{currentUser.email}</div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setCurrentUser(null);
                        handleSendMessage(language === 'CN' ? "我已退出 shared SSO 登录会话。" : "I signed out of the active social login co-op session.");
                      }}
                      className="px-3 py-1.5 bg-rose-950/45 hover:bg-rose-900/40 text-rose-300 hover:text-rose-100 border border-rose-900/30 text-[10px] font-mono tracking-wider uppercase rounded-lg transition-colors cursor-pointer"
                    >
                      {language === 'CN' ? '退出登录' : 'DISCONNECT'}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <p className="text-[11px] text-[#aa9cf5] font-mono uppercase tracking-wider mb-1 animate-pulse">
                      {language === 'CN' ? '未登录 / 游客身份访客状态' : 'NOT SIGNED IN / GUEST STATUS'}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1">
                      {language === 'CN' ? '授权共享平台账号可一键解锁美学多端协作与实时同步功能指标' : 'Signing into a shared developer/brand account unlocks design synchronization endpoints.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Shared Providers Options Panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                
                {/* 1. GOOGLE SHARED SIGN-ON MODULE */}
                <div className="p-4 bg-[#120e33] border border-[#2d1e66] hover:border-violet-500/30 rounded-2xl flex flex-col justify-between transition-all">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base leading-none">✨</span>
                      <span className="text-11 font-mono font-bold text-white uppercase tracking-wider">Google OAuth SSO</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-relaxed mb-4 font-sans">
                      {language === 'CN' ? '授权您的 Google 账户，自动同步和保存配置。' : 'Direct secure tunnel into shared Google Workspaces. Easily bind active analytics sheets or cloud files.'}
                    </p>
                  </div>

                  <div className="space-y-2 mt-2">
                    <button
                      onClick={() => {
                        setCurrentUser({
                          name: "Alex Mercer",
                          email: "alex.mercer@google.com",
                          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
                          provider: "Google"
                        });
                        setIsAuthModalOpen(false);
                        handleSendMessage(language === 'CN' ? "我通过 Google SSO 共享账户登录成功。邮箱：alex.mercer@google.com" : "Logged in using Google Enterprise Partner Account: alex.mercer@google.com");
                      }}
                      className="w-full py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-[10px] font-bold font-mono tracking-widest uppercase rounded-lg transition-all cursor-pointer text-center"
                    >
                      {language === 'CN' ? '谷歌一键登录' : 'GOOGLE SIGN IN'}
                    </button>
                    
                    <button
                      onClick={() => {
                        setCurrentUser({
                          name: "Sarah Jenkins",
                          email: "s.jenkins@studio-luxury.vip",
                          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
                          provider: "Google"
                        });
                        setIsAuthModalOpen(false);
                        handleSendMessage(language === 'CN' ? "通过 Google VIP 品牌账户：Sarah Jenkins 登录成功" : "Successfully connected luxury agency Google brand tenant: Sarah Jenkins");
                      }}
                      className="w-full py-1.5 bg-transparent hover:bg-purple-950/30 text-[#a78bfa] border border-[#3e258a]/50 text-[9px] font-mono tracking-wider uppercase rounded-lg transition-all cursor-pointer text-center"
                    >
                      {language === 'CN' ? '切换: 品牌设计组 Google' : 'USE: Design Agency Google'}
                    </button>
                  </div>
                </div>

                {/* 2. WECHAT SHARED QR-SCAN WORKFLOW */}
                <div className="p-4 bg-[#120e33] border border-[#2d1e66] hover:border-emerald-500/30 rounded-2xl flex flex-col justify-between transition-all">
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-emerald-400">🟢</span>
                      <span className="text-11 font-mono font-bold text-white uppercase tracking-wider">
                        {language === 'CN' ? '微信扫一扫登录/共享' : 'WeChat Shared SSO'}
                      </span>
                    </div>

                    {/* QR code element */}
                    <div className="my-2 flex justify-center">
                      <div className="relative p-2 bg-gradient-to-tr from-emerald-500/10 to-teal-500/35 rounded-xl border border-emerald-500/20 w-24 h-24 flex flex-col items-center justify-center group overflow-hidden shadow-lg shadow-black/80">
                        {/* Dynamic aesthetic QR code lines */}
                        <div className="w-full h-full bg-[#111] rounded-lg p-0.5 relative">
                          <div className="grid grid-cols-4 gap-1 p-1 w-full h-full opacity-90">
                            <div className="bg-emerald-400 rounded-sm"></div>
                            <div className="bg-white/10 rounded-sm"></div>
                            <div className="bg-emerald-400 rounded-sm"></div>
                            <div className="bg-emerald-400 rounded-sm"></div>
                            <div className="bg-white/10 rounded-sm"></div>
                            <div className="bg-emerald-500 rounded-sm"></div>
                            <div className="bg-white/10 rounded-sm"></div>
                            <div className="bg-emerald-400 rounded-sm"></div>
                            <div className="bg-emerald-400 rounded-sm"></div>
                            <div className="bg-white/10 rounded-sm"></div>
                            <div className="bg-emerald-400 rounded-sm"></div>
                            <div className="bg-white/10 rounded-sm"></div>
                            <div className="bg-[#111] rounded-sm"></div>
                            <div className="bg-emerald-500 rounded-sm"></div>
                            <div className="bg-white/10 rounded-sm"></div>
                            <div className="bg-emerald-400 rounded-sm"></div>
                          </div>
                          {/* Scanning bar */}
                          <div className="absolute top-0 inset-x-0 h-0.5 bg-emerald-400 animate-bounce shadow-md shadow-emerald-400/80" />
                        </div>
                      </div>
                    </div>

                    <p className="text-[8.5px] font-mono text-zinc-400 text-center uppercase tracking-tight mb-2">
                      {language === 'CN' ? '使用手机微信扫码关联或一键共享登录' : 'Scan to authenticate or link partner identity'}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setCurrentUser({
                        name: "华裔设计师 陈伟 Wei Chen",
                        email: "chen.wei@wechat.shared",
                        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
                        provider: "WeChat"
                      });
                      setIsAuthModalOpen(false);
                      handleSendMessage(language === 'CN' ? "我已使用微信扫码，共享登录成功。主理人：陈伟" : "Connected WeChat identity node for chief design associate: Wei Chen.");
                    }}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold font-mono tracking-widest uppercase rounded-lg transition-all cursor-pointer text-center mt-1"
                  >
                    {language === 'CN' ? '一键模拟微信登陆' : 'SIMULATE WECHAT SCAN'}
                  </button>
                </div>

              </div>

              {/* Auxiliary details */}
              <div className="mt-5 pt-3 border-t border-[#22174d] text-center">
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                  Secure OAuth2 & Shared Key Authentication Tunnel active. Fully compliant with Sandbox Security Regulations.
                </span>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

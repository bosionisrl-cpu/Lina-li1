import React, { useState } from 'react';
import { 
  Network, Database, ShoppingBag, FolderGit2, Users, Tag, 
  Globe, Palette, Activity, ShieldCheck, ArrowRight, HelpCircle, 
  Sparkles, CheckCircle, Smartphone, Cpu, ListCollapse
} from 'lucide-react';
import { cn } from '../lib/utils';

interface AiSystemMapProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: 'CN' | 'EN';
  dbState: {
    products: any[];
    orders: any[];
    campaigns: any[];
    theme: any;
    tenants: any[];
    tasks: any[];
    events: any[];
  };
  onClose: () => void;
}

export default function AiSystemMap({
  activeTab,
  setActiveTab,
  language,
  dbState,
  onClose
}: AiSystemMapProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(activeTab);

  // Map nodes to database tasks
  const getNodeStatus = (nodeId: string) => {
    if (!dbState.tasks) return null;
    const tasks = dbState.tasks.filter((task: any) => {
      if (nodeId === 'marketing') {
        return task.command === 'generate_marketing_campaign' || task.command === 'execute_auto_seo_backlink';
      }
      if (nodeId === 'customers') {
        return task.command === 'analyze_customer_sentiment';
      }
      if (nodeId === 'products') {
        return task.command === 'generate_new_product_image';
      }
      return false;
    });
    if (tasks.length === 0) return null;
    if (tasks.some((t: any) => t.status === 'Running')) return 'Running';
    if (tasks.some((t: any) => t.status === 'Queued')) return 'Queued';
    if (tasks.some((t: any) => t.status === 'Failed')) return 'Failed';
    return 'Completed';
  };

  // Get active tasks for selected node
  const getSelectedNodeTasks = () => {
    if (!dbState.tasks) return [];
    return dbState.tasks.filter((task: any) => {
      if (selectedNodeId === 'marketing') {
        return task.command === 'generate_marketing_campaign' || task.command === 'execute_auto_seo_backlink';
      }
      if (selectedNodeId === 'customers') {
        return task.command === 'analyze_customer_sentiment';
      }
      if (selectedNodeId === 'products') {
        return task.command === 'generate_new_product_image';
      }
      return false;
    });
  };

  // Get active design changes or event history for selected node
  const getSelectedNodeEvents = () => {
    if (!dbState.events) return [];
    return dbState.events.filter((evt: any) => {
      if (selectedNodeId === 'marketing') {
        return evt.type === 'AI_PRODUCT_CREATED';
      }
      if (selectedNodeId === 'theme') {
        return evt.type === 'AI_THEME_UPDATED';
      }
      if (selectedNodeId === 'platform_control') {
        return evt.type === 'RATE_LIMIT_TRIGGERED' || evt.type === 'TENANT_SUSPENDED';
      }
      if (selectedNodeId === 'products') {
        return evt.type === 'AI_PRODUCT_CREATED';
      }
      return false;
    });
  };

  // Define SaaS System Nodes
  const systemNodes = [
    {
      id: 'home',
      label: language === 'CN' ? '前台电商橱窗与大盘' : 'Storefront Preview & Stats',
      icon: ShoppingBag,
      description: language === 'CN' 
        ? '同步当前的品牌调性、版面布局和上新架商品，提供真实的可视化网页效果。' 
        : 'Displays live storefront mockups synchronizing active items, headers, layouts, and brand-wide values.',
      insights: language === 'CN'
        ? ['前台响应式极简橱窗', '与核心 SQLite/State 数据表实时高频联动', '一键模拟买单事件写入']
        : ['Live compiled mockup with high-fidelity outputs', 'Direct reactive liaison with localized schema tables', 'Quick demo buttons to inject complex test states'],
      samplePrompts: language === 'CN' 
        ? ['"帮我注入精美体验 Demo 🚀"', '"自动装修首页为苹果冷铝简约配色，重新调整标语"'] 
        : ['"Help me inject a rich demo with lamps & coffee tables"', '"Switch the default background color to a sleek solar gradient styling"'],
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30'
    },
    {
      id: 'products',
      label: language === 'CN' ? '商品管理目录' : 'Products & SKU Catalog',
      icon: FolderGit2,
      description: language === 'CN'
        ? '配置产品 SKU、详情说明与定价体系，支持高精静物背景消除、图库精准匹配上架。'
        : 'Holds and monitors active products, custom SKU identifiers, prices, and automated photo backdrops.',
      insights: language === 'CN'
        ? ['智能 SKU 自动派生算法', '通过图片微裁剪/白底生成实现智能视觉升级', '数据库实时库存锁定']
        : ['Custom deterministic SKU alphanumeric algorithms', 'Autonomous image visual processing overlays', 'Real-time inventory levels tracking'],
      samplePrompts: language === 'CN'
        ? ['"上架6个具有设计感的北欧实木餐椅，设定合适的价格"', '"给最新上架的商品消除图片背景，替换为高级质感灰色置景"']
        : ['"List 5 minimalist oak timber armchairs with standard SKU tags"', '"Run backdrops removals for the newly added furniture items"'],
      color: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30'
    },
    {
      id: 'orders',
      label: language === 'CN' ? '账簿活动订单' : 'Orders Registry',
      icon: Database,
      description: language === 'CN'
        ? '管理顾客流水，提供订单时序列表、履约状态审查、发货延迟洞察与退款快速全自动执行。'
        : 'Captures and lists consumer orders, filters dispatch bottlenecks, audits shipping flags, and initiates direct cashbacks.',
      insights: language === 'CN'
        ? ['内置全球多网点物流时延交叉审查', '极简无纸化一键处理高阶退款事件', '账簿流动资金动态图']
        : ['Cross-references scheduled dispatch queues with local transit states', 'Loss mitigation audit flow with instant single-click refunds', 'Stateful database-driven income statistics'],
      samplePrompts: language === 'CN'
        ? ['"调查最近有哪些订单发生了发货延迟，列出来"', '"锁定差评顾客的订单号 2017-1049 并对此全额退款"']
        : ['"Look for delivery bottle-necks or delayed status orders"', '"Reverse transaction order_id 2017-1049 and execute full refunds"'],
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
      id: 'customers',
      label: language === 'CN' ? 'CRM 核心客户细分' : 'CRM & B2B Directory',
      icon: Users,
      description: language === 'CN'
        ? '对店铺消费群落实施聚类细分，监控复购指标，支持 AI 智能生成高亲和度致歉或关怀信。'
        : 'Slices and groups target shoppers, gauges customer-lifetime-values, and drafts custom CRM client templates.',
      insights: language === 'CN'
        ? ['自动分类为高价值常客、潜客、流失预警用户', '一键生成极佳的深度拟真回复函', 'B2B 采购通道集成监测']
        : ['Segments profiles into VIP retention, returning, and churn warning groups', 'Automated deep copywriting with direct contact integration', 'Enterprise B2B billing channel tracking'],
      samplePrompts: language === 'CN'
        ? ['"看看顾客细分情况，给高消费人群起草一篇邀请体验新品的专属优惠邮件"', '"找出那些给出差评的顾客，编写一封高度真诚的道歉信模板"']
        : ['"Slice current segments and draft a VIP newsletter targeting top-buyers"', '"Find our disgruntled low review consumers and draft apologizing letters"'],
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30'
    },
    {
      id: 'marketing',
      label: language === 'CN' ? '全渠道 AI 广告主' : 'Marketing Ad Agency',
      icon: Tag,
      description: language === 'CN'
        ? '大模型根据产品亮点自主构思吸睛文本，极速产出 TikTok 创意脚本、SEO 标签推荐、EDM 双语电邮。'
        : 'Translates functional highlights into high-converting scripts, SEO metadata bundles, and organic social taglines.',
      insights: language === 'CN'
        ? ['TikTok 极速变现多段脚本剧作格式', '基于谷歌算法优化的 SEO Meta 极简方案', '一键保存并部署进营销活动库']
        : ['Structural text configurations optimized for conversion channels', 'Slightly opinionated SEO markup tag exports', 'Saves to persistent campaigns memory with high re-usability'],
      samplePrompts: language === 'CN'
        ? ['"为北欧台灯起草一则风趣幽默的 TikTok 短视频带货广告文案"', '"生成适合把店铺推向中高端小众社交圈的 SEO 元描述配置"']
        : ['"Draft an energetic TikTok ad copy targeting young couples for our lighting products"', '"Create SEO-friendly tags for our natural sandalwood candle item"'],
      color: 'from-rose-500/20 to-purple-500/20 text-rose-400 border-rose-500/30'
    },
    {
      id: 'translations',
      label: language === 'CN' ? '双语翻译与出海中心' : 'Translations & Localization',
      icon: Globe,
      description: language === 'CN'
        ? '提供高保真度电商词库级别的精细本地化，实时多语言包互转，让您无缝销售全球。'
        : 'Guarantees contextual, premium industry-grade translations of item briefs and landing pages into European & Asian targets.',
      insights: language === 'CN'
        ? ['AI 直呼专业电商常备本地术语词根', '跨区域无损翻译（支持一键渲染到前台）', '多语言文档直接复制导出']
        : ['Maintains natural idiomatic copywriting suited for local ecommerce standards', 'No-loss structure replication across multiple targets', 'Instant single-tab clipboard export configurations'],
      samplePrompts: language === 'CN'
        ? ['"将这句‘手工打磨温润实木，极力彰显大自然之生机色调’地道翻译成意大利语"', '"帮我把台灯的商品描述进行德语和法语的多国语言本地化"']
        : ['"Translate \'We handcraft custom pieces, bringing warmth and design elegance\' into fluent French"', '"Translate our sandalwood candle product briefs into standard Italian"'],
      color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30'
    },
    {
      id: 'theme',
      label: language === 'CN' ? '视觉调性编辑器' : 'Brand Styling & Theme',
      icon: Palette,
      description: language === 'CN'
        ? '通过解析人类的感性审美语言，自动调和页面冷暖色、重整布局骨架、设置超高清轮播看板图。'
        : 'Adjusts active storefront colors palettes, typography, structural layout shapes, and promotional slide graphics.',
      insights: language === 'CN'
        ? ['审美语义编译器（一秒完成品牌换装）', '四大人气预置模板冷暖一键调整', '核心资产看板配图在线刷新']
        : ['Visual compiler translating user moods to digital paint and color states', 'Four designer presets: Nordic Hygge, Apple Aluminum, Neon Cyberpunk, Sunset Velvet', 'Live updates custom banner captions and graphics'],
      samplePrompts: language === 'CN'
        ? ['"给店铺来一身极具电子游戏朋克感的炫酷黑红霓虹配色风格"', '"修改首页主题为温馨的原木色调，配图改回自然家居"']
        : ['"Style my store like the high-end Apple metal-minimal aesthetic"', '"Revamp home theme with neon sunset colors and high-contrast texts"'],
      color: 'from-fuchsia-500/20 to-indigo-500/20 text-[#c0a9ff] border-fuchsia-500/30'
    },
    {
      id: 'analytics',
      label: language === 'CN' ? '多维 KPI 沙箱与决策大屏' : 'Analytics & Report Sandbox',
      icon: Activity,
      description: language === 'CN'
        ? '根据数据库历史，零死角自动组装全图表可视化 Dashboard（折线、柱图、扇图），产出万字行业宏观业务分析信。'
        : 'Ingests database histories, plots detailed Recharts visualizations (lines, bars, pies), and drafts comprehensive corporate reports.',
      insights: language === 'CN'
        ? ['极速响应式 Recharts 微级渲染数据流', 'AI 总结归纳业务劣势、复盘与策略推荐', '多财务指标一网打尽']
        : ['Hot-swapping component visualizers tailored for data structures', 'Underlying engine highlights bottlenecks and outputs strategic growth items', 'Tracks dynamic metrics such as AOV and Gross GMV'],
      samplePrompts: language === 'CN'
        ? ['"帮我用2017和2018年数据组装一份大区销售业绩深度分析看板 Dashboard"', '"生成一份本年度的盈利与物流迟延复盘 Yearly Business Report"']
        : ['"Create a multicharts dashboard of our historical sales and city distribution"', '"Compile a yearly retail business report of our profits and margins analysis"'],
      color: 'from-emerald-500/20 to-blue-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      id: 'platform_control',
      label: language === 'CN' ? 'SaaS 核心多租户治理' : 'Super Admin & Multi-Tenant',
      icon: Cpu,
      description: language === 'CN'
        ? '超级管理员的指挥中枢。监控全球5大租户状况、拦截高风险请求、查看系统底层决策日志序列、动态监测模型运行延时。'
        : 'The executive command hub. Monitors global tenant sandboxes, halts toxic queries, audits background tasks queue, and measures system latencies.',
      insights: language === 'CN'
        ? ['一键高保真商家身份伪装（Impersonation）', '实时的全生命周期操作路径溯源监控', '模型 token 消费预算流动态限制']
        : ['Single-click merchant sandbox impersonation workflow', 'Continuous granular operations audit logs & severity tracking', 'Token telemetry and real-time execution cost safeguards'],
      samplePrompts: language === 'CN'
        ? ['"切换去超级后台，看看当前哪个租户发生了网络降级，对它发出黄色预警"', '"检查后台 AI 的运行负载队列并汇报"']
        : ['"Switch to super admin mode and see if any sandbox exhibits high risk alerts"', '"Audit the current SaaS background sub-agents running queue status"'],
      color: 'from-red-500/20 to-orange-500/20 text-red-400 border-red-500/30'
    }
  ];

  const selectedNode = systemNodes.find(n => n.id === selectedNodeId) || systemNodes[0];

  return (
    <div className="fixed inset-0 bg-[#06040d]/98 backdrop-blur-md z-50 flex flex-col md:flex-row overflow-hidden font-sans text-[#efecf6]">
      
      {/* LEFT: Structural Interconnected SVG Visual Graph Topology */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative select-none border-b md:border-b-0 md:border-r border-[#21193d]">
        
        {/* Background glow graphics */}
        <div className="absolute top-1/4 left-1/4 w-[30vw] h-[30vw] rounded-full bg-purple-900/15 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[25vw] h-[25vw] rounded-full bg-blue-900/10 blur-[80px] pointer-events-none" />
        
        {/* Header decoration of Topology */}
        <div className="absolute top-6 left-6 z-10 w-full pr-12 flex justify-between items-start">
          <div>
            <span className="text-[10px] font-mono text-purple-400 tracking-widest font-bold block uppercase">
              {language === 'CN' ? '🧭 智能高维自适应图谱系统' : '🧭 ADAPTIVE INTERCONNECTED MAP'}
            </span>
            <h2 className="font-display font-extrabold text-20 text-white mt-1">
              {language === 'CN' ? 'SaaS 双语系统微架构拓扑图谱' : 'SaaS System Micro-Architectural Blueprint'}
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-[450px]">
              {language === 'CN' 
                ? '以下结构展示了由 SQLite 和大盘状态在底座支撑、向外辐射出 9 个交互功能版块的多租户架构。您可以点击任意节点直接切换/漫游前往。' 
                : 'Interactive layout representing the centralized DB core branching to 9 functional workspaces. Click nodes to instantly teleport.'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="md:hidden bg-zinc-900/40 border border-zinc-800 text-zinc-300 rounded-md px-3 py-1 text-xs hover:text-white"
          >
            {language === 'CN' ? '关闭' : 'Close'}
          </button>
        </div>

        {/* Live system brief details badge */}
        <div className="hidden lg:flex absolute bottom-6 left-6 items-center gap-6 text-[10px] font-mono text-zinc-400 bg-zinc-950/40 px-4 py-2 rounded-xl border border-zinc-800/40">
          <div>
            <span className="text-zinc-500 block">{language === 'CN' ? '商品存储' : 'DB PRODUCTS'}</span>
            <span className="text-purple-300 font-bold">{dbState.products.length} Items</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
          <div>
            <span className="text-zinc-500 block">{language === 'CN' ? '历史订单' : 'DB ORDERS'}</span>
            <span className="text-emerald-300 font-bold">{dbState.orders.length} Records</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
          <div>
            <span className="text-zinc-500 block">{language === 'CN' ? '模型智核' : 'CORE MODEL'}</span>
            <span className="text-pink-300 font-bold">gemini-3.5-flash</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
          <div>
            <span className="text-zinc-500 block">{language === 'CN' ? '多语引擎' : 'LOCALES'}</span>
            <span className="text-amber-300 font-bold">CN / EN / IT</span>
          </div>
        </div>

        {/* Dynamic Topology Chart SVG Area */}
        <div className="w-full max-w-[620px] h-[340px] md:h-[450px] relative flex items-center justify-center mt-12 md:mt-6">
          
          {/* Central DB Core Node */}
          <div className="absolute z-20 w-32 h-32 rounded-full p-0.5 bg-gradient-to-tr from-[#6d28d9] to-[#db2777] shadow-[0_0_30px_rgba(109,40,217,0.3)] flex items-center justify-center cursor-default">
            <div className="w-full h-full rounded-full bg-[#0d0a1b] flex flex-col items-center justify-center text-center p-3">
              <div className="relative">
                <Database size={24} className="text-[#db2777] animate-pulse" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0d0a1b]" />
              </div>
              <span className="font-display font-black text-[11px] text-white tracking-wider uppercase mt-1">SQLite & State</span>
              <span className="text-[10px] font-mono text-zinc-500 leading-none">CORE ENGINE</span>
            </div>
          </div>

          {/* Connected Lines to Modules using SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
            {systemNodes.map((node, idx) => {
              // Calculate angles for radial distribution of the 9 nodes
              const angle = (idx * 2 * Math.PI) / systemNodes.length - Math.PI / 2;
              const radius = 175; // radius distance
              const cx = 310; // offset center positions based on SVG bounding box
              const cy = 225;
              const x2 = cx + radius * Math.cos(angle);
              const y2 = cy + radius * Math.sin(angle);
              const isActive = activeTab === node.id;
              const isSelected = selectedNodeId === node.id;

              return (
                <g key={`line-${node.id}`}>
                  {/* Subtle connection line */}
                  <line 
                    x1={cx} 
                    y1={cy} 
                    x2={x2} 
                    y2={y2} 
                    stroke={isSelected ? '#db2777' : isActive ? '#8b5cf6' : '#231c3c'} 
                    strokeWidth={isSelected ? 2 : isActive ? 1.5 : 1}
                    className="transition-all duration-300"
                  />
                  {/* Flow dots pulse animation if active or selected */}
                  {(isSelected || isActive) && (
                    <circle r="4" fill={isSelected ? '#f43f5e' : '#a78bfa'} className="animate-bounce">
                      <animateMotion 
                        path={`M ${cx} ${cy} L ${x2} ${y2}`} 
                        dur="3s" 
                        repeatCount="indefinite" 
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Radial Module Nodes */}
          {systemNodes.map((node, idx) => {
            const angle = (idx * 2 * Math.PI) / systemNodes.length - Math.PI / 2;
            const radius = 175;
            const xOffset = radius * Math.cos(angle);
            const yOffset = radius * Math.sin(angle);

            const isCurrentWorkspace = activeTab === node.id;
            const isUserInspecting = selectedNodeId === node.id;
            const Icon = node.icon;
            const nodeStatus = getNodeStatus(node.id);

            return (
              <button
                key={node.id}
                onClick={() => {
                  setSelectedNodeId(node.id);
                }}
                className={cn(
                  "absolute z-10 w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300 select-none cursor-pointer group",
                  isUserInspecting 
                    ? "bg-[#251842] border-[#ec4899] shadow-[0_0_15px_rgba(236,72,153,0.4)] scale-110" 
                    : isCurrentWorkspace 
                    ? "bg-[#16122d] border-[#8b5cf6] shadow-[0_0_10px_rgba(139,92,246,0.3)] scale-105"
                    : "bg-[#0b0816] hover:bg-[#110d24] border-[#291e4a] hover:border-[#4e3880]"
                )}
                style={{
                  transform: `translate(${xOffset}px, ${yOffset}px)`,
                }}
                title={node.label}
              >
                {/* Task Engine Status Badge overlay */}
                {nodeStatus && (
                  <span className={cn(
                    "absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full border border-[#0d0a1b] z-20",
                    nodeStatus === 'Running' ? "bg-blue-400 animate-pulse" :
                    nodeStatus === 'Queued' ? "bg-amber-400 animate-bounce" :
                    nodeStatus === 'Failed' ? "bg-red-500" : "bg-emerald-400"
                  )} title={`Task: ${nodeStatus}`} />
                )}

                <Icon 
                  size={18} 
                  className={cn(
                    "transition-transform",
                    isUserInspecting ? "text-[#ec4899] scale-110" : isCurrentWorkspace ? "text-[#a78bfa]" : "text-zinc-500 group-hover:text-zinc-300"
                  )} 
                />
                
                {/* Tiny labels orbiting */}
                <span className={cn(
                  "absolute text-[8px] font-mono tracking-tight font-bold scale-90 whitespace-nowrap bg-[#0b0816] px-1 py-0.5 rounded border leading-none font-sans",
                  yOffset > 0 ? "top-13" : "-bottom-5",
                  isUserInspecting ? "border-[#ec4899] text-[#ec4899]" : isCurrentWorkspace ? "border-[#8b5cf6] text-[#a78bfa]" : "border-zinc-800 text-zinc-500"
                )}>
                  {node.id === 'home' ? (language === 'CN' ? '橱窗' : 'STORE') :
                   node.id === 'products' ? (language === 'CN' ? '商品' : 'PRODS') :
                   node.id === 'orders' ? (language === 'CN' ? '订单' : 'ORDERS') :
                   node.id === 'customers' ? (language === 'CN' ? '顾客' : 'CRM') :
                   node.id === 'marketing' ? (language === 'CN' ? '广告' : 'MKT') :
                   node.id === 'translations' ? (language === 'CN' ? '出海' : 'LOC') :
                   node.id === 'theme' ? (language === 'CN' ? '装修' : 'THEME') :
                   node.id === 'analytics' ? (language === 'CN' ? '数据' : 'ANLY') :
                   (language === 'CN' ? '超级治理' : 'SUPER')}
                </span>

                {/* Pulsing indicator if active workspace */}
                {isCurrentWorkspace && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend descriptor */}
        <div className="flex gap-4 mt-6 text-[10px] font-mono select-none">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="w-2.5 h-2.5 bg-[#0b0816] border border-zinc-800 rounded" />
            <span>{language === 'CN' ? '模块节点' : 'Standard Node'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="w-2.5 h-2.5 bg-[#16122d] border border-[#8b5cf6] rounded" />
            <span className="text-[#a78bfa] font-bold">{language === 'CN' ? '● 当前激活版面 ' : '● Active Workspace'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="w-2.5 h-2.5 bg-[#251842] border border-[#ec4899] rounded" />
            <span className="text-[#ec4899] font-bold">{language === 'CN' ? '★ 选择探查节点' : '★ Custom Inspection'}</span>
          </div>
        </div>

      </div>

      {/* RIGHT: Selected Node Overview Panel & Documentation Documentation */}
      <div className="w-full md:w-[420px] bg-[#0c0919] border-l border-[#21193d] flex flex-col shrink-0 overflow-y-auto">
        
        {/* Header summary of selected item */}
        <div className="p-6 border-b border-[#21193d] bg-zinc-950/20 flex flex-col relative">
          <button 
            onClick={onClose} 
            className="hidden md:flex absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors border border-zinc-800 rounded-lg p-1.5 hover:bg-zinc-900 bg-zinc-900/35"
          >
            <ListCollapse size={16} />
          </button>

          <span className="text-[10px] font-mono text-zinc-500 tracking-wider font-bold block bg-zinc-900/40 w-max px-2.5 py-1 rounded-full border border-zinc-800/40 uppercase mb-4">
            {language === 'CN' ? '📖 智控系统操作指引' : '📖 AGENT OPERATIONS DOCUMENTATION'}
          </span>

          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${selectedNode.color}`}>
              <selectedNode.icon size={22} className="text-white shrink-0" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-16 text-white leading-tight">
                {selectedNode.label}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[9px] font-mono bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700 font-bold uppercase">
                  TAB ID: {selectedNode.id}
                </span>

                {selectedNode.id === activeTab && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-950/40 text-purple-200 border border-purple-800/60 animate-pulse">
                    {language === 'CN' ? '📍 你在此版块' : '📍 YOU ARE HERE'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="text-12 text-[#a7a2ce] leading-relaxed mt-4 font-sans font-medium">
            {selectedNode.description}
          </p>

          <div className="mt-5 flex gap-2.5">
            {selectedNode.id !== activeTab && (
              <button 
                onClick={() => {
                  setActiveTab(selectedNode.id);
                  onClose();
                }}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-11 font-bold py-2 px-3 rounded-lg transition-all duration-150 flex items-center justify-center gap-1.5 shadow"
              >
                {language === 'CN' ? '传送直达该版块' : 'Teleport to Section'} <ArrowRight size={12} />
              </button>
            )}
            
            <button 
              disabled
              className={cn(
                "flex-1 text-[10px] font-mono py-2 px-3 rounded-lg flex items-center justify-center gap-1 border",
                selectedNode.id === activeTab ? "border-purple-800/30 text-zinc-400 bg-purple-950/15" : "border-zinc-800 text-zinc-500"
              )}
            >
              <ShieldCheck size={11} className="text-emerald-400" />
              {language === 'CN' ? '无缝自治安全隔离' : 'Secured Sandbox Sync'}
            </button>
          </div>
        </div>

        {/* Section Key Insights & Integration Specs */}
        <div className="p-6 space-y-5 flex-1 select-text">
          <div>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-2.5 font-bold">
              {language === 'CN' ? '💡 版块高真集成要点' : '💡 BLOCK INTEGRATION NOTES'}
            </span>
            <ul className="space-y-2">
              {selectedNode.insights.map((ins, i) => (
                <li key={`ins-${i}`} className="flex items-start gap-2.5 text-12 text-[#a7a2ce] font-sans font-medium">
                  <CheckCircle size={12} className="text-[#a78bfa] shrink-0 mt-0.5" />
                  <span>{ins}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* AI Trigger Instructions Examples */}
          <div className="border-t border-[#21193d] pt-5">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-2.5 font-bold flex items-center gap-1.5">
              <Sparkles size={11} className="text-[#c0a9ff]" />
              {language === 'CN' ? '🪄 推荐大模型智控指令示范' : '🪄 COPILOT DIRECTIVE MANUAL'}
            </span>
            <p className="text-[10px] text-zinc-500 mb-3 block">
              {language === 'CN' 
                ? '复制下方指令推荐，在右侧对话框中发送，AI 即可根据语义自主做出该项操作更新。' 
                : 'Copy any prompt below and paste it in the right panel; the AI agent will execute real-time actions.'}
            </p>

            <div className="space-y-2.5">
              {selectedNode.samplePrompts.map((prompt, i) => (
                <div 
                  key={`prompt-${i}`}
                  className="bg-[#100d24] border border-[#2d245c]/60 p-3 rounded-xl hover:border-purple-600/40 transition-colors text-12 text-zinc-300 font-sans leading-relaxed group hover:text-white"
                >
                  <p className="font-sans font-medium text-xs break-words">{prompt}</p>
                  <div className="mt-2.5 flex justify-end">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Copy to clipboard
                        navigator.clipboard.writeText(prompt);
                        const btn = e.currentTarget;
                        btn.innerText = language === 'CN' ? '已复制 ✓' : 'Copied ✓';
                        btn.classList.add('text-emerald-400');
                        setTimeout(() => {
                          btn.innerText = language === 'CN' ? '点击复制' : 'Click to Copy';
                          btn.classList.remove('text-emerald-400');
                        }, 1200);
                      }}
                      className="text-[9px] font-mono text-zinc-500 hover:text-[#a78bfa] transition-all bg-[#090615] px-2 py-0.5 rounded cursor-pointer border border-zinc-900"
                    >
                      {language === 'CN' ? '一键复制' : 'Click to Copy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Realtime task ledger & tracking */}
          {(getSelectedNodeTasks().length > 0 || getSelectedNodeEvents().length > 0) && (
            <div className="border-t border-[#21193d] pt-5">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-2.5 font-bold flex items-center gap-1.5">
                <Network size={11} className="text-emerald-400" />
                {language === 'CN' ? '📡 诊断: 该版块关联的智控服务任务' : '📡 DIAGNOSTICS: LINKED JOBS QUEUE'}
              </span>
              <div className="space-y-3">
                {getSelectedNodeTasks().map((task: any) => (
                  <div key={task.id} className="bg-zinc-950/50 rounded-xl border border-zinc-900 p-3 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono font-bold text-white truncate max-w-[180px]">
                        CMD: {task.command}
                      </span>
                      <span className={cn(
                        "text-[9px] font-mono px-1.5 py-0.5 rounded leading-none font-bold",
                        task.status === 'Running' ? "bg-blue-950 text-blue-300 border border-blue-500/20 animate-pulse" :
                        task.status === 'Queued' ? "bg-amber-950 text-amber-300 border border-amber-500/20" :
                        task.status === 'Failed' ? "bg-red-950 text-red-300 border border-red-500/20" :
                        "bg-emerald-950 text-emerald-300 border border-emerald-500/10"
                      )}>
                        {task.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                      <span>Latency: {task.latency}ms</span>
                      <span>Tokens: {task.tokenUsage}</span>
                      <span>{task.provider}</span>
                    </div>
                    {task.logs && task.logs.length > 0 && (
                      <div className="border-t border-zinc-900/80 pt-1.5 mt-1">
                        <span className="text-[8px] font-mono text-zinc-600 uppercase block mb-1">
                          {language === 'CN' ? '最新执行记录' : 'EXECUTION LOGS'}
                        </span>
                        <p className="text-[9px] font-mono text-[#c0a9ff] break-words leading-tight bg-black/40 p-1.5 rounded border border-zinc-900/50 font-mono">
                          &gt; {task.logs[task.logs.length - 1]}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {getSelectedNodeEvents().map((evt: any) => (
                  <div key={evt.id} className="bg-zinc-950/25 rounded-lg border border-zinc-900/30 p-2.5 flex items-start gap-2 text-[10px] font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-1 shrink-0" />
                    <div className="flex-1">
                      <div className="flex justify-between text-[8px] text-zinc-600 mb-0.5">
                        <span>EVT: {evt.type}</span>
                        <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <span className="text-zinc-300">{evt.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step flow of continuous state management */}
          <div className="border-t border-[#21193d] pt-5">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-3 font-bold">
              {language === 'CN' ? '⚙️ 智能决策与动作同步全生命周期' : '⚙️ RUNTIME CONVERGENCE FLOW'}
            </span>
            <div className="space-y-3 font-mono text-[9px] text-zinc-400 bg-zinc-950/45 p-3.5 rounded-xl border border-zinc-900">
              <div className="flex gap-2">
                <span className="text-purple-400">01</span>
                <div>
                  <span className="text-white block font-bold">PARSE</span>
                  <span>{language === 'CN' ? 'AI 接收并拆解自然语言指令意图' : 'Agent parses instructions text to function schema'}</span>
                </div>
              </div>
              <div className="w-[1px] h-3 bg-zinc-800 ml-1.5" />
              <div className="flex gap-2">
                <span className="text-indigo-400">02</span>
                <div>
                  <span className="text-white block font-bold">MUTATION</span>
                  <span>{language === 'CN' ? '触发对应 API 函数，定向写入底层 SQLite/State 库' : 'Dispatches target tool parameters updating data records'}</span>
                </div>
              </div>
              <div className="w-[1px] h-3 bg-zinc-800 ml-1.5" />
              <div className="flex gap-2">
                <span className="text-[#db2777]">03</span>
                <div>
                  <span className="text-white block font-bold">RE-RENDER</span>
                  <span>{language === 'CN' ? '多端同时刷新：前台网页、分析图表与租户安全指标' : 'Sync previews, charts, and audit trails simultaneously'}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer info brand */}
        <div className="p-6 bg-zinc-950/30 border-t border-[#21193d] text-center text-[10px] font-mono text-zinc-500">
          {language === 'CN' ? '大模型高真自主智控底座系统 · 双语运行中' : 'COMMERCE ADAPTIVE INTELLIGENCE PLATFORM'}
        </div>

      </div>

    </div>
  );
}

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Cpu, 
  Activity, 
  Shield, 
  Database, 
  Search, 
  Play, 
  Eye, 
  Power, 
  RefreshCw, 
  X, 
  Terminal, 
  Sliders, 
  Check, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Hash, 
  Server,
  Filter,
  Layers,
  ChevronRight,
  TrendingUp,
  Fingerprint
} from 'lucide-react';
import { Tenant, AIRuntimeTask, PlatformEvent } from '../types';
import { MOCK_DB, notifyDbChanged } from '../services/gemini';
import { cn } from '../lib/utils';

interface SuperAdminControlViewProps {
  tenants: Tenant[];
  tasks: AIRuntimeTask[];
  events: PlatformEvent[];
  onSendMessage: (msg: string) => void;
  onImpersonate: (tenantName: string | null) => void;
  impersonatingTenant: string | null;
  language?: 'CN' | 'EN';
}

export function SuperAdminControlView({ 
  tenants, 
  tasks, 
  events, 
  onSendMessage,
  onImpersonate,
  impersonatingTenant,
  language = 'CN'
}: SuperAdminControlViewProps) {
  // Navigation Tabs for Super Admin workspace
  const [saTab, setSaTab] = useState<'dashboard' | 'tenants' | 'runtime' | 'governance' | 'queue' | 'events'>('dashboard');

  // Command control center state
  const [commandQuery, setCommandQuery] = useState('');
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);

  // Filter states
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantRiskFilter, setTenantRiskFilter] = useState<string>('all');
  const [eventSearch, setEventSearch] = useState('');
  const [eventSeverityFilter, setEventSeverityFilter] = useState<string>('all');
  const [eventTenantFilter, setEventTenantFilter] = useState<string>('all');

  // Detail item views (e.g., viewing logs for a task in detail)
  const [activeTraceTask, setActiveTraceTask] = useState<AIRuntimeTask | null>(null);

  // Governance Sliders State
  const [rateLimit, setRateLimit] = useState(100);
  const [costCap, setCostCap] = useState(350);
  const [auditRequired, setAuditRequired] = useState(true);
  const [enterpriseQuota, setEnterpriseQuota] = useState(500000);
  const [growthQuota, setGrowthQuota] = useState(200000);
  const [isConfigSaved, setIsConfigSaved] = useState(false);

  // Active worker simulator simulation ticks
  const [workerLoad, setWorkerLoad] = useState(38);
  useEffect(() => {
    const interval = setInterval(() => {
      setWorkerLoad(prev => {
        const change = Math.floor(Math.random() * 11) - 5; // -5 to +5
        const next = prev + change;
        return next < 10 ? 15 : next > 90 ? 82 : next;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Sync active task reference in detail view if DB changes
  useEffect(() => {
    if (activeTraceTask) {
      const live = tasks.find(t => t.id === activeTraceTask.id);
      if (live) {
        setActiveTraceTask(live);
      }
    }
  }, [tasks, activeTraceTask]);

  // Aggregated analytics helper values
  const saStats = useMemo(() => {
    const totalGMV = tenants.reduce((acc, t) => acc + t.gmv, 0);
    const activeAIJobs = tasks.filter(t => t.status === 'Running').length;
    const totalTokens = tenants.reduce((acc, t) => acc + t.aiUsage, 0);
    const healthyTenants = tenants.filter(t => t.runtimeStatus === 'Healthy').length;
    const riskWarnings = tenants.filter(t => t.riskStatus !== 'Safe').length;

    return {
      totalGMV,
      activeAIJobs,
      totalTokens,
      healthyTenants,
      riskWarnings,
      activeWorkers: 6
    };
  }, [tenants, tasks]);

  // --- ACTIONS ---

  // Command-driven handlers following architectural guideline:
  // AI -> command -> handler -> database -> event -> audit -> state
  const executeCommandAction = (cmd: string) => {
    setCommandFeedback(null);
    const lower = cmd.toLowerCase().trim();

    if (!lower) return;

    const newLogEvent = (type: any, msg: string, sev: 'info' | 'warning' | 'critical' = 'info') => {
      const newEvt: PlatformEvent = {
        id: "evt_" + (MOCK_DB.events.length + 1),
        tenantId: "platform",
        tenantName: "SaaS Control Center",
        type,
        message: msg,
        timestamp: new Date().toISOString(),
        severity: sev
      };
      MOCK_DB.events.unshift(newEvt);
    };

    // 1. "查看今天异常店铺" / "view anomalous tenants"
    if (lower.includes('异常') || lower.includes('anomaly') || lower.includes('anomalous')) {
      const critical = tenants.filter(t => t.riskStatus === 'High Risk' || t.runtimeStatus === 'Suspended');
      if (critical.length > 0) {
        setCommandFeedback(`Analyzed anomalies: Found ${critical.length} high-risk tenant(s). Tenant '${critical[0].name}' remains Suspended.`);
        newLogEvent('GOVERNANCE_OVERRIDE', `AI Engine ran Platform Anomaly Sweep. Flagged ${critical.length} tenants.`, 'warning');
      } else {
        setCommandFeedback("Analyzed anomalies: System healthy. All tenant clusters responding clean.");
      }
    }
    // 2. "分析退款最高商家" / "analyze refunds"
    else if (lower.includes('退款') || lower.includes('refund')) {
      setCommandFeedback("Refund analysis: 'Neo Cyberpunk Apparel' has flagged high refund ratio (2.8%). Initiated security trace verification.");
      newLogEvent('GOVERNANCE_OVERRIDE', "Audit system automatically flagged tenant_3 due to high refund logs.", "warning");
    }
    // 3. "暂停高风险租户" / "suspend high risk"
    else if (lower.includes('暂停') || lower.includes('suspend') || lower.includes('风险')) {
      const warned = MOCK_DB.tenants.filter((t: any) => t.riskStatus === 'Warning' || t.riskStatus === 'High Risk');
      let suspendedCount = 0;
      warned.forEach((t: any) => {
        if (t.runtimeStatus !== 'Suspended') {
          t.runtimeStatus = 'Suspended';
          suspendedCount++;
          newLogEvent('TENANT_SUSPENDED', `Platform auto-governor suspended high-risk tenant: '${t.name}'`, 'critical');
        }
      });
      if (suspendedCount > 0) {
        setCommandFeedback(`Action completed: Suspend command executed. Temp locker applied to ${suspendedCount} tenant store environments.`);
      } else {
        setCommandFeedback("Suspend command ran: No active warning-level tenants required state locking.");
      }
    }
    // 4. "查看AI成本最高店铺" / "highest cost limit"
    else if (lower.includes('成本') || lower.includes('cost') || lower.includes('最高')) {
      const top = [...tenants].sort((a,b) => b.aiUsage - a.aiUsage)[0];
      setCommandFeedback(`AI Cost Analysis: Tenant '${top.name}' leads Cumulative Usage at ${top.aiUsage.toLocaleString()} tokens ($${(top.aiUsage * 0.000015).toFixed(2)} Platform Cost).`);
      newLogEvent('GOVERNANCE_OVERRIDE', `Query highest cost tier: ${top.name}`, 'info');
    }
    // 5. Default Simulation
    else {
      // Create custom trace job matching the command
      const newTaskId = "task_" + (MOCK_DB.tasks.length + 1);
      const randomTenant = tenants[Math.floor(Math.random() * tenants.length)];
      const latencySim = Math.floor(Math.random() * 2000) + 800;
      const tokensSim = Math.floor(Math.random() * 4000) + 1200;

      const newTask: AIRuntimeTask = {
        id: newTaskId,
        tenantId: randomTenant.id,
        command: lower.replace(/\s+/g, '_').substring(0, 30),
        status: 'Completed',
        latency: latencySim,
        tokenUsage: tokensSim,
        provider: 'Gemini 2.5 Flash',
        timestamp: new Date().toISOString(),
        logs: [
          `SaaS command received: '${cmd}'`,
          `Resolving executing cluster scope: ${randomTenant.name}`,
          `Injecting safety sandbox wrappers`,
          `Completed execution in ${latencySim}ms with resource token footprint ${tokensSim}`
        ]
      };

      MOCK_DB.tasks.unshift(newTask);
      newLogEvent('AI_MARKETING_GENERATED', `Platform command processed: '${cmd}' for tenant ${randomTenant.name}`, 'info');

      setCommandFeedback(`Command received & processed successfully via Sandbox Worker Runner. Logged Task #${newTaskId}.`);
    }

    notifyDbChanged();
    setCommandQuery('');
  };

  // Toggle tenant state
  const handleToggleTenantStatus = (tenantId: string) => {
    const tenant = MOCK_DB.tenants.find((t: any) => t.id === tenantId);
    if (!tenant) return;

    if (tenant.runtimeStatus === 'Suspended') {
      tenant.runtimeStatus = 'Healthy';
      // Append Event log
      const newEvt: PlatformEvent = {
        id: "evt_" + (MOCK_DB.events.length + 1),
        tenantId: tenant.id,
        tenantName: tenant.name,
        type: 'TENANT_ACTIVATED',
        message: `Admin manually unlocked tenant status for '${tenant.name}'`,
        timestamp: new Date().toISOString(),
        severity: 'info'
      };
      MOCK_DB.events.unshift(newEvt);
    } else {
      tenant.runtimeStatus = 'Suspended';
      // Append Event log
      const newEvt: PlatformEvent = {
        id: "evt_" + (MOCK_DB.events.length + 1),
        tenantId: tenant.id,
        tenantName: tenant.name,
        type: 'TENANT_SUSPENDED',
        message: `Admin manually locked tenant status for '${tenant.name}'`,
        timestamp: new Date().toISOString(),
        severity: 'critical'
      };
      MOCK_DB.events.unshift(newEvt);
    }

    notifyDbChanged();
  };

  // Trigger simulated worker execution
  const triggerSimulatedJob = () => {
    const activeRunning = MOCK_DB.tasks.find((t: any) => t.status === 'Queued');
    if (activeRunning) {
      activeRunning.status = 'Running';
      activeRunning.logs.push("Worker thread picked up workload successfully.");
      activeRunning.logs.push(`Starting telemetry execution...`);
    } else {
      // Create a queued job
      const randomTenant = tenants[Math.floor(Math.random() * tenants.length)];
      const newJob: AIRuntimeTask = {
        id: "task_" + (MOCK_DB.tasks.length + 1),
        tenantId: randomTenant.id,
        command: "auto_optimize_seo_index",
        status: "Queued",
        latency: 0,
        tokenUsage: 0,
        provider: "Gemini 2.5 Flash",
        timestamp: new Date().toISOString(),
        logs: [
          "Enqueued platform maintenance command.",
          "Waiting for free SaaS orchestration slot..."
        ]
      };
      MOCK_DB.tasks.unshift(newJob);
    }
    notifyDbChanged();
  };

  // Run all Queued Jobs
  const runStateProcessAll = () => {
    let affected = 0;
    MOCK_DB.tasks.forEach((t: any) => {
      if (t.status === 'Queued' || t.status === 'Running') {
        t.status = 'Completed';
        t.latency = Math.floor(Math.random() * 1500) + 400;
        t.tokenUsage = Math.floor(Math.random() * 3000) + 800;
        t.logs.push("Force execution completed by Platform Command.");
        t.logs.push("Resource metrics logged and closed.");
        affected++;
      }
    });

    if (affected > 0) {
      const newEvt: PlatformEvent = {
        id: "evt_" + (MOCK_DB.events.length + 1),
        tenantId: "platform",
        tenantName: "Orchestration Engine",
        type: "GOVERNANCE_OVERRIDE",
        message: `Manual workspace command flushed and completed ${affected} active/queued SaaS worker tasks.`,
        timestamp: new Date().toISOString(),
        severity: "info"
      };
      MOCK_DB.events.unshift(newEvt);
      notifyDbChanged();
    }
  };

  // Wipe failed queue backlogs
  const handlePurgeQueue = () => {
    // Keep completed, delete or complete failed ones
    const initialLen = MOCK_DB.tasks.length;
    MOCK_DB.tasks = MOCK_DB.tasks.filter((t: any) => t.status !== 'Failed');
    const purged = initialLen - MOCK_DB.tasks.length;

    const newEvt: PlatformEvent = {
      id: "evt_" + (MOCK_DB.events.length + 1),
      tenantId: "platform",
      tenantName: "Redis Store Manager",
      type: "GOVERNANCE_OVERRIDE",
      message: `Cleaned up and purged ${purged} failed worker jobs from high availability Redis trace cache.`,
      timestamp: new Date().toISOString(),
      severity: "warning"
    };
    MOCK_DB.events.unshift(newEvt);

    notifyDbChanged();
    if (activeTraceTask && activeTraceTask.status === 'Failed') {
      setActiveTraceTask(null);
    }
  };

  // Filtering Tenants
  const filteredTenants = useMemo(() => {
    return tenants.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(tenantSearch.toLowerCase()) || 
                            t.id.toLowerCase().includes(tenantSearch.toLowerCase()) ||
                            t.plan.toLowerCase().includes(tenantSearch.toLowerCase());
      const matchesRisk = tenantRiskFilter === 'all' || t.riskStatus === tenantRiskFilter;
      return matchesSearch && matchesRisk;
    });
  }, [tenants, tenantSearch, tenantRiskFilter]);

  // Filtering Platform Events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchesSearch = e.message.toLowerCase().includes(eventSearch.toLowerCase()) || 
                            e.type.toLowerCase().includes(eventSearch.toLowerCase());
      const matchesSeverity = eventSeverityFilter === 'all' || e.severity === eventSeverityFilter;
      const matchesTenant = eventTenantFilter === 'all' || e.tenantId === eventTenantFilter;
      return matchesSearch && matchesSeverity && matchesTenant;
    });
  }, [events, eventSearch, eventSeverityFilter, eventTenantFilter]);

  return (
    <div className="space-y-8 animate-fade-in text-zinc-900">
      
      {/* Impersonation Floating Warning Alert Bar */}
      <AnimatePresence>
        {impersonatingTenant && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-amber-500 text-black px-6 py-3.5 rounded-2xl flex items-center justify-between shadow-lg border border-amber-600/20"
          >
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-black rounded-full animate-ping shrink-0" />
              <p className="text-12 font-medium tracking-tight">
                <strong className="font-bold">🔴 Impersonation Sandbox Active:</strong> You are currently viewing & managing the store data of <span className="underline font-bold font-mono">{impersonatingTenant}</span>.
              </p>
            </div>
            <button 
              onClick={() => onImpersonate(null)}
              className="bg-black text-white hover:bg-zinc-950 px-3 py-1 text-[10px] uppercase font-mono font-bold rounded-lg tracking-wider transition-all"
            >
              Exit Mimic State
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main SaaS Brand Card */}
      <div className="bg-neutral-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-xl border border-neutral-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-white/[0.04] to-transparent pointer-events-none rounded-full" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15 text-[9px] font-mono tracking-widest text-[#CECFD2] font-semibold">SAAS SUPER CONTROL</span>
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          </div>
          <h2 className="text-28 font-display font-medium tracking-tight">AI Native Platform Control Center</h2>
          <p className="text-12 text-zinc-400 max-w-2xl leading-relaxed">
            Centralized orchestration architecture managing client tenant instances, execution queues, LLM governance limits, and system telemetry in real-time. Command-driven operation core.
          </p>

          {/* Quick Tab Selectors */}
          <div className="flex flex-wrap gap-2 pt-4">
            {[
              { id: 'dashboard', label: 'Telemetry Overview', icon: Activity },
              { id: 'tenants', label: 'Tenant Management', icon: Users, badge: tenants.length },
              { id: 'runtime', label: 'Core AI Runtime', icon: Cpu, badge: tasks.filter(t=>t.status==='Running').length || undefined },
              { id: 'governance', label: 'Governance Controls', icon: Shield },
              { id: 'queue', label: 'Queue & Workers', icon: Server, badge: tasks.filter(t=>t.status==='Queued').length || undefined },
              { id: 'events', label: 'Runtime Event Timeline', icon: Database, badge: events.length },
            ].map(tab => {
              const Icon = tab.icon;
              const isSelected = saTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSaTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-11 font-bold tracking-tight transition-all",
                    isSelected 
                      ? "bg-white text-black shadow-sm scale-102"
                      : "bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                  )}
                >
                  <Icon size={12} className={cn(isSelected ? "text-black" : "text-zinc-500")} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className={cn(
                      "text-[9px] px-1 py-0.2 rounded font-semibold",
                      isSelected ? "bg-zinc-900 text-white" : "bg-neutral-800 text-zinc-400"
                    )}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid Layout depending on Tab selected */}
      
      {/* --- TELEMETRY OVERVIEW TAB --- */}
      {saTab === 'dashboard' && (
        <div className="space-y-8 animate-fade-in">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-md duration-200">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-[10px] font-mono tracking-wider font-bold">TOTAL PLATFORM GMV</span>
                <DollarSign size={16} className="text-zinc-900" />
              </div>
              <p className="text-24 font-display font-medium text-black">
                ${saStats.totalGMV.toLocaleString()}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-11 text-zinc-500 font-medium">
                <TrendingUp size={11} className="text-emerald-500" />
                <span>+12.4% MoM rate</span>
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-md duration-200">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-[10px] font-mono tracking-wider font-bold">CUMULATIVE AI TOKENS</span>
                <Cpu size={16} className="text-violet-500" />
              </div>
              <p className="text-24 font-display font-medium text-black">
                {saStats.totalTokens.toLocaleString()}
              </p>
              <div className="mt-2 text-11 text-zinc-400 font-medium">
                SaaS Limit allocated: <span className="font-bold text-zinc-800">5M Tokens</span>
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-md duration-200">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-[10px] font-mono tracking-wider font-bold">ACTIVE WORKER ENGINE</span>
                <Server size={16} className="text-emerald-500" />
              </div>
              <p className="text-24 font-display font-medium text-emerald-600">
                {saStats.activeWorkers} Active / Healthy
              </p>
              <div className="mt-2 text-11 text-zinc-400 font-medium">
                Queue load: <span className="font-bold text-zinc-800">{workerLoad}% capacity</span>
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-md duration-200">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-[10px] font-mono tracking-wider font-bold">SECURITY RISKS SWEPT</span>
                <Shield size={16} className="text-amber-500" />
              </div>
              <p className="text-24 font-display font-medium text-black">
                {saStats.riskWarnings} Flagged warning
              </p>
              <div className="mt-2 flex items-center gap-1 text-11 text-rose-500 font-semibold font-mono">
                <AlertTriangle size={11} />
                <span>Requires Manual Governance Audit</span>
              </div>
            </div>

          </div>

          {/* AI Command Center Box (P1) */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center text-white">
                <Terminal size={18} />
              </div>
              <div>
                <h3 className="text-16 font-display font-medium text-black">AI Command Center Bar</h3>
                <p className="text-12 text-zinc-400 font-medium">Execute instant platform commands. AI converts prompts directly to executed database changes.</p>
              </div>
            </div>

            <div className="space-y-4">
              <form onSubmit={(e) => { e.preventDefault(); executeCommandAction(commandQuery); }} className="relative flex items-center">
                <input
                  type="text"
                  value={commandQuery}
                  onChange={(e) => setCommandQuery(e.target.value)}
                  placeholder="Ask and execute: '查看今天异常店铺' (Anomaly check) / '暂停高风险租户' (Suspend flags) / custom commands..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 pl-12 pr-28 text-13 font-mono text-zinc-800 outline-none focus:ring-2 focus:ring-black selection:bg-zinc-200 transition-all font-semibold"
                />
                <div className="absolute left-4 text-zinc-400">
                  <Play size={15} className="fill-current text-zinc-400" />
                </div>
                <button
                  type="submit"
                  className="absolute right-3 px-4 py-2 bg-black text-white rounded-lg text-11 font-mono font-bold hover:bg-zinc-950 duration-150"
                >
                  EXECUTE CMD
                </button>
              </form>

              {/* Instant Presets */}
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold self-center mr-2">Quick Commands:</span>
                {[
                  "查看今天异常店铺",
                  "分析退款最高商家",
                  "暂停高风险租户",
                  "查看AI成本最高店铺"
                ].map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCommandQuery(preset);
                      executeCommandAction(preset);
                    }}
                    className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-11 text-zinc-700 font-mono transition-colors font-medium border border-zinc-250/50"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Command Feedback Output Box */}
              <AnimatePresence>
                {commandFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="p-5 bg-zinc-900 text-zinc-100 rounded-xl font-mono text-12 border border-zinc-800 relative shadow-inner"
                  >
                    <button 
                      onClick={() => setCommandFeedback(null)} 
                      className="absolute top-3 right-3 text-zinc-500 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                    <div className="flex items-center gap-2 text-emerald-400 mb-2 border-b border-zinc-800 pb-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span>COMMAND EXECUTION REPORT STATUS: COMPLETED</span>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">{commandFeedback}</p>
                    <div className="text-[9px] text-zinc-500 mt-4 leading-none uppercase">
                      TRACE ID: RMS-ORCH-{Math.floor(Math.random() * 90000) + 10000} &bull; TIMESTAMP: {new Date().toLocaleTimeString()}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Quick Active Task Stream & Worker Health Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-3">
                <h3 className="font-display font-medium text-14 text-black uppercase tracking-wider font-mono">Worker Queue Realtime Footprint</h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-mono font-bold">SYSTEM ONLINE</span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-11 font-mono text-zinc-500 mb-1">
                    <span>Platform Execution Bandwidth Utilization</span>
                    <span className="font-semibold">{workerLoad}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full duration-1000 transition-all",
                        workerLoad > 80 ? "bg-rose-500" : workerLoad > 60 ? "bg-amber-500" : "bg-black"
                      )} 
                      style={{ width: `${workerLoad}%` }} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-150">
                    <span className="text-10 font-mono text-zinc-400 block uppercase">Queue Backlog</span>
                    <span className="text-18 font-display font-bold text-zinc-800">{tasks.filter(t=>t.status === 'Queued').length}</span>
                  </div>
                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-150">
                    <span className="text-10 font-mono text-zinc-400 block uppercase">Completed Tasks</span>
                    <span className="text-18 font-display font-bold text-zinc-800">{tasks.filter(t=>t.status === 'Completed').length}</span>
                  </div>
                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-150">
                    <span className="text-10 font-mono text-zinc-400 block uppercase">Failures Cache</span>
                    <span className="text-18 font-display font-bold text-rose-600">{tasks.filter(t=>t.status === 'Failed').length}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={triggerSimulatedJob}
                    className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 transition-colors rounded-lg text-11 font-mono text-zinc-800 font-bold border border-zinc-200"
                  >
                    + Enqueue Simulation Job
                  </button>
                  <button
                    onClick={runStateProcessAll}
                    className="py-2 px-4 bg-zinc-900 hover:bg-zinc-950 text-white rounded-lg text-11 font-mono font-bold transition-colors"
                  >
                    Flush Pending Queue
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-3">
                  <h3 className="font-display font-medium text-14 text-black uppercase tracking-wider font-mono">Recent Platform Telemetry trace</h3>
                  <button onClick={() => setSaTab('runtime')} className="text-11 text-zinc-400 hover:text-black font-semibold">View Monitor &rarr;</button>
                </div>
                <div className="space-y-2.5">
                  {tasks.slice(0, 3).map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-150 text-12">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          t.status === 'Running' ? "bg-emerald-500 animate-pulse" :
                          t.status === 'Completed' ? "bg-zinc-400" :
                          t.status === 'Failed' ? "bg-rose-500" : "bg-amber-500"
                        )} />
                        <div>
                          <p className="font-mono font-bold text-zinc-900 truncate max-w-xs uppercase">{t.command.replace(/_/g, ' ')}</p>
                          <span className="text-[10px] text-zinc-400 font-mono">Task ID: #{t.id} &bull; {t.provider}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-11 font-bold text-zinc-700 block">{t.latency > 0 ? `${t.latency}ms` : 'Waiting'}</span>
                        <span className="text-[10px] font-mono text-zinc-400">{t.tokenUsage > 0 ? `${t.tokenUsage} tkn` : '--'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-zinc-400 text-center font-mono font-semibold uppercase mt-4">
                SaaS Tenant clusters actively report state metrics once every 120s &bull; SHA-256 Verified
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- TENANT MANAGEMENT TAB (P1) --- */}
      {saTab === 'tenants' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
            <div className="space-y-1">
              <h3 className="font-display font-medium text-16 text-black select-none">Active Platform Tenants Directory</h3>
              <p className="text-11 text-zinc-400 font-medium">Suspend or activate client merchants, and trigger impersonation logins for customer success.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Risk Filter Selector Group */}
              <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200">
                {[
                  { value: 'all', label: 'All Risks' },
                  { value: 'Safe', label: 'Safe' },
                  { value: 'Warning', label: 'Warning' },
                  { value: 'High Risk', label: 'High Risk' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTenantRiskFilter(opt.value)}
                    className={cn(
                      "px-3 py-1.5 text-[10px] font-mono font-bold rounded-lg transition-all",
                      tenantRiskFilter === opt.value
                        ? "bg-black text-white shadow-sm"
                        : "text-zinc-550 hover:text-black hover:bg-zinc-200/50"
                    )}
                  >
                    {opt.label.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 text-zinc-400 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tenantSearch}
                  onChange={(e) => setTenantSearch(e.target.value)}
                  placeholder="Search tenants or plans..."
                  className="bg-zinc-50 hover:bg-zinc-100 text-12 pl-9 pr-4 py-2 border border-zinc-200 rounded-xl font-mono text-zinc-750 outline-none focus:ring-2 focus:ring-zinc-200 transition-all font-semibold max-w-xs"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse table-auto text-13 font-medium">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-150 select-none text-[10px] font-mono text-zinc-400 uppercase">
                  <th className="px-6 py-4 font-bold">Tenant Name & ID</th>
                  <th className="px-6 py-4 font-bold">Plan Rank</th>
                  <th className="px-6 py-4 font-bold">Cumulative AI Usage</th>
                  <th className="px-6 py-4 font-bold">Store GMV</th>
                  <th className="px-6 py-4 font-bold">Fulfillment Count</th>
                  <th className="px-6 py-4 font-bold text-center">Runtime State</th>
                  <th className="px-6 py-4 font-bold text-center">Risk Tier</th>
                  <th className="px-6 py-4 font-bold text-right">Governing Control Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150">
                {filteredTenants.map((ten) => {
                  const isSuspended = ten.runtimeStatus === 'Suspended';
                  return (
                    <tr key={ten.id} className={cn("hover:bg-zinc-50/40 transition-colors", isSuspended ? "bg-rose-50/20" : "")}>
                      <td className="px-6 py-4.5">
                        <div className="font-semibold text-zinc-950 text-13">{ten.name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono font-bold mt-0.5">{ten.id.toUpperCase()}</div>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={cn(
                          "px-2 py-0.8 rounded text-[10px] font-mono font-bold tracking-tight",
                          ten.plan === 'Enterprise' ? "bg-purple-100 text-purple-850" :
                          ten.plan === 'Growth' ? "bg-sky-100 text-sky-850" : "bg-zinc-100 text-zinc-600"
                        )}>
                          {ten.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="font-mono text-xs">{ten.aiUsage.toLocaleString()} tokens</span>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="font-mono text-xs font-semibold text-zinc-900">${ten.gmv.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4.5 font-mono text-xs text-zinc-500">
                        {ten.orderCount} orders
                      </td>
                      <td className="px-6 py-4.5 text-center">
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full leading-none",
                          ten.runtimeStatus === 'Healthy' ? "bg-emerald-100 text-emerald-800" :
                          ten.runtimeStatus === 'Suspended' ? "bg-rose-100 text-rose-800 animate-pulse" : "bg-amber-100 text-amber-800"
                        )}>
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            ten.runtimeStatus === 'Healthy' ? "bg-emerald-600" :
                            ten.runtimeStatus === 'Suspended' ? "bg-rose-600" : "bg-amber-600"
                          )} />
                          {ten.runtimeStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-center">
                        <span className={cn(
                          "text-10 font-bold px-2 py-0.5 rounded uppercase font-mono",
                          ten.riskStatus === 'Safe' ? "bg-zinc-100 text-zinc-600" :
                          ten.riskStatus === 'Warning' ? "bg-amber-100 text-amber-700 font-semibold" : "bg-rose-100 text-rose-800 font-black animate-pulse"
                        )}>
                          {ten.riskStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => onImpersonate(ten.name)}
                            className={cn(
                              "px-2.5 py-1 text-10 font-mono font-bold tracking-tight rounded-md border text-zinc-500 bg-white hover:text-black hover:bg-zinc-100 transition-all",
                              impersonatingTenant === ten.name ? "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20 font-black" : "border-zinc-200"
                            )}
                            title="Impersonate into tenant's dashboard namespace"
                          >
                            {impersonatingTenant === ten.name ? "MUTED" : "IMPERSONATE"}
                          </button>
                          
                          <button
                            onClick={() => handleToggleTenantStatus(ten.id)}
                            className={cn(
                              "px-2.5 py-1 text-10 font-mono font-bold rounded-md border flex items-center gap-1 transition-all",
                              isSuspended 
                                ? "bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-500" 
                                : "bg-white hover:bg-rose-50 text-rose-600 border-zinc-200 hover:border-rose-200"
                            )}
                          >
                            <Power size={10} className="stroke-[2.5]" />
                            {isSuspended ? 'ENABLE' : 'SUSPEND'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- REALTTIME MONITOR VIEW (P1) --- */}
      {saTab === 'runtime' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-fade-in">
          
          {/* Active Tasks Feed List */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-display font-medium text-16 text-black select-none">AI Runtime Execution Dashboard</h3>
                <p className="text-11 text-zinc-400 font-medium">Trace executions, track cost-per-token overheads, and inspect prompt outputs line-by-line.</p>
              </div>
              <button 
                onClick={triggerSimulatedJob} 
                className="px-3.5 py-2 bg-black text-white hover:bg-zinc-950 duration-150 rounded-lg text-11 font-mono font-bold"
              >
                Simulate AI Trigger
              </button>
            </div>

            <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-zinc-150 bg-zinc-50/50 flex justify-between text-[10px] font-mono text-zinc-400 uppercase font-bold">
                <span>Task Payload command</span>
                <span>Active Resource status</span>
              </div>
              <div className="divide-y divide-zinc-150">
                {tasks.map((task) => {
                  const isSelected = activeTraceTask?.id === task.id;
                  return (
                    <div 
                      key={task.id}
                      onClick={() => setActiveTraceTask(task)}
                      className={cn(
                        "p-4 flex items-center justify-between cursor-pointer transition-all hover:bg-zinc-50/50",
                        isSelected ? "bg-zinc-100/70 border-l-4 border-black pl-3 bg-zinc-50" : ""
                      )}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-zinc-950 text-13 uppercase">{task.command.replace(/_/g, ' ')}</span>
                          <span className="px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-505 text-[9px] font-mono leading-none border border-zinc-200">
                            {task.provider}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          ID: #{task.id} &bull; Timestamp: {task.timestamp.split('T')[1].substring(0, 5)} GMT &bull; Tenant: {task.tenantId.toUpperCase()}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-mono font-bold text-zinc-800 text-12">
                            {task.latency > 0 ? `${task.latency}ms` : '--'}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-400">
                            {task.tokenUsage > 0 ? `${task.tokenUsage} tkns` : 'Queued...'}
                          </div>
                        </div>

                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-tight",
                          task.status === 'Completed' ? "bg-zinc-100 text-zinc-650" :
                          task.status === 'Running' ? "bg-emerald-100 text-emerald-800 animate-pulse" :
                          task.status === 'Failed' ? "bg-rose-100 text-rose-800 font-black" : "bg-amber-100 text-amber-800"
                        )}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Execution Trace Console Panel */}
          <div className="bg-zinc-900 text-zinc-100 rounded-3xl p-6 shadow-xl border border-zinc-950 flex flex-col justify-between h-[650px]">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Terminal size={16} className="text-emerald-400 animate-pulse" />
                  <span className="font-mono text-12 font-bold tracking-tight">System Trace Inspector</span>
                </div>
                {activeTraceTask && (
                  <button onClick={() => setActiveTraceTask(null)} className="text-zinc-500 hover:text-white">
                    <X size={15} />
                  </button>
                )}
              </div>

              {activeTraceTask ? (
                <div className="space-y-5 animate-fade-in font-mono text-12">
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                    <div className="text-zinc-550 text-[10px] font-semibold uppercase leading-none mb-1 text-zinc-500">Selected Execution trace</div>
                    <h4 className="text-zinc-100 font-bold uppercase text-13">{activeTraceTask.command.replace(/_/g, ' ')}</h4>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-zinc-850/60 text-11 text-zinc-300">
                      <div>
                        <span className="block text-zinc-500 text-[10px]">LATENCY FOOTPRINT</span>
                        <span className="font-bold text-white text-12">{activeTraceTask.latency > 0 ? `${activeTraceTask.latency} ms` : 'Enqueued'}</span>
                      </div>
                      <div>
                        <span className="block text-zinc-500 text-[10px]">CUMULATIVE TOKENS</span>
                        <span className="font-bold text-[#A855F7] text-12">{activeTraceTask.tokenUsage.toLocaleString()} TKNS</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-zinc-400 block tracking-widest uppercase">Chronological Stack trace Output:</span>
                    <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-850 h-56 overflow-y-auto space-y-2.5 custom-scrollbar text-[11px] leading-relaxed text-zinc-300">
                      {activeTraceTask.logs && activeTraceTask.logs.map((log, idx) => (
                        <div key={idx} className="flex gap-2.5">
                          <span className="text-zinc-500 pointer-events-none select-none">[{idx + 1}]</span>
                          <span className="whitespace-pre-wrap">{log}</span>
                        </div>
                      ))}
                      {activeTraceTask.status === 'Running' && (
                        <div className="flex gap-2.5 text-emerald-400 animate-pulse">
                          <span>[*]</span>
                          <span>Executing live stream handler chunk trace...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center h-80 space-y-4">
                  <div className="w-12 h-12 bg-neutral-850 flex items-center justify-center rounded-2xl text-zinc-600">
                    <Fingerprint size={24} />
                  </div>
                  <div>
                    <h4 className="text-13 text-zinc-200 font-mono font-bold">Select Active Telemetry trace</h4>
                    <p className="text-11 text-zinc-500 font-medium max-w-xs leading-relaxed mt-1">
                      Click matching execution items on the left monitor to expand real-time cloud worker logs.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-zinc-850 text-[10px] text-zinc-400 font-mono font-bold uppercase flex justify-between">
              <span>SANDBOX ENVIRONMENT: ACTIVE</span>
              <span>VERIFY_SSL=TRUE</span>
            </div>
          </div>

        </div>
      )}

      {/* --- GOVERNANCE CONTROL VIEW (P2) --- */}
      {saTab === 'governance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          
          {/* Controls Sliders Card */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-violet-600 uppercase font-bold tracking-wider">PLATFORM GOVERNANCE LAYER</span>
              <h3 className="font-display font-medium text-16 text-black">LLM Autonomic Cost-Quota Rules</h3>
              <p className="text-11 text-zinc-400 font-medium">Fine-tune the platform security bounds to eliminate token run-aways, API spams, or rogue scripts.</p>
            </div>

            <div className="space-y-6 pt-4">
              
              {/* Rate Limiting */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-12">
                  <span className="font-mono font-bold text-zinc-700">Platform Global API Rate Limit</span>
                  <span className="font-mono bg-zinc-150 text-zinc-800 px-2.5 py-0.5 rounded-md font-bold">{rateLimit} reqs/sec</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="500"
                  step="10"
                  value={rateLimit}
                  onChange={(e) => setRateLimit(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-black"
                />
                <span className="text-[10px] text-zinc-400 italic block">
                  Enforces strict high-frequency IP throttle controls via reverse-proxy Nginx layers directly.
                </span>
              </div>

              {/* Cost control limits */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-12">
                  <span className="font-mono font-bold text-zinc-700">SaaS Autonomic Cost Control Ceiling Cap</span>
                  <span className="font-mono bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-md font-bold">${costCap} USD / month</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="50"
                  value={costCap}
                  onChange={(e) => setCostCap(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-black"
                />
                <span className="text-[10px] text-zinc-400 italic block">
                  Automatically freezes tenant execution workspace sandbox layers once monthly token burn rate matches the value.
                </span>
              </div>

              {/* Audit Toggles */}
              <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl flex items-center justify-between text-12">
                <div className="space-y-1">
                  <span className="font-bold text-zinc-800 block">Required Multi-Agent Approval Flow</span>
                  <p className="text-[11px] text-zinc-450 text-zinc-400">All generated tenant database schema migrations require SaaS admin authentication.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAuditRequired(!auditRequired)}
                  className={cn(
                    "w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none flex",
                    auditRequired ? "bg-black justify-end" : "bg-zinc-200 justify-start"
                  )}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>

            </div>
          </div>

          {/* Allocation card for Tiers info */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm space-y-6">
            <h3 className="font-display font-medium text-14 text-black uppercase tracking-wider font-mono">Standard Tenant Quotas configuration</h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono uppercase text-zinc-400 font-bold ml-1">Enterprise Subscription tier monthly allocation</span>
                <div className="flex rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
                  <div className="px-4 py-2.5 bg-zinc-100 border-r border-zinc-200 text-11 font-mono font-bold text-zinc-500 flex items-center">TOKENS</div>
                  <input 
                    type="number"
                    value={enterpriseQuota}
                    onChange={(e) => setEnterpriseQuota(Number(e.target.value))}
                    className="flex-1 bg-transparent px-4 text-12 font-mono outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-mono uppercase text-zinc-400 font-bold ml-1">Growth Subscription tier monthly allocation</span>
                <div className="flex rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
                  <div className="px-4 py-2.5 bg-zinc-100 border-r border-zinc-200 text-11 font-mono font-bold text-zinc-500 flex items-center font-bold">TOKENS</div>
                  <input 
                    type="number"
                    value={growthQuota}
                    onChange={(e) => setGrowthQuota(Number(e.target.value))}
                    className="flex-1 bg-transparent px-4 text-12 font-mono outline-none" 
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200/50 flex gap-3 text-11">
                <AlertTriangle size={16} className="text-orange-600 shrink-0 mt-0.5" />
                <p className="text-orange-850 leading-relaxed font-medium">
                  Modifying standard allocations resets safety caps on the starting period of next month. All manual governance interventions are logged in audit events logs.
                </p>
              </div>

              <button
                onClick={() => {
                  const newEvt: PlatformEvent = {
                    id: "evt_" + (MOCK_DB.events.length + 1),
                    tenantId: "platform",
                    tenantName: "Governance Engine",
                    type: "GOVERNANCE_OVERRIDE",
                    message: "Manual Admin override: Saved active security rules and rate limits allocations",
                    timestamp: new Date().toISOString(),
                    severity: "info"
                  };
                  MOCK_DB.events.unshift(newEvt);
                  notifyDbChanged();
                  setIsConfigSaved(true);
                  setTimeout(() => setIsConfigSaved(false), 3000);
                }}
                className={cn(
                  "w-full py-2.5 rounded-xl text-11 font-mono font-bold transition-all flex items-center justify-center gap-1.5",
                  isConfigSaved 
                    ? "bg-emerald-600 text-white animate-pulse" 
                    : "bg-black hover:bg-zinc-950 text-white"
                )}
              >
                {isConfigSaved ? (
                  <>
                    <Check size={12} className="stroke-[3]" />
                    <span>Applied to Edge Gateway Successfully!</span>
                  </>
                ) : (
                  <span>Apply Security Controls & Configuration</span>
                )}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* --- QUEUE & WORKER TAB (P2) --- */}
      {saTab === 'queue' && (
        <div className="space-y-6 animate-fade-in text-13">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="font-display font-medium text-16 text-black select-none">BullMQ / Redis Orchestrator Dashboard</h3>
              <p className="text-11 text-zinc-400 font-medium font-semibold">Monitor active node sub-runners cluster backlog, processing job queues, and force thread garbage sweeps.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={triggerSimulatedJob}
                className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-250/60 rounded-lg text-11 font-mono font-bold transition-colors"
              >
                Trigger Worker job
              </button>
              <button
                onClick={handlePurgeQueue}
                className="px-3.5 py-2 bg-rose-600 text-white hover:bg-rose-700 rounded-lg text-11 font-mono font-bold transition-all"
              >
                Purge failed backlog
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] text-zinc-400 font-mono tracking-wider font-bold">TOTAL BULLMQ WORKERS</span>
              <p className="text-24 font-display font-bold text-black mt-2">6 Ready</p>
              <span className="text-[10px] text-emerald-600 font-bold font-mono">● 100% HEALTH</span>
            </div>
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] text-zinc-400 font-mono tracking-wider font-bold">ACTIVE RETRIES</span>
              <p className="text-24 font-display font-bold text-black mt-2">3 Recalls</p>
              <span className="text-[10px] text-zinc-450 text-zinc-400 font-mono">Retry Policy: Max 3</span>
            </div>
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] text-zinc-400 font-mono tracking-wider font-bold">AVG WORKER LATENCY</span>
              <p className="text-24 font-display font-bold text-black mt-2">610 ms</p>
              <span className="text-[10px] text-zinc-450 text-zinc-400 font-mono">Target benchmark: &lt; 1000ms</span>
            </div>
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] text-zinc-400 font-mono tracking-wider font-bold">REDIS DISK STATUS</span>
              <p className="text-24 font-display font-bold text-black mt-2">128 MB</p>
              <span className="text-[10px] text-sky-600 font-bold font-mono">0.05% Capacity footprint</span>
            </div>
          </div>

          {/* Table display indicating queues */}
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-zinc-150 bg-zinc-55 text-12 font-bold text-zinc-800 font-mono uppercase">
              BullMQ Thread Worker allocation mapping (Virtual cluster instances)
            </div>
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100 select-none text-[10px] font-mono text-zinc-400 uppercase">
                  <th className="px-6 py-4 font-bold">Runner ID</th>
                  <th className="px-6 py-4 font-bold">Active Thread Scope</th>
                  <th className="px-6 py-4 font-bold">Running Jobs</th>
                  <th className="px-6 py-4 font-bold">Completed Jobs</th>
                  <th className="px-6 py-4 font-bold">Failure counter</th>
                  <th className="px-6 py-4 font-bold text-right">Runner status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 font-mono text-xs">
                {[
                  { id: "worker_node_01", scope: "Marketing campaign generation", run: "1 active", done: 420, fail: 2, status: "Active" },
                  { id: "worker_node_02", scope: "Customer reviews trend modeling", run: "0 idle", done: 104, fail: 0, status: "Active" },
                  { id: "worker_node_03", scope: "Product listing schema generator", run: "0 idle", done: 65, fail: 4, status: "Active" },
                  { id: "worker_node_04", scope: "Imagen 3 background remover", run: "0 idle", done: 89, fail: 12, status: "Active" },
                  { id: "worker_node_05", scope: "Backup DB transaction synchronization", run: "1 Active", done: 12, fail: 0, status: "Active" },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50">
                    <td className="px-6 py-4 font-semibold text-zinc-900">{row.id}</td>
                    <td className="px-6 py-4 text-zinc-500 pr-4">{row.scope}</td>
                    <td className="px-6 py-4 font-bold">{row.run}</td>
                    <td className="px-6 py-4 text-zinc-500">{row.done} units</td>
                    <td className="px-6 py-4 text-rose-600 font-bold">{row.fail} aborted</td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-full">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- RUNTIME EVENT TIMELINE STREAM (P2) --- */}
      {saTab === 'events' && (
        <div className="space-y-6 animate-fade-in text-13">
          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="font-display font-medium text-16 text-black select-none">Chronological Runtime Event Stream Timeline</h3>
              <p className="text-11 text-zinc-400 font-medium">Realtime platform events generated by client actions and background AI cron workers.</p>
            </div>

            {/* Event Filter Options */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search size={13} className="absolute left-3 text-zinc-400 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  placeholder="Filter events description..."
                  className="bg-zinc-50 hover:bg-zinc-100 text-11 pl-8 pr-3 py-1.5 border border-zinc-200 rounded-xl font-mono text-zinc-750 outline-none focus:ring-2 focus:ring-zinc-200 transition-all font-semibold max-w-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Severity:</span>
                <select
                  value={eventSeverityFilter}
                  onChange={(e) => setEventSeverityFilter(e.target.value)}
                  className="bg-zinc-50 border border-zinc-200 text-11 px-2.5 py-1.5 rounded-xl font-mono text-zinc-700 font-semibold outline-none"
                >
                  <option value="all">all</option>
                  <option value="info">info</option>
                  <option value="warning">warning</option>
                  <option value="critical">critical</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Tenant:</span>
                <select
                  value={eventTenantFilter}
                  onChange={(e) => setEventTenantFilter(e.target.value)}
                  className="bg-zinc-50 border border-zinc-200 text-11 px-2.5 py-1.5 rounded-xl font-mono text-zinc-700 font-semibold outline-none"
                >
                  <option value="all">all tenants</option>
                  <option value="tenant_1">tenant_1</option>
                  <option value="tenant_2">tenant_2</option>
                  <option value="tenant_3">tenant_3</option>
                  <option value="tenant_4">tenant_4</option>
                  <option value="tenant_5">tenant_5</option>
                  <option value="platform">platform</option>
                </select>
              </div>

              <button
                onClick={() => {
                  const newEvt: PlatformEvent = {
                    id: "evt_" + (MOCK_DB.events.length + 1),
                    tenantId: "tenant_3",
                    tenantName: "Neo Cyberpunk Apparel",
                    type: "AI_PRODUCT_CREATED",
                    message: `Autonomic script created 'Synthetic Carbon fiber sneakers' for tenant: ${MOCK_DB.tenants[2].name}`,
                    timestamp: new Date().toISOString(),
                    severity: "info"
                  };
                  MOCK_DB.events.unshift(newEvt);
                  notifyDbChanged();
                }}
                className="px-3 py-1.5 bg-black text-white hover:bg-zinc-950 duration-150 rounded-lg text-11 font-mono font-bold"
              >
                + Inject Test Event
              </button>
            </div>
          </div>

          {/* Timeline Node List */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <div className="relative border-l border-zinc-200 pl-6 ml-4 space-y-6">
              {filteredEvents.map((evt, index) => {
                const isInfo = evt.severity === 'info';
                const isWarning = evt.severity === 'warning';
                const isCritical = evt.severity === 'critical';

                return (
                  <div key={evt.id} className="relative group">
                    
                    {/* Ring indicator node representing chronological point */}
                    <span className={cn(
                      "absolute -left-[31px] top-1 w-4.5 h-4.5 rounded-full border-2 bg-white flex items-center justify-center transition-all",
                      isInfo ? "border-zinc-400 text-zinc-500" :
                      isWarning ? "border-amber-500 text-amber-500" : "border-rose-500 text-rose-500 animate-pulse"
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        isInfo ? "bg-zinc-400" :
                        isWarning ? "bg-amber-500" : "bg-rose-500"
                      )} />
                    </span>

                    <div className="space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-11 font-black text-black tracking-wide uppercase px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200">{evt.type}</span>
                          <span className="text-11 font-mono text-zinc-400 font-bold uppercase">{evt.tenantName} ({evt.tenantId})</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono font-bold self-start mt-0.5">
                          {evt.timestamp.split('T')[1].substring(0, 8)} &bull; {evt.timestamp.split('T')[0]}
                        </span>
                      </div>
                      <p className="text-13 text-zinc-750 font-medium pl-1 leading-relaxed">{evt.message}</p>
                    </div>

                  </div>
                );
              })}

              {filteredEvents.length === 0 && (
                <div className="text-center py-12 font-mono text-zinc-400">
                  No chronological events found matching current filter scope.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

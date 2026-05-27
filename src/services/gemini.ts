/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Type, Content } from "@google/genai";
import realData from '../data.json';
import { generateSKU } from '../lib/utils';

// Initialize Gemini Client
// We use the 'gemini-2.5-flash-latest' model as requested for "Gemini Flash"
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const MODEL_NAME = "gemini-3.5-flash";

export interface ChatMessage extends Content {
  timestamp: Date;
  latencyMs?: number;
  groundingMetadata?: any;
  hasReport?: boolean;
  hasDashboard?: boolean;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
}

export interface ToolResult {
  id: string;
  name: string;
  result: any;
}

// Subscriber listeners for database mutations
type DbChangeListener = () => void;
const listeners = new Set<DbChangeListener>();
export function subscribeToDbChanges(listener: DbChangeListener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function notifyDbChanged() {
  listeners.forEach(l => {
    try { l(); } catch (e) { console.error("Listener error", e); }
  });
}

// Mock Database for the agent to interact with (E-Commerce data)
export const MOCK_DB = {
  orders: realData.orders as any[],
  dashboards: [] as any[],
  reports: [] as any[],
  agents: [] as any[],
  reviews: realData.reviews as any[],
  customer_responses: [] as any[],
  products: [
    {
      id: "prod_1",
      title: "Nordic Minimalist Oak Table Lamp",
      description: "Danish inspired accent lamp crafted from selected solid oak and hand-spun linen shade. Emits soft warm ambient light perfect for desks or bedside tables.",
      price: 129.00,
      sku: "NORD-LAMP-OAK-01",
      category: "Lighting",
      stock: 45,
      sales: 128,
      status: "Active",
      image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80"
    },
    {
      id: "prod_2",
      title: "Apple Aluminum Height-Adjustable Stand",
      description: "An elegant aluminum stand engineered for MacBooks and iPads. Promotes ergonomic alignment with dual hinge mechanisms for continuous height adjustments.",
      price: 89.00,
      sku: "APL-STD-ALU-02",
      category: "Accessories",
      stock: 120,
      sales: 342,
      status: "Active",
      image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80"
    },
    {
      id: "prod_3",
      title: "Ergonomic Mesh Task Chair",
      description: "Breathable self-weight tension sensing mesh chair that adapts automatically to your lower back curvature. Premium aluminum base with multi-direction armrests.",
      price: 349.00,
      sku: "ERG-CHR-MSH-03",
      category: "Office",
      stock: 35,
      sales: 64,
      status: "Active",
      image: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=80"
    },
    {
      id: "prod_4",
      title: "Aromatic Sandalwood Soy Candle",
      description: "Hand-poured natural soy wax candle infused with genuine organic sandalwood oil, white cedar, and vanilla tree bark. Burns cleanly for up to 60 hours.",
      price: 24.00,
      sku: "SND-CND-SOY-04",
      category: "Home Decor",
      stock: 240,
      sales: 512,
      status: "Active",
      image: "https://images.unsplash.com/photo-1603006905393-0d5651bfef25?w=600&auto=format&fit=crop&q=80"
    }
  ] as any[],
  campaigns: [
    {
      id: "camp_1",
      product_name: "Nordic Minimalist Oak Table Lamp",
      channel: "TikTok Ad",
      tone: "Minimalist",
      content: "🌸 Less is more. Bring Danish warmth into your cozy corner. Oak wood meets premium hand-spun linen. Simple, soft, aesthetic. Shop our Nordic Table Lamp and elevate your space tonight. #minimalistdecor #deskinspiration #cozybedroom",
      status: "Draft"
    }
  ] as any[],
  theme: {
    themeStyle: "nordic", // 'nordic' | 'apple' | 'cyber' | 'sunset'
    primaryColor: "#4F46E5",
    bannerTitle: "Simplicity in Living",
    bannerSubtitle: "Discover curated minimalist essentials that balance form, function, and nature's raw material.",
    layoutConfig: "grid",
    bannerImage: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1600&auto=format&fit=crop&q=80"
  },
  tenants: [
    {
      id: "tenant_1",
      name: "Nordic Woodworks",
      plan: "Enterprise",
      aiUsage: 48220,
      gmv: 128450,
      orderCount: 995,
      runtimeStatus: "Healthy",
      riskStatus: "Safe",
      lastActivity: "2026-05-26T23:30:15Z"
    },
    {
      id: "tenant_2",
      name: "Aura Aromatherapy & Wellness",
      plan: "Growth",
      aiUsage: 22110,
      gmv: 45820,
      orderCount: 412,
      runtimeStatus: "Healthy",
      riskStatus: "Safe",
      lastActivity: "2026-05-26T23:28:10Z"
    },
    {
      id: "tenant_3",
      name: "Neo Cyberpunk Apparel",
      plan: "Enterprise",
      aiUsage: 89500,
      gmv: 210000,
      orderCount: 2450,
      runtimeStatus: "Degraded",
      riskStatus: "Warning",
      lastActivity: "2026-05-26T23:34:00Z"
    },
    {
      id: "tenant_4",
      name: "Sunset Velvet Home",
      plan: "Growth",
      aiUsage: 56120,
      gmv: 82410,
      orderCount: 1230,
      runtimeStatus: "Healthy",
      riskStatus: "Safe",
      lastActivity: "2026-05-26T23:31:00Z"
    },
    {
      id: "tenant_5",
      name: "Vaporwave Retro Tech Exchange",
      plan: "Free",
      aiUsage: 12400,
      gmv: 1400,
      orderCount: 42,
      runtimeStatus: "Suspended",
      riskStatus: "High Risk",
      lastActivity: "2026-05-26T23:25:00Z"
    }
  ] as any[],
  tasks: [
    {
      id: "task_1",
      tenantId: "tenant_1",
      command: "generate_marketing_campaign",
      status: "Running",
      latency: 1240,
      tokenUsage: 2540,
      provider: "Gemini 2.5 Flash",
      timestamp: "2026-05-26T23:30:15Z",
      logs: [
        "Initializing prompt generation with context Nordic Woodworks",
        "Extracted product details: Nordic Minimalist Oak Table Lamp",
        "Applying target tone: Minimalist Danish vibe",
        "Generating ad structure options for TikTok channels",
        "Structuring campaign tags and preview images..."
      ]
    },
    {
      id: "task_2",
      tenantId: "tenant_2",
      command: "analyze_customer_sentiment",
      status: "Completed",
      latency: 890,
      tokenUsage: 1450,
      provider: "Gemini 2.5 Flash",
      timestamp: "2026-05-26T23:28:10Z",
      logs: [
        "Parsed 24 newly received candle reviews for active trends",
        "Identified primary positive tone setting (Minimalism/Eco-wellness)",
        "Updated overall tenant customer health score successfully to 96%"
      ]
    },
    {
      id: "task_3",
      tenantId: "tenant_4",
      command: "execute_auto_seo_backlink",
      status: "Failed",
      latency: 3120,
      tokenUsage: 890,
      provider: "Gemini 1.5 Pro",
      timestamp: "2026-05-26T23:25:00Z",
      logs: [
        "Requesting external reference links for site validation",
        "Target SEO partner failed to respond to handshake",
        "Retrying operation: attempt 2 of 3...",
        "Operation failed: Host DNS resolution timeout"
      ]
    },
    {
      id: "task_4",
      tenantId: "tenant_3",
      command: "generate_new_product_image",
      status: "Queued",
      latency: 0,
      tokenUsage: 0,
      provider: "Imagen 3",
      timestamp: "2026-05-26T23:31:00Z",
      logs: [
        "Request placed in SaaS Worker queue",
        "Matching appropriate Imagen 3 generation pipeline",
        "Pending worker pick-up..."
      ]
    }
  ] as any[],
  events: [
    {
      id: "evt_1",
      tenantId: "tenant_1",
      tenantName: "Nordic Woodworks",
      type: "AI_PRODUCT_CREATED",
      message: "Nordic Woodworks successfully auto-generated 'Scandinavian Cedar Sofa Bench'",
      timestamp: "2026-05-26T23:30:15Z",
      severity: "info"
    },
    {
      id: "evt_2",
      tenantId: "tenant_4",
      tenantName: "Sunset Velvet Home",
      type: "AI_THEME_UPDATED",
      message: "Sunset Velvet Home automatically updated visual styling parameters to 'Warm Sunset Velvet Sunset Glow'",
      timestamp: "2026-05-26T23:31:00Z",
      severity: "info"
    },
    {
      id: "evt_3",
      tenantId: "tenant_5",
      tenantName: "Vaporwave Retro Tech Exchange",
      type: "RATE_LIMIT_TRIGGERED",
      message: "Vaporwave Retro Tech Exchange rate-limited: Exceeded free tier capacity boundary (15 calls/min)",
      timestamp: "2026-05-26T23:25:00Z",
      severity: "warning"
    },
    {
      id: "evt_4",
      tenantId: "tenant_5",
      tenantName: "Vaporwave Retro Tech Exchange",
      type: "TENANT_SUSPENDED",
      message: "Platform auto-governor suspended Vaporwave Retro Tech Exchange sandbox due to persistent risk alerts",
      timestamp: "2026-05-26T23:26:12Z",
      severity: "critical"
    }
  ] as any[]
};

// Tool Definitions
export const tools = [
  {
    functionDeclarations: [
      {
        name: "analyze_sales_performance",
        description: "Fetches revenue and order volume data by date range or category.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            date_range: { type: Type.STRING, description: "e.g., '2023-Q4' or 'last 30 days'" },
            group_by: { type: Type.STRING, description: "e.g., 'product_category', 'city'" },
            city: { type: Type.STRING, description: "Optional city to filter sales data by (e.g., 'sao paulo')" }
          },
          required: ["date_range"],
        },
      },
      {
        name: "investigate_shipping_delays",
        description: "Cross-references delivery dates to find bottlenecks.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            region: { type: Type.STRING, description: "e.g., 'São Paulo'" },
          },
          required: [],
        },
      },
      {
        name: "analyze_customer_sentiment",
        description: "Pulls review scores and text for specific products or generally.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            product_category: { type: Type.STRING, description: "Category of product, e.g. 'electronics'" },
            score_filter: { type: Type.NUMBER, description: "Review score to filter by, e.g. 1" }
          },
          required: [],
        },
      },
      {
        name: "issue_refund",
        description: "Updates the status of an order in the database and records a refund.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            order_id: { type: Type.STRING, description: "The ID of the order to refund" },
            refund_amount: { type: Type.NUMBER, description: "The amount to refund" },
            reason_code: { type: Type.STRING, description: "Reason for the refund" }
          },
          required: ["order_id", "refund_amount"],
        },
      },
      {
        name: "draft_customer_response",
        description: "Generates and saves a draft response to a specific customer review.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            customer_id: { type: Type.STRING },
            review_id: { type: Type.STRING },
            proposed_solution: { type: Type.STRING, description: "What to offer the customer (e.g., 20% discount)" }
          },
          required: ["customer_id", "review_id", "proposed_solution"],
        },
      },
      {
        name: "start_ai_agent",
        description: "Start a sub-agent to complete a complex analysis or data gathering task autonomously.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            agent_name: { type: Type.STRING, description: "Name of the sub-agent" },
            task_description: { type: Type.STRING, description: "Detailed description of the complex task for the sub-agent to complete" },
          },
          required: ["agent_name", "task_description"],
        },
      },
      {
        name: "generate_yearly_report",
        description: "Generate a detailed text-based business report. Do NOT use this tool if the user asks for a dashboard.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            year: { type: Type.NUMBER },
            executive_summary: { type: Type.STRING, description: "High-level summary of the findings" },
            detailed_analysis: { type: Type.STRING, description: "In-depth plain-text analysis and business narrative. Do NOT use markdown." },
            key_insights: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of key insights" },
            metrics: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                  trend: { type: Type.STRING, description: "e.g. '+15%', '-5%'" }
                }
              },
              description: "Key financial and operational metrics to visualize"
            },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Strategic recommendations based on data" },
          },
          required: ["title", "year", "executive_summary", "detailed_analysis", "key_insights", "metrics", "recommendations"],
        },
      },
      {
        name: "create_operations_dashboard",
        description: "Create a rich data visualization dashboard. You MUST use this tool (and not the report tool) when the user asks for a dashboard.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            kpis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING },
                  trend: { type: Type.STRING, description: "e.g., '+12%', '-5%'" }
                }
              },
              description: "Top-level summary metrics"
            },
            main_chart: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                type: { type: Type.STRING, description: "Type of chart (e.g., 'bar', 'line')" },
                data: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      value: { type: Type.NUMBER }
                    }
                  }
                }
              }
            },
            secondary_chart: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                type: { type: Type.STRING, description: "Type of chart (e.g., 'pie', 'bar')" },
                data: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      value: { type: Type.NUMBER }
                    }
                  }
                }
              },
              description: "An additional chart to show secondary insights (like category breakdowns)"
            },
            recent_activity: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING }
                }
              },
              description: "List of 3-5 recent data points or quick insight bullets related to the dashboard"
            }
          },
          required: ["title", "kpis", "main_chart", "secondary_chart", "recent_activity"],
        },
      },
      {
        name: "create_product",
        description: "Generates and automatically lists a new product in the admin backend database.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Detailed and catchy product title, e.g., 'Retro Ceramic Desk Lamp'" },
            description: { type: Type.STRING, description: "Rich, human-written descriptive copy highlighting craftsmanship and key benefits" },
            price: { type: Type.NUMBER, description: "Suggested retail price, numerical value, e.g., 49.99" },
            category: { type: Type.STRING, description: "Product category, e.g., 'Lighting', 'Office', 'Accessories', 'Home Decor'" },
            sku: { type: Type.STRING, description: "Unique SKU identifier, e.g., 'COZY-LAMP-01'" },
            reference_image_theme: { type: Type.STRING, description: "Style indicator for selecting appropriate high-resolution shots: 'lamp', 'chair', 'accessory', 'candle', 'watch'" }
          },
          required: ["title", "description", "price", "category", "sku"],
        }
      },
      {
        name: "optimize_product_image",
        description: "Performs real-time visual optimizations such as background removal, resizing, or professional search for a product image.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            product_id: { type: Type.STRING, description: "Target product ID, or 'new_product' if modifying a newly drafted item" },
            action: { type: Type.STRING, description: "Image adjustment style: 'remove_bg' (transparency overlay), 'resize' (1080x1080 crop), 'search' (find high-end replacement), 'generate_banner' (create beautiful promotional banner)" },
            prompt: { type: Type.STRING, description: "Descriptive prompt explaining what backdrop or visual polish is requested" }
          },
          required: ["product_id", "action"],
        }
      },
      {
        name: "generate_campaign_copy",
        description: "Drafts and launches high-converting campaigns including TikTok ad scripts, SEO titles/tags, or EDM emails.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            product_name: { type: Type.STRING, description: "The product of interest" },
            channel: { type: Type.STRING, description: "Marketing channel: 'tiktok' (video script), 'seo' (metalinks and keywords), 'edm' (promotional newsletter), 'social' (instagram post)" },
            tone: { type: Type.STRING, description: "Personality style: 'minimalist', 'energetic', 'professional', 'storytelling'" },
            generated_text: { type: Type.STRING, description: "The actual written copy or outline for the specified channel" }
          },
          required: ["product_name", "channel", "tone", "generated_text"],
        }
      },
      {
        name: "set_store_theme",
        description: "Instantly re-designs the online store appearance by modifying the active stylesheet theme, colors, typography layout, and hero banners.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            themeStyle: { type: Type.STRING, description: "Visual mood style: 'apple' (white/aluminum luxury grid), 'nordic' (creamy warm wood hygge style), 'cyber' (luminous neon dark mode), 'sunset' (warm gradient coral peachy look)" },
            primaryColor: { type: Type.STRING, description: "Primary hex color, e.g., '#0F172A' or '#E11D48'" },
            bannerTitle: { type: Type.STRING, description: "Catchy hero main headline for the homepage" },
            bannerSubtitle: { type: Type.STRING, description: "Secondary supportive sub-headline copy" },
            layoutConfig: { type: Type.STRING, description: "Structural layout format: 'grid', 'hero_banner', 'split'" }
          },
          required: ["themeStyle", "bannerTitle", "bannerSubtitle"],
        }
      },
    ],
  },
];

export interface AgentStep {
  id: string;
  type: 'text' | 'tool';
  content?: string;
  toolName?: string;
  toolArgs?: any;
  result?: any;
  status: 'pending' | 'streaming' | 'completed' | 'error';
  latencyMs?: number;
}

export async function sendMessageToAgentStream(
  history: ChatMessage[],
  newMessage: string,
  onUpdate: (data: { history: ChatMessage[], steps: AgentStep[], isDone: boolean, currentText: string }) => void
): Promise<void> {
  const sdkHistory = history
    .filter(h => h.role !== 'system')
    .map(h => {
      const { timestamp, latencyMs, groundingMetadata, ...content } = h;
      return content;
    });

  const contents: Content[] = [
    ...sdkHistory,
    { role: "user", parts: [{ text: newMessage }] }
  ];
  
    const config = {
    tools: tools,
    systemInstruction: `You are an elite AI-Powered Commerce Admin (AI 增强型电商后台) Assistant.
      Your goal is to autonomously manage the store, analyze data, handle stock, draft campaigns, optimize media, and instantly customize backend configurations and front-end themes based on user instructions.
      
      Capabilities & Tools:
      1. Product Management: Add beautiful new product listings instantly with 'create_product'. Give it catchy titles, rich descriptions, realistic prices, and correct categories.
      2. Image Optimizations: Refine images with 'optimize_product_image' (remove backgrounds, resize, search, or generate promotional banners).
      3. Marketing campaigns: Write high-impact copies (TikTok scripts, SEO meta-tags, EDM email newsletters) with 'generate_campaign_copy'.
      4. Theme & Branding customization: Instantly redesign the store using 'set_store_theme'. Map and configure styles like 'apple', 'nordic', 'cyber', or 'sunset' directly to user vibes.
      5. Analytics & Visualization: Fetch metrics using 'analyze_sales_performance' or 'investigate_shipping_delays', and build reporting artifacts with 'generate_yearly_report' or 'create_operations_dashboard'.
      6. Support and Refunds: Draft response reviews ('draft_customer_response') or issue refunds ('issue_refund').

      Behavior & Proactivity:
        - When a user asks to "list a product/ Nordic lamps" or "decorate the storefront to Apple style", enthusiastically call the correct set of tools. You can make multiple tool calls in a single turn if needed (e.g. call create_product to add several products, and then set_store_theme to customize the colors).
        - If the user asks to listing multiple items (e.g. 10 table lamps), trigger 'create_product' as needed with beautiful, distinct, descriptive Nordic-style parameters, pricing variations, and unique SKUs.
        - CRITICAL: Never ask for missing details to complete a tool call if you can infer them. Always use sensible, premium defaults.
        - STRICT TOOL USAGE: If the user explicitly asks for a "report", you MUST use the 'generate_yearly_report' tool. If the user explicitly asks for a "dashboard", you MUST use the 'create_operations_dashboard' tool. Do not substitute one for the other.
        - When creating dashboards, always use aggregated data from tool results for rich multi-chart views.
        - CRITICAL RULE FOR LABELS: Use specific names of filters or locations (e.g., "Vianopolis Revenue", "Q3 2017 Orders"), never generic "Total Revenue" if filters were specified.
        - CRITICAL RULE FOR MISSING DATA: If data is 0, explicitly state this and do NOT generate a mock dashboard or report. Note that database only has records from 2017 and 2018.
      - Be extremely professional, concise, yet stylish.
      - Explain briefly what you are doing (e.g., "Adding 3 Scandinavian Table Lamps to your catalog...", "Optimizing lighting shot background...").
      - When you call generate_yearly_report or create_operations_dashboard, do not output any conversational text afterwards.
      `,
  };

  let currentHistory = [...history];
  const userMsg: ChatMessage = { role: "user", parts: [{ text: newMessage }], timestamp: new Date() };
  currentHistory.push(userMsg);
  
  let steps: AgentStep[] = [];
  let keepGoing = true;
  let maxSteps = 5;
  let stepCount = 0;
  let finalFullText = "";
  const totalStartTime = performance.now();

  const notify = (isDone: boolean = false, text: string = "") => {
    onUpdate({
      history: currentHistory,
      steps: [...steps],
      isDone,
      currentText: text
    });
  };

  try {
    let lastAggregatedParts: any[] = [];
    while (keepGoing && stepCount < maxSteps) {
      stepCount++;
      
      let responseStream = await ai.models.generateContentStream({
        model: MODEL_NAME,
        contents: contents,
        config: config
      });

      let turnText = "";
      let functionCalls: any[] = [];
      let aggregatedParts: any[] = [];
      let lastChunkResponse: any = null;

      // Create a text step for this stream turn if it's the final or if it produces text
      const textStepId = Math.random().toString();
      let hasAddedTextStep = false;
      const turnStartTime = performance.now();

      for await (const chunk of responseStream) {
        lastChunkResponse = chunk;
        if (chunk.candidates?.[0]?.content?.parts) {
            aggregatedParts.push(...chunk.candidates[0].content.parts);
        }
        if (chunk.text) {
          if (!hasAddedTextStep) {
            steps.push({ id: textStepId, type: 'text', content: "", status: 'streaming' });
            hasAddedTextStep = true;
          }
          turnText += chunk.text;
          const stepIndex = steps.findIndex(s => s.id === textStepId);
          if (stepIndex > -1) {
            steps[stepIndex].content = turnText;
          }
          finalFullText += chunk.text;
          notify(false, finalFullText);
        }
        if (chunk.functionCalls) {
          functionCalls.push(...chunk.functionCalls);
        }
      }

      lastAggregatedParts = aggregatedParts;

      const turnEndTime = performance.now();

      if (hasAddedTextStep) {
        const stepIndex = steps.findIndex(s => s.id === textStepId);
        if (stepIndex > -1) {
          steps[stepIndex].status = 'completed';
          steps[stepIndex].latencyMs = turnEndTime - turnStartTime;
        }
        notify(false, finalFullText);
      }

      // Reconstruct full response candidate for history appending
      if (aggregatedParts.length > 0 && functionCalls.length > 0) {
          // If we had function calls, append them back to contents
          // The SDK requires passing back what the model outputted
          contents.push({
              role: "model",
              parts: aggregatedParts
          });

          const toolResults = [];

          for (const call of functionCalls) {
            const stepId = call.id || Math.random().toString();
            steps.push({
              id: stepId,
              type: 'tool',
              toolName: call.name,
              toolArgs: call.args,
              status: 'streaming'
            });
            notify(false, finalFullText);

            const toolStartTime = performance.now();
            let output: any = { success: true };
            
            if (call.name === "analyze_sales_performance") {
              const yearMatch = call.args.date_range ? String(call.args.date_range).match(/\d{4}/) : null;
              const year = yearMatch ? yearMatch[0] : "";
              const relevantOrders = MOCK_DB.orders.filter(o => {
                const matchesYear = !year || (o.date && o.date.startsWith(year));
                const matchesCity = !call.args.city || (o.city && o.city.toLowerCase() === String(call.args.city).toLowerCase());
                return matchesYear && matchesCity;
              });
              const totalRevenue = relevantOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
              const totalOrders = relevantOrders.length;
              
              const monthlyBreakdown = relevantOrders.reduce((acc: any, order) => {
                const date = new Date(order.date);
                const month = date.toLocaleString('default', { month: 'short' }) + ' ' + date.getFullYear();
                if (!acc[month]) acc[month] = { revenue: 0, orders: 0 };
                acc[month].revenue += order.amount || 0;
                acc[month].orders += 1;
                return acc;
              }, {});

              const formattedMonthly = Object.entries(monthlyBreakdown).map(([month, stats]: any) => ({
                month,
                revenue: Math.round(stats.revenue * 100) / 100,
                orders: stats.orders
              }));

              const cityBreakdown = relevantOrders.reduce((acc: any, order) => {
                const city = order.city || 'unknown';
                if (!acc[city]) acc[city] = { revenue: 0, orders: 0 };
                acc[city].revenue += order.amount || 0;
                acc[city].orders += 1;
                return acc;
              }, {});

              const topCities = Object.entries(cityBreakdown)
                .map(([city, stats]: any) => ({ city, revenue: Math.round(stats.revenue * 100) / 100, orders: stats.orders }))
                .sort((a: any, b: any) => b.revenue - a.revenue)
                .slice(0, 10);
                
              const statusBreakdown = relevantOrders.reduce((acc: any, order) => {
                const status = order.status || 'unknown';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
              }, {});

              const data = { 
                revenue: Math.round(totalRevenue * 100) / 100, 
                orders: totalOrders,
                monthly_breakdown: formattedMonthly,
                top_cities_revenue: topCities,
                order_status_breakdown: statusBreakdown
              };
              output = { success: true, message: `Sales data fetched for ${call.args.date_range}`, data };
              await new Promise(r => setTimeout(r, 800));
            } else if (call.name === "investigate_shipping_delays") {
              const delayedOrders = MOCK_DB.orders.filter(o => o.status === "Delayed" && (!call.args.region || o.city === call.args.region));
              
              const cityBreakdown = delayedOrders.reduce((acc: any, order) => {
                acc[order.city] = (acc[order.city] || 0) + 1;
                return acc;
              }, {});

              const topDelayedCities = Object.entries(cityBreakdown)
                .map(([city, count]) => ({ city, count }))
                .sort((a: any, b: any) => b.count - a.count)
                .slice(0, 5);

              output = { 
                success: true, 
                message: `Found ${delayedOrders.length} delayed orders.`, 
                total_delayed: delayedOrders.length,
                breakdown_by_city: topDelayedCities,
                data: delayedOrders.slice(0, 10)
              };
              await new Promise(r => setTimeout(r, 800));
            } else if (call.name === "analyze_customer_sentiment") {
              let relevantReviews = MOCK_DB.reviews;
              if (call.args.product_category) {
                relevantReviews = relevantReviews.filter(r => r.product_category === call.args.product_category);
              }
              if (call.args.score_filter) {
                relevantReviews = relevantReviews.filter(r => r.score === call.args.score_filter);
              }
              
              const scoreDistribution = relevantReviews.reduce((acc: any, rev) => {
                acc[`${rev.score}_star`] = (acc[`${rev.score}_star`] || 0) + 1;
                return acc;
              }, {});

              output = { 
                success: true, 
                message: `Fetched ${relevantReviews.length} reviews.`, 
                score_distribution: scoreDistribution,
                data: relevantReviews.slice(0, 10).map(r => {
                  const order = MOCK_DB.orders.find(o => o.order_id === r.order_id);
                  return { ...r, order_amount: order ? order.amount : undefined };
                })
              };
              await new Promise(r => setTimeout(r, 800));
            } else if (call.name === "issue_refund") {
              let order = MOCK_DB.orders.find((o: any) => o.order_id === call.args.order_id);
              if (order) {
                order.status = "Refunded";
                output = { success: true, message: `Refund of $${call.args.refund_amount} issued for order ${call.args.order_id}.` };
              } else {
                output = { success: false, message: `Order ${call.args.order_id} not found.` };
              }
              await new Promise(r => setTimeout(r, 800));
            } else if (call.name === "draft_customer_response") {
              MOCK_DB.customer_responses.push(call.args);
              output = { success: true, message: `Draft response saved for customer ${call.args.customer_id}.` };
              await new Promise(r => setTimeout(r, 800));
            } else if (call.name === "generate_yearly_report") {
              MOCK_DB.reports.push(call.args);
              output = { success: true, message: "Report generated", reportId: MOCK_DB.reports.length };
              await new Promise(r => setTimeout(r, 800));
            } else if (call.name === "create_operations_dashboard") {
              MOCK_DB.dashboards.push(call.args);
              output = { success: true, message: "Dashboard created", dashboardId: MOCK_DB.dashboards.length };
              await new Promise(r => setTimeout(r, 800));
            } else if (call.name === "start_ai_agent") {
              try {
                const startAiTask = performance.now();
                const subAgentResponse = await ai.models.generateContent({
                  model: MODEL_NAME,
                  contents: [
                    { role: "user", parts: [{ text: `You are an autonomous sub-agent named ${call.args.agent_name}. Your task is: ${call.args.task_description}. Return your final result or report.` }] }
                  ]
                });
                const resultText = subAgentResponse.text;
                const endAiTask = performance.now();
                const latency = endAiTask - startAiTask;
                MOCK_DB.agents.push({ name: call.args.agent_name, task: call.args.task_description, result: resultText, latencyMs: latency });
                output = { success: true, message: "Agent completed task", result: resultText, latencyMs: latency };
              } catch (err: any) {
                output = { success: false, error: err.message };
              }
            } else if (call.name === "create_product") {
              const generatedSku = generateSKU(call.args.category || "Lighting", call.args.title || "Product");
              const newProduct = {
                id: "prod_" + (MOCK_DB.products.length + 1),
                title: call.args.title,
                description: call.args.description,
                price: Number(call.args.price || 49.99),
                sku: call.args.sku && !call.args.sku.toUpperCase().startsWith("SKU-") ? call.args.sku : generatedSku,
                category: call.args.category || "Lighting",
                stock: Math.floor(Math.random() * 85) + 15,
                sales: 0,
                status: "Active",
                image: call.args.reference_image_theme && ["lamp", "chair", "candle", "accessory", "watch"].includes(String(call.args.reference_image_theme).toLowerCase())
                  ? {
                      lamp: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80",
                      chair: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=80",
                      candle: "https://images.unsplash.com/photo-1603006905393-0d5651bfef25?w=600&auto=format&fit=crop&q=80",
                      accessory: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80",
                      watch: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"
                    }[String(call.args.reference_image_theme).toLowerCase()]
                  : "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80"
              };
              MOCK_DB.products.push(newProduct);
              notifyDbChanged();
              output = { success: true, message: `Product listed: ${call.args.title}`, product: newProduct };
              await new Promise(r => setTimeout(r, 600));
            } else if (call.name === "optimize_product_image") {
              const prod = MOCK_DB.products.find(p => p.id === call.args.product_id) || MOCK_DB.products[MOCK_DB.products.length - 1];
              if (prod) {
                if (call.args.action === "remove_bg") {
                  prod.image_status = "Background Removed";
                } else if (call.args.action === "resize") {
                  prod.image_status = "Resized to 1080x1080";
                } else if (call.args.action === "search") {
                  prod.image_status = "Clean Studio Light Search";
                } else if (call.args.action === "generate_banner") {
                  prod.image_status = "Promo Banner Generated";
                }
                notifyDbChanged();
                output = { success: true, message: `Action '${call.args.action}' applied to ${prod.title}.`, action: call.args.action, product_id: prod.id };
              } else {
                output = { success: false, message: "No active products found to optimize." };
              }
              await new Promise(r => setTimeout(r, 600));
            } else if (call.name === "generate_campaign_copy") {
              const newCamp = {
                id: "camp_" + (MOCK_DB.campaigns.length + 1),
                product_name: call.args.product_name,
                channel: call.args.channel,
                tone: call.args.tone,
                content: call.args.generated_text,
                status: "Ready"
              };
              MOCK_DB.campaigns.push(newCamp);
              notifyDbChanged();
              output = { success: true, message: `Campaign created for ${call.args.product_name}`, campaign: newCamp };
              await new Promise(r => setTimeout(r, 600));
            } else if (call.name === "set_store_theme") {
              MOCK_DB.theme.themeStyle = call.args.themeStyle;
              MOCK_DB.theme.bannerTitle = call.args.bannerTitle;
              MOCK_DB.theme.bannerSubtitle = call.args.bannerSubtitle;
              if (call.args.primaryColor) MOCK_DB.theme.primaryColor = call.args.primaryColor;
              if (call.args.layoutConfig) MOCK_DB.theme.layoutConfig = call.args.layoutConfig;
              
              const t = String(call.args.themeStyle).toLowerCase();
              if (t === 'apple') {
                MOCK_DB.theme.bannerImage = "https://images.unsplash.com/photo-1510519138101-570d1dca3d66?w=1600&auto=format&fit=crop&q=80";
                MOCK_DB.theme.primaryColor = "#1D1D1F";
              } else if (t === 'cyber') {
                MOCK_DB.theme.bannerImage = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&auto=format&fit=crop&q=80";
                MOCK_DB.theme.primaryColor = "#FF6600";
              } else if (t === 'sunset') {
                MOCK_DB.theme.bannerImage = "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1600&auto=format&fit=crop&q=80";
                MOCK_DB.theme.primaryColor = "#EA580C";
              } else {
                MOCK_DB.theme.bannerImage = "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1600&auto=format&fit=crop&q=80";
                MOCK_DB.theme.primaryColor = "#4F46E5";
              }
              notifyDbChanged();
              output = { success: true, message: `Theme adjusted to: ${call.args.themeStyle}`, theme: MOCK_DB.theme };
              await new Promise(r => setTimeout(r, 600));
            }

            const toolEndTime = performance.now();

            const stepIndex = steps.findIndex(s => s.id === stepId);
            if (stepIndex > -1) {
              steps[stepIndex].status = 'completed';
              steps[stepIndex].result = output;
              steps[stepIndex].latencyMs = toolEndTime - toolStartTime;
            }
            notify(false, finalFullText);

            toolResults.push({
              name: call.name,
              result: output
            });
          }

          if (toolResults.length > 0) {
              const functionResponseParts = toolResults.map(tr => ({
                  functionResponse: {
                      name: tr.name,
                      response: tr.result
                  }
              }));
              
              contents.push({
                  role: "user",
                  parts: functionResponseParts
              });
          } else {
              keepGoing = false;
          }
      } else {
        keepGoing = false;
      }
    }

    const generatedReport = steps.some(s => s.type === 'tool' && s.toolName === "generate_yearly_report");
    const generatedDashboard = steps.some(s => s.type === 'tool' && s.toolName === "create_operations_dashboard");

    const modelMsg: ChatMessage = {
      role: "model",
      parts: lastAggregatedParts.length > 0 ? lastAggregatedParts : [{ text: finalFullText || "" }],
      timestamp: new Date(),
      latencyMs: performance.now() - totalStartTime,
      hasReport: generatedReport,
      hasDashboard: generatedDashboard
    };
    currentHistory.push(modelMsg);
    
    notify(true, "");

  } catch (error: any) {
    console.error("Agent Error:", error);
    const errorMsg: ChatMessage = {
      role: "model",
      parts: [{ text: `I encountered an error while processing your request: ${error?.message || error}. Please try again.` }],
      timestamp: new Date(),
      latencyMs: performance.now() - totalStartTime,
    };
    currentHistory.push(errorMsg);
    notify(true, "");
  }
}

export async function sendMessageToAgent(
  history: ChatMessage[],
  newMessage: string,
  onToolCall?: (toolCall: ToolCall) => void
): Promise<ChatMessage[]> {
  // Convert our internal history format to Gemini's format
  // We need to handle tool responses carefully in a real app, 
  // but for this demo we'll simplify by just sending the text conversation 
  // and letting the model "think" it executed tools via the current turn.
  
  // Actually, to properly demonstrate multi-step, we should use the chat session.
  // However, since we are stateless between calls in this simple function, 
  // we'll instantiate a new chat each time with history.
  
    // We need to map our history to the SDK's Content format
    const sdkHistory = history
      .filter(h => h.role !== 'system') // Filter out system messages if any
      .map(h => {
        const { timestamp, latencyMs, groundingMetadata, ...content } = h;
        return content;
      });
console.log(MODEL_NAME)
    const contents: Content[] = [
      ...sdkHistory,
      { role: "user", parts: [{ text: newMessage }] }
    ];
    
    const config = {
      tools: tools,
      systemInstruction: `You are a top-tier E-Commerce Operations Agent. 
        Your goal is to autonomously analyze sales data, handle customer service tasks, manage orders, and build reporting artifacts.
        
        Capabilities:
        1. Analysis: Analyze sales performance using 'analyze_sales_performance' and 'investigate_shipping_delays'.
        2. Customer Service: Analyze feedback using 'analyze_customer_sentiment', draft responses with 'draft_customer_response', and process refunds using 'issue_refund'.
        3. Reporting: Synthesize findings into executive summaries using 'generate_yearly_report'.
        4. Visualization: Construct data dashboards for specific metrics using 'create_operations_dashboard'.
        5. Sub-Agents: For complex multi-step market research or deep-dive tasks, use 'start_ai_agent'.
  
        Behavior:
        - Be proactive and comprehensive. If asked about delayed orders, use 'investigate_shipping_delays' and proactively check reviews or issue refunds if appropriate.
        - CRITICAL: Never ask for missing details to complete a tool call if you can infer them or if it's a general request. If asked to "create a dashboard for sales", use 'analyze_sales_performance' to get data, then use 'create_operations_dashboard'.
        - STRICT TOOL USAGE: If the user explicitly asks for a "report", you MUST use the 'generate_yearly_report' tool. If the user explicitly asks for a "dashboard", you MUST use the 'create_operations_dashboard' tool. Do not substitute one for the other.
        - When creating dashboards using 'create_operations_dashboard', always try to use aggregated data from tool results (like 'breakdown_by_city', 'monthly_breakdown', 'top_cities_revenue', 'order_status_breakdown', or 'score_distribution') to create rich, multi-bar/multi-line charts rather than single-metric dashboards.
        - When using 'generate_yearly_report', DO NOT just use top-line totals in the 'metrics' array. You MUST include specific, granular metrics (e.g., 'December Revenue', 'Processing Orders', 'Top City Revenue', etc.) based on the tool's detailed breakdown data to make the report cards highly specific to the user's query.
        - CRITICAL RULE FOR LABELS: When creating dashboards or reports, NEVER use generic labels like "Total Revenue" or "Total Orders" if the user asked for a specific filter (like a city, timeframe, or category). You MUST dynamically change the label to reflect the exact user request and the data (e.g., "Vianopolis Revenue", "Q3 2017 Orders", "Delivered Orders", etc.). The labels must clearly communicate exactly what data is being shown.
        - Ensure reports generated via 'generate_yearly_report' are extremely comprehensive. Include detailed analysis, specific metric objects with trends, and strategic recommendations. CRITICAL: Do NOT use markdown formatting (like **bold**, *italics*, or # headers) in the 'detailed_analysis' string for reports, keep it plain text.
        - CRITICAL RULE FOR MISSING DATA: If you use a tool (like 'analyze_sales_performance') and it returns 0 orders or 0 revenue, DO NOT hallucinate, invent, or estimate data. Explicitly inform the user that there is no data available for that timeframe or category, and DO NOT generate a report or dashboard. Note that the available database only contains records from 2017 and 2018.
        - CRITICAL RULE FOR RESPONDING: NEVER use the words "invent", "fake", "dummy", "generate realistic data", or "made up" in your text response to the user. Always speak to the user as if the data you pulled, processed, or generated is 100% real and already existed in the database. Be confident and professional.
        - Be concise in text responses, but heavily leverage tools to showcase your advanced reasoning and versatile reporting capabilities.
        - Explain briefly what you are doing (e.g., "Analyzing Q3 sales data...", "Drafting customer response...", "Processing refund...").
        - When you call generate_yearly_report or create_operations_dashboard, do not output any conversational text afterwards.
        `,
    };

  
  let currentHistory = [...history];
  const totalStartTime = performance.now();
  
  // Add user message to history for the UI
  const userMsg: ChatMessage = { role: "user", parts: [{ text: newMessage }], timestamp: new Date() };
  currentHistory.push(userMsg);

  // Send message
  try {
    // Start the turn
    let result = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: config
    });

    // Loop for tool calls
    // The SDK might handle some, but often we need to check `functionCalls`
    
    let keepGoing = true;
    let maxSteps = 5;
    let step = 0;
    const allToolCallRecords: ToolCall[] = [];

    while (keepGoing && step < maxSteps) {
      step++;
      const response = result; // result IS the response
      
      // Check for function calls
      const functionCalls = response.functionCalls;
      
      if (functionCalls && functionCalls.length > 0) {
        // We have tool calls
        
        // Append the model's function calls to contents so the model has the context
        if (response.candidates && response.candidates[0].content) {
            contents.push(response.candidates[0].content);
        }

        const toolResults = [];
        const toolCallRecords: ToolCall[] = [];

        for (const call of functionCalls) {
          console.log("Tool Call:", call.name, call.args);
          
          // Notify UI
          const toolCallRecord: ToolCall = {
            id: call.id || Math.random().toString(), // SDK might not always give ID in all versions
            name: call.name,
            args: call.args as any,
          };
          toolCallRecords.push(toolCallRecord);
          allToolCallRecords.push(toolCallRecord);
          if (onToolCall) onToolCall(toolCallRecord);

          // Execute Tool
          let output: any = { success: true };
          
          if (call.name === "analyze_sales_performance") {
            const yearMatch = call.args.date_range ? String(call.args.date_range).match(/\d{4}/) : null;
            const year = yearMatch ? yearMatch[0] : "";
            const relevantOrders = MOCK_DB.orders.filter(o => {
              const matchesYear = !year || (o.date && o.date.startsWith(year));
              const matchesCity = !call.args.city || (o.city && o.city.toLowerCase() === String(call.args.city).toLowerCase());
              return matchesYear && matchesCity;
            });
            const totalRevenue = relevantOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
            const totalOrders = relevantOrders.length;
            
            const monthlyBreakdown = relevantOrders.reduce((acc: any, order) => {
              const date = new Date(order.date);
              const month = date.toLocaleString('default', { month: 'short' }) + ' ' + date.getFullYear();
              if (!acc[month]) acc[month] = { revenue: 0, orders: 0 };
              acc[month].revenue += order.amount || 0;
              acc[month].orders += 1;
              return acc;
            }, {});

            const formattedMonthly = Object.entries(monthlyBreakdown).map(([month, stats]: any) => ({
              month,
              revenue: Math.round(stats.revenue * 100) / 100,
              orders: stats.orders
            }));

            const cityBreakdown = relevantOrders.reduce((acc: any, order) => {
              const city = order.city || 'unknown';
              if (!acc[city]) acc[city] = { revenue: 0, orders: 0 };
              acc[city].revenue += order.amount || 0;
              acc[city].orders += 1;
              return acc;
            }, {});

            const topCities = Object.entries(cityBreakdown)
              .map(([city, stats]: any) => ({ city, revenue: Math.round(stats.revenue * 100) / 100, orders: stats.orders }))
              .sort((a: any, b: any) => b.revenue - a.revenue)
              .slice(0, 10);
              
            const statusBreakdown = relevantOrders.reduce((acc: any, order) => {
              const status = order.status || 'unknown';
              acc[status] = (acc[status] || 0) + 1;
              return acc;
            }, {});

            const data = { 
              revenue: Math.round(totalRevenue * 100) / 100, 
              orders: totalOrders,
              monthly_breakdown: formattedMonthly,
              top_cities_revenue: topCities,
              order_status_breakdown: statusBreakdown
            };
            output = { success: true, message: `Sales data fetched for ${call.args.date_range}`, data };
          } else if (call.name === "investigate_shipping_delays") {
            const delayedOrders = MOCK_DB.orders.filter(o => o.status === "Delayed" && (!call.args.region || o.city === call.args.region));
            
            const cityBreakdown = delayedOrders.reduce((acc: any, order) => {
              acc[order.city] = (acc[order.city] || 0) + 1;
              return acc;
            }, {});

            const topDelayedCities = Object.entries(cityBreakdown)
              .map(([city, count]) => ({ city, count }))
              .sort((a: any, b: any) => b.count - a.count)
              .slice(0, 5);

            output = { 
              success: true, 
              message: `Found ${delayedOrders.length} delayed orders.`, 
              total_delayed: delayedOrders.length,
              breakdown_by_city: topDelayedCities,
              data: delayedOrders.slice(0, 10)
            };
          } else if (call.name === "analyze_customer_sentiment") {
            let relevantReviews = MOCK_DB.reviews;
            if (call.args.product_category) {
              relevantReviews = relevantReviews.filter(r => r.product_category === call.args.product_category);
            }
            if (call.args.score_filter) {
              relevantReviews = relevantReviews.filter(r => r.score === call.args.score_filter);
            }
            
            const scoreDistribution = relevantReviews.reduce((acc: any, rev) => {
              acc[`${rev.score}_star`] = (acc[`${rev.score}_star`] || 0) + 1;
              return acc;
            }, {});

            output = { 
              success: true, 
              message: `Fetched ${relevantReviews.length} reviews.`, 
              score_distribution: scoreDistribution,
              data: relevantReviews.slice(0, 10) 
            };
          } else if (call.name === "issue_refund") {
            let order = MOCK_DB.orders.find((o: any) => o.order_id === call.args.order_id);
            if (order) {
              order.status = "Refunded";
              output = { success: true, message: `Refund of $${call.args.refund_amount} issued for order ${call.args.order_id}.` };
            } else {
              output = { success: false, message: `Order ${call.args.order_id} not found.` };
            }
          } else if (call.name === "draft_customer_response") {
            MOCK_DB.customer_responses.push(call.args);
            output = { success: true, message: `Draft response saved for customer ${call.args.customer_id}.` };
          } else if (call.name === "generate_yearly_report") {
            MOCK_DB.reports.push(call.args);
            output = { success: true, message: "Report generated", reportId: MOCK_DB.reports.length };
          } else if (call.name === "create_operations_dashboard") {
            MOCK_DB.dashboards.push(call.args);
            output = { success: true, message: "Dashboard created", dashboardId: MOCK_DB.dashboards.length };
          } else if (call.name === "start_ai_agent") {
            try {
              // Create an autonomous sub-agent call
              const startAiTask = performance.now();
              const subAgentResponse = await ai.models.generateContent({
                model: MODEL_NAME,
                contents: [
                  { role: "user", parts: [{ text: `You are an autonomous sub-agent named ${call.args.agent_name}. Your task is: ${call.args.task_description}. Return your final result or report.` }] }
                ]
              });
              const resultText = subAgentResponse.text;
              const latency = performance.now() - startAiTask;
              MOCK_DB.agents.push({ name: call.args.agent_name, task: call.args.task_description, result: resultText, latencyMs: latency });
              output = { success: true, message: "Agent completed task", result: resultText, latencyMs: latency };
            } catch (err: any) {
              output = { success: false, error: err.message };
            }
          }

          
          toolResults.push({
            id: call.id, // Must match the call ID
            name: call.name,
            result: output
          });
        }

        // Send results back to model
        // If we have function calls, we MUST send the response back
        if (toolResults.length > 0) {
            // Construct the tool response parts
            const functionResponseParts = toolResults.map(tr => ({
                functionResponse: {
                    name: tr.name,
                    response: tr.result
                }
            }));
            
            contents.push({
                role: "user",
                parts: functionResponseParts
            });
            
            result = await ai.models.generateContent({
              model: MODEL_NAME,
              contents: contents,
              config: config
            });
        } else {
            keepGoing = false;
        }

      } else {
        // No function calls, just text
        keepGoing = false;
      }
    }

    // Check if report or dashboard was generated during this turn
    const generatedReport = allToolCallRecords.some(t => t.name === "generate_yearly_report");
    const generatedDashboard = allToolCallRecords.some(t => t.name === "create_operations_dashboard");

    // Final response from model
    const modelMsg: ChatMessage = {
      role: "model",
      parts: [{ text: result.text || "" }],
      timestamp: new Date(),
      groundingMetadata: result.candidates?.[0]?.groundingMetadata,
      latencyMs: performance.now() - totalStartTime,
      hasReport: generatedReport,
      hasDashboard: generatedDashboard
    };
    currentHistory.push(modelMsg);
    
    return currentHistory;

  } catch (error) {
    console.error("Agent Error:", error);
    const errorMsg: ChatMessage = {
      role: "model",
      parts: [{ text: "I encountered an error while processing your request. Please try again." }],
      timestamp: new Date(),
      latencyMs: performance.now() - totalStartTime,
    };
    currentHistory.push(errorMsg);
    return currentHistory;
  }
}

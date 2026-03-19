"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount } from "@/contexts/account-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui/popover";
import {
  ArrowLeft,
  DollarSign,
  Eye,
  MousePointerClick,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Percent,
  Users,
  Zap,
  Activity,
  Settings,
  Download,
  Pause,
  Play,
  Pencil,
  ArrowUpDown,
  Lightbulb,
  ChevronUp,
  ChevronDown,
  Minus,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────

interface DailyMetric {
  date: string;
  spend: number;
  revenue: number;
  impressions: number;
  reach: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
}

interface Totals {
  spend: number;
  revenue: number;
  profit: number;
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  uniqueClicks: number;
  linkClicks: number;
  ctr: number;
  uniqueCtr: number;
  cpc: number;
  cpm: number;
  conversions: number;
  conversionRate: number;
  costPerConversion: number;
  roas: number;
  roi: number;
  videoViews: number;
  // Engagement
  engagement: number;
  postReactions: number;
  postComments: number;
  postShares: number;
  engagementRate: number;
  // Instagram / Page
  followersGained: number;
  profileVisits: number;
  followerConversionRate: number;
  // Video extended
  videoPlays: number;
  videoThruplay: number;
  videoComplete: number;
  videoCompletionRate: number;
  // Creative fatigue
  creativeFatigueScore: number;
}

interface NewApiResponse {
  campaign: {
    id: string;
    name: string;
    status: string;
    objective: string;
    budget: number;
    platform: string;
  };
  totals: Totals;
  prevTotals: Totals;
  daily: DailyMetric[];
  sparklines: Record<string, number[]>;
}

interface OldDailyMetric {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
}

interface CampaignDetail {
  id: string;
  platform: string;
  campaign_name: string;
  status: string;
  objective: string;
  budget_amount: number;
  budget_currency: string;
  created_at: string;
}

type SortField = keyof DailyMetric;
type SortDir = "asc" | "desc";

// ── Constants ──────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  meta: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  google: "bg-red-500/20 text-red-400 border-red-500/30",
  tiktok: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  linkedin: "bg-sky-500/20 text-sky-400 border-sky-500/30",
};

const PLATFORM_LABELS: Record<string, string> = {
  meta: "Meta",
  google: "Google",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
};

const PERIOD_OPTIONS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
] as const;

const CHART_COLORS: Record<string, string> = {
  gasto: "#f97316",
  clics: "#3b82f6",
  conversiones: "#22c55e",
  ingresos: "#ec4899",
  impresiones: "#eab308",
  ctr: "#8b5cf6",
};

const CHART_KEY_MAP: Record<string, string> = {
  gasto: "spend",
  clics: "clicks",
  conversiones: "conversions",
  ingresos: "revenue",
  impresiones: "impressions",
  ctr: "ctr",
};

const ALL_KPI_KEYS = [
  "spend",
  "revenue",
  "profit",
  "roas",
  "impressions",
  "reach",
  "clicks",
  "ctr",
  "cpc",
  "cpm",
  "conversions",
  "costPerConversion",
  // Engagement
  "engagement",
  "engagementRate",
  "postReactions",
  "postComments",
  "postShares",
  // Instagram / Page
  "followersGained",
  "profileVisits",
  "followerConversionRate",
  // Video
  "videoViews",
  "videoPlays",
  "videoThruplay",
  "videoComplete",
  "videoCompletionRate",
  // Fatigue
  "frequency",
  "creativeFatigueScore",
] as const;

type KpiKey = (typeof ALL_KPI_KEYS)[number];

interface KpiConfig {
  key: KpiKey;
  label: string;
  icon: React.ReactNode;
  format: (v: number) => string;
  higherIsBetter: boolean;
}

const KPI_CONFIGS: KpiConfig[] = [
  {
    key: "spend",
    label: "Gasto",
    icon: <DollarSign className="size-4" />,
    format: (v) => `$${fmtNum(v)}`,
    higherIsBetter: false,
  },
  {
    key: "revenue",
    label: "Ingresos",
    icon: <TrendingUp className="size-4" />,
    format: (v) => `$${fmtNum(v)}`,
    higherIsBetter: true,
  },
  {
    key: "profit",
    label: "Ganancia",
    icon: <Zap className="size-4" />,
    format: (v) => `$${fmtNum(v)}`,
    higherIsBetter: true,
  },
  {
    key: "roas",
    label: "ROAS",
    icon: <Activity className="size-4" />,
    format: (v) => `${v.toFixed(2)}x`,
    higherIsBetter: true,
  },
  {
    key: "impressions",
    label: "Impresiones",
    icon: <Eye className="size-4" />,
    format: (v) => fmtNum(v),
    higherIsBetter: true,
  },
  {
    key: "reach",
    label: "Alcance",
    icon: <Users className="size-4" />,
    format: (v) => fmtNum(v),
    higherIsBetter: true,
  },
  {
    key: "clicks",
    label: "Clics",
    icon: <MousePointerClick className="size-4" />,
    format: (v) => fmtNum(v),
    higherIsBetter: true,
  },
  {
    key: "ctr",
    label: "CTR",
    icon: <Percent className="size-4" />,
    format: (v) => `${v.toFixed(2)}%`,
    higherIsBetter: true,
  },
  {
    key: "cpc",
    label: "CPC",
    icon: <DollarSign className="size-4" />,
    format: (v) => `$${v.toFixed(2)}`,
    higherIsBetter: false,
  },
  {
    key: "cpm",
    label: "CPM",
    icon: <BarChart3 className="size-4" />,
    format: (v) => `$${v.toFixed(2)}`,
    higherIsBetter: false,
  },
  {
    key: "conversions",
    label: "Conversiones",
    icon: <Target className="size-4" />,
    format: (v) => fmtNum(v),
    higherIsBetter: true,
  },
  {
    key: "costPerConversion",
    label: "Costo / Conv",
    icon: <DollarSign className="size-4" />,
    format: (v) => `$${v.toFixed(2)}`,
    higherIsBetter: false,
  },
  // ── Interacción ──
  {
    key: "engagement",
    label: "Interacciones",
    icon: <Zap className="size-4" />,
    format: (v) => fmtNum(v),
    higherIsBetter: true,
  },
  {
    key: "engagementRate",
    label: "Tasa Interacción",
    icon: <Percent className="size-4" />,
    format: (v) => `${v.toFixed(2)}%`,
    higherIsBetter: true,
  },
  {
    key: "postReactions",
    label: "Reacciones",
    icon: <Activity className="size-4" />,
    format: (v) => fmtNum(v),
    higherIsBetter: true,
  },
  {
    key: "postComments",
    label: "Comentarios",
    icon: <Activity className="size-4" />,
    format: (v) => fmtNum(v),
    higherIsBetter: true,
  },
  {
    key: "postShares",
    label: "Compartidos",
    icon: <Activity className="size-4" />,
    format: (v) => fmtNum(v),
    higherIsBetter: true,
  },
  // ── Instagram / Página ──
  {
    key: "followersGained",
    label: "Seguidores +",
    icon: <Users className="size-4" />,
    format: (v) => fmtNum(v),
    higherIsBetter: true,
  },
  {
    key: "profileVisits",
    label: "Visitas Perfil",
    icon: <Eye className="size-4" />,
    format: (v) => fmtNum(v),
    higherIsBetter: true,
  },
  {
    key: "followerConversionRate",
    label: "Conv. Seguidores %",
    icon: <Percent className="size-4" />,
    format: (v) => `${v.toFixed(2)}%`,
    higherIsBetter: true,
  },
  // ── Video ──
  {
    key: "videoViews",
    label: "Vistas de Video",
    icon: <Eye className="size-4" />,
    format: (v) => fmtNum(v),
    higherIsBetter: true,
  },
  {
    key: "videoPlays",
    label: "Reproducciones",
    icon: <Play className="size-4" />,
    format: (v) => fmtNum(v),
    higherIsBetter: true,
  },
  {
    key: "videoThruplay",
    label: "ThruPlays",
    icon: <Play className="size-4" />,
    format: (v) => fmtNum(v),
    higherIsBetter: true,
  },
  {
    key: "videoComplete",
    label: "Video Completo",
    icon: <Play className="size-4" />,
    format: (v) => fmtNum(v),
    higherIsBetter: true,
  },
  {
    key: "videoCompletionRate",
    label: "% Completado",
    icon: <Percent className="size-4" />,
    format: (v) => `${v.toFixed(1)}%`,
    higherIsBetter: true,
  },
  // ── Fatiga ──
  {
    key: "frequency",
    label: "Frecuencia",
    icon: <Activity className="size-4" />,
    format: (v) => v.toFixed(2),
    higherIsBetter: false,
  },
  {
    key: "creativeFatigueScore",
    label: "Fatiga Creativa",
    icon: <TrendingDown className="size-4" />,
    format: (v) => `${v.toFixed(0)}/100`,
    higherIsBetter: false,
  },
];

// ── Helpers ────────────────────────────────────────────────────────

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(n % 1 === 0 ? 0 : 2);
}

function deltaPercent(curr: number, prev: number): number | null {
  if (prev === 0) return curr > 0 ? 100 : null;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

function computeTotalsFromOld(data: OldDailyMetric[]): Totals {
  const t = data.reduce(
    (acc, m) => ({
      impressions: acc.impressions + m.impressions,
      clicks: acc.clicks + m.clicks,
      spend: acc.spend + m.spend,
      conversions: acc.conversions + m.conversions,
      revenue: acc.revenue + m.revenue,
    }),
    { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 }
  );
  const ctr = t.impressions > 0 ? (t.clicks / t.impressions) * 100 : 0;
  const cpc = t.clicks > 0 ? t.spend / t.clicks : 0;
  const cpm = t.impressions > 0 ? (t.spend / t.impressions) * 1000 : 0;
  const roas = t.spend > 0 ? t.revenue / t.spend : 0;
  const profit = t.revenue - t.spend;
  const convRate = t.clicks > 0 ? (t.conversions / t.clicks) * 100 : 0;
  const costPerConv = t.conversions > 0 ? t.spend / t.conversions : 0;
  const roi = t.spend > 0 ? (profit / t.spend) * 100 : 0;
  return {
    spend: t.spend,
    revenue: t.revenue,
    profit,
    impressions: t.impressions,
    reach: 0,
    frequency: 0,
    clicks: t.clicks,
    uniqueClicks: 0,
    linkClicks: 0,
    ctr,
    uniqueCtr: 0,
    cpc,
    cpm,
    conversions: t.conversions,
    conversionRate: convRate,
    costPerConversion: costPerConv,
    roas,
    roi,
    videoViews: 0,
    engagement: 0,
    postReactions: 0,
    postComments: 0,
    postShares: 0,
    engagementRate: 0,
    followersGained: 0,
    profileVisits: 0,
    followerConversionRate: 0,
    videoPlays: 0,
    videoThruplay: 0,
    videoComplete: 0,
    videoCompletionRate: 0,
    creativeFatigueScore: 0,
  };
}

function convertOldDaily(data: OldDailyMetric[]): DailyMetric[] {
  return data.map((m) => ({
    date: m.date,
    spend: m.spend,
    revenue: m.revenue,
    impressions: m.impressions,
    reach: 0,
    clicks: m.clicks,
    conversions: m.conversions,
    ctr: m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0,
    cpc: m.clicks > 0 ? m.spend / m.clicks : 0,
    cpm: m.impressions > 0 ? (m.spend / m.impressions) * 1000 : 0,
    roas: m.spend > 0 ? m.revenue / m.spend : 0,
  }));
}

function emptyTotals(): Totals {
  return {
    spend: 0,
    revenue: 0,
    profit: 0,
    impressions: 0,
    reach: 0,
    frequency: 0,
    clicks: 0,
    uniqueClicks: 0,
    linkClicks: 0,
    ctr: 0,
    uniqueCtr: 0,
    cpc: 0,
    cpm: 0,
    conversions: 0,
    conversionRate: 0,
    costPerConversion: 0,
    roas: 0,
    roi: 0,
    videoViews: 0,
    engagement: 0,
    postReactions: 0,
    postComments: 0,
    postShares: 0,
    engagementRate: 0,
    followersGained: 0,
    profileVisits: 0,
    followerConversionRate: 0,
    videoPlays: 0,
    videoThruplay: 0,
    videoComplete: 0,
    videoCompletionRate: 0,
    creativeFatigueScore: 0,
  };
}

const LS_KEY_VISIBLE_KPIS = "campaign-visible-kpis";
const LS_KEY_CHART_METRICS = "campaign-chart-metrics";

function loadVisibleKpis(): KpiKey[] {
  if (typeof window === "undefined") return [...ALL_KPI_KEYS];
  try {
    const stored = localStorage.getItem(LS_KEY_VISIBLE_KPIS);
    if (stored) return JSON.parse(stored);
  } catch {
    /* ignore */
  }
  return [...ALL_KPI_KEYS];
}

function saveVisibleKpis(keys: KpiKey[]) {
  try {
    localStorage.setItem(LS_KEY_VISIBLE_KPIS, JSON.stringify(keys));
  } catch {
    /* ignore */
  }
}

function loadChartMetrics(): string[] {
  if (typeof window === "undefined") return ["gasto", "clics", "conversiones", "ingresos"];
  try {
    const stored = localStorage.getItem(LS_KEY_CHART_METRICS);
    if (stored) return JSON.parse(stored);
  } catch {
    /* ignore */
  }
  return ["gasto", "clics", "conversiones", "ingresos"];
}

function saveChartMetrics(keys: string[]) {
  try {
    localStorage.setItem(LS_KEY_CHART_METRICS, JSON.stringify(keys));
  } catch {
    /* ignore */
  }
}

// ── Glassmorphism wrapper ──────────────────────────────────────────

function GlassCard({
  children,
  className = "",
  glowColor,
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-5 ${className}`}
      style={
        glowColor
          ? { boxShadow: `0 0 20px -5px ${glowColor}, inset 0 1px 0 0 rgba(255,255,255,0.05)` }
          : { boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)" }
      }
    >
      {children}
    </div>
  );
}

// ── Mini sparkline ─────────────────────────────────────────────────

function MiniSparkline({
  data,
  color,
  width = 80,
  height = 28,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <polyline
        fill={`url(#spark-${color.replace("#", "")})`}
        stroke="none"
        points={`0,${height} ${points} ${width},${height}`}
      />
    </svg>
  );
}

// ── Custom chart tooltip ───────────────────────────────────────────

interface ChartTooltipPayload {
  dataKey: string;
  color: string;
  value: number;
  name: string;
}

function CustomChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ChartTooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-black/80 backdrop-blur-md px-3 py-2 shadow-xl">
      <p className="text-xs text-text-dim mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
          <span className="size-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-text-secondary capitalize">{entry.name}:</span>
          <span className="text-text-primary font-medium">
            {entry.dataKey === "spend" || entry.dataKey === "revenue" || entry.dataKey === "cpc" || entry.dataKey === "cpm"
              ? `$${fmtNum(entry.value)}`
              : fmtNum(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── CSV Export ──────────────────────────────────────────────────────

function exportCsv(daily: DailyMetric[], campaignName: string) {
  const headers = [
    "Fecha",
    "Impresiones",
    "Alcance",
    "Clics",
    "CTR",
    "CPC",
    "CPM",
    "Gasto",
    "Conversiones",
    "Ingresos",
    "ROAS",
  ];
  const rows = daily.map((d) =>
    [
      d.date,
      d.impressions,
      d.reach,
      d.clicks,
      d.ctr.toFixed(2),
      d.cpc.toFixed(2),
      d.cpm.toFixed(2),
      d.spend.toFixed(2),
      d.conversions,
      d.revenue.toFixed(2),
      d.roas.toFixed(2),
    ].join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${campaignName.replace(/\s+/g, "_")}_metrics.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main Component ─────────────────────────────────────────────────

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [totals, setTotals] = useState<Totals>(emptyTotals());
  const [prevTotals, setPrevTotals] = useState<Totals>(emptyTotals());
  const [daily, setDaily] = useState<DailyMetric[]>([]);
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const [visibleKpis, setVisibleKpis] = useState<KpiKey[]>(loadVisibleKpis);
  const [chartMetrics, setChartMetrics] = useState<string[]>(loadChartMetrics);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Load campaign info - try with accountId for live Meta data, fallback to DB
  const { selectedAccountId } = useAccount();
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedAccountId) params.set("accountId", selectedAccountId);
    fetch(`/api/platforms/campaigns?${params}`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        // Match by id (Meta campaign ID) or by platform_campaign_id
        const c = list.find(
          (x: CampaignDetail & { platform_campaign_id?: string }) =>
            x.id === id || x.platform_campaign_id === id
        );
        if (c) setCampaign(c);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, selectedAccountId]);

  // Load metrics when campaign or period changes
  useEffect(() => {
    if (!campaign) return;
    setMetricsLoading(true);
    const end = new Date().toISOString().split("T")[0];
    const start = new Date(Date.now() - period * 86400000)
      .toISOString()
      .split("T")[0];

    const metricsParams = new URLSearchParams({ startDate: start, endDate: end });
    if (selectedAccountId) metricsParams.set("accountId", selectedAccountId);
    fetch(
      `/api/platforms/${campaign.platform}/campaigns/${id}/metrics?${metricsParams}`
    )
      .then((r) => r.json())
      .then((data) => {
        // Detect new vs old format
        if (data && typeof data === "object" && "totals" in data) {
          // New format
          const resp = data as NewApiResponse;
          setTotals(resp.totals);
          setPrevTotals(resp.prevTotals || emptyTotals());
          setDaily(resp.daily || []);
          setSparklines(resp.sparklines || {});
        } else if (Array.isArray(data)) {
          // Old format
          const oldData = data as OldDailyMetric[];
          setTotals(computeTotalsFromOld(oldData));
          setPrevTotals(emptyTotals());
          setDaily(convertOldDaily(oldData));
          // Build sparklines from old data
          const sp: Record<string, number[]> = {};
          sp.spend = oldData.map((d) => d.spend);
          sp.impressions = oldData.map((d) => d.impressions);
          sp.clicks = oldData.map((d) => d.clicks);
          sp.conversions = oldData.map((d) => d.conversions);
          sp.revenue = oldData.map((d) => d.revenue);
          setSparklines(sp);
        }
      })
      .catch(() => {})
      .finally(() => setMetricsLoading(false));
  }, [campaign, id, period]);

  // Toggle KPI visibility
  const toggleKpi = useCallback(
    (key: KpiKey) => {
      setVisibleKpis((prev) => {
        const next = prev.includes(key)
          ? prev.filter((k) => k !== key)
          : [...prev, key];
        saveVisibleKpis(next);
        return next;
      });
    },
    []
  );

  // Toggle chart metric
  const toggleChartMetric = useCallback((key: string) => {
    setChartMetrics((prev) => {
      const next = prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key];
      saveChartMetrics(next);
      return next;
    });
  }, []);

  // Sort handler
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("desc");
      }
    },
    [sortField]
  );

  // Sorted daily data
  const sortedDaily = useMemo(() => {
    const copy = [...daily];
    copy.sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc"
          ? av.localeCompare(bv)
          : bv.localeCompare(av);
      }
      const an = av as number;
      const bn = bv as number;
      return sortDir === "asc" ? an - bn : bn - an;
    });
    return copy;
  }, [daily, sortField, sortDir]);

  // Day-of-week aggregation for bar chart
  const dayOfWeekData = useMemo(() => {
    const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const buckets: Record<string, { count: number; spend: number; clicks: number; conversions: number }> = {};
    DAYS.forEach((d) => (buckets[d] = { count: 0, spend: 0, clicks: 0, conversions: 0 }));
    daily.forEach((m) => {
      const dayName = DAYS[new Date(m.date + "T00:00:00").getDay()];
      if (buckets[dayName]) {
        buckets[dayName].count++;
        buckets[dayName].spend += m.spend;
        buckets[dayName].clicks += m.clicks;
        buckets[dayName].conversions += m.conversions;
      }
    });
    return DAYS.map((d) => ({
      day: d,
      avgSpend: buckets[d].count > 0 ? buckets[d].spend / buckets[d].count : 0,
      avgClicks: buckets[d].count > 0 ? buckets[d].clicks / buckets[d].count : 0,
      avgConversions: buckets[d].count > 0 ? buckets[d].conversions / buckets[d].count : 0,
    }));
  }, [daily]);

  // Funnel data
  const funnelData = useMemo(() => {
    return [
      { name: "Impresiones", value: totals.impressions, color: "#f97316" },
      { name: "Clics", value: totals.clicks, color: "#3b82f6" },
      { name: "Conversiones", value: totals.conversions, color: "#22c55e" },
    ];
  }, [totals]);

  // Insights
  const insights = useMemo(() => {
    if (daily.length === 0) return [];
    const result: { text: string; type: "good" | "bad" | "neutral" }[] = [];

    // Best day by ROAS
    const bestRoas = daily.reduce((best, d) =>
      d.roas > (best?.roas ?? 0) ? d : best, daily[0]);
    if (bestRoas && bestRoas.roas > 0) {
      result.push({
        text: `Mejor día por ROAS: ${bestRoas.date} (${bestRoas.roas.toFixed(2)}x)`,
        type: "good",
      });
    }

    // Peor día por gasto (mayor gasto, menor ratio de conversiones)
    const worstDay = daily.reduce((worst, d) => {
      const ratio = d.spend > 0 ? d.conversions / d.spend : Infinity;
      const worstRatio = worst.spend > 0 ? worst.conversions / worst.spend : Infinity;
      return ratio < worstRatio ? d : worst;
    }, daily[0]);
    if (worstDay) {
      result.push({
        text: `Día menos eficiente: ${worstDay.date} ($${worstDay.spend.toFixed(2)} gastado, ${worstDay.conversions} conv)`,
        type: "bad",
      });
    }

    // Gasto diario promedio
    const avgSpend = totals.spend / (daily.length || 1);
    result.push({
      text: `Gasto diario promedio: $${avgSpend.toFixed(2)}`,
      type: "neutral",
    });

    // Tendencia
    if (daily.length >= 4) {
      const half = Math.floor(daily.length / 2);
      const sorted = [...daily].sort((a, b) => a.date.localeCompare(b.date));
      const firstHalfSpend = sorted.slice(0, half).reduce((s, d) => s + d.revenue, 0);
      const secondHalfSpend = sorted.slice(half).reduce((s, d) => s + d.revenue, 0);
      if (secondHalfSpend > firstHalfSpend * 1.1) {
        result.push({ text: "Ingresos en tendencia alcista", type: "good" });
      } else if (secondHalfSpend < firstHalfSpend * 0.9) {
        result.push({ text: "Ingresos en tendencia bajista", type: "bad" });
      } else {
        result.push({ text: "Ingresos estables", type: "neutral" });
      }
    }

    return result;
  }, [daily, totals]);

  // Table totals row
  const tableTotals = useMemo(() => {
    return daily.reduce(
      (acc, d) => ({
        impressions: acc.impressions + d.impressions,
        reach: acc.reach + d.reach,
        clicks: acc.clicks + d.clicks,
        spend: acc.spend + d.spend,
        conversions: acc.conversions + d.conversions,
        revenue: acc.revenue + d.revenue,
      }),
      { impressions: 0, reach: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 }
    );
  }, [daily]);

  // ── Loading state ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-text-dim text-sm">Campaña no encontrada</p>
        <Button variant="outline" onClick={() => router.push("/app/campaigns")}>
          Volver a campañas
        </Button>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/app/campaigns"
            className="flex items-center justify-center size-9 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.06] transition-colors"
          >
            <ArrowLeft className="size-4 text-text-secondary" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary">
                {campaign.campaign_name}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                  PLATFORM_COLORS[campaign.platform] || "bg-gray-500/20 text-gray-400 border-gray-500/30"
                }`}
              >
                {PLATFORM_LABELS[campaign.platform] || campaign.platform}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span
                  className={`size-2 rounded-full ${
                    campaign.status === "ACTIVE" || campaign.status === "active"
                      ? "bg-success"
                      : campaign.status === "PAUSED" || campaign.status === "paused"
                      ? "bg-warning"
                      : "bg-text-dim"
                  }`}
                />
                {campaign.status}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="info">{campaign.objective}</Badge>
              <span className="text-xs text-text-dim">
                Presupuesto: ${campaign.budget_amount?.toLocaleString()}{" "}
                {campaign.budget_currency}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Period pills */}
          <div className="flex items-center rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-0.5">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                onClick={() => setPeriod(opt.days as 7 | 30 | 90)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  period === opt.days
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "text-text-dim hover:text-text-secondary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Action buttons */}
          <Button variant="outline" size="sm">
            {campaign.status === "ACTIVE" || campaign.status === "active" ? (
              <>
                <Pause className="size-3.5" data-icon="inline-start" />
                Pausar
              </>
            ) : (
              <>
                <Play className="size-3.5" data-icon="inline-start" />
                Reanudar
              </>
            )}
          </Button>
          <Button variant="outline" size="sm">
            <Pencil className="size-3.5" data-icon="inline-start" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCsv(daily, campaign.campaign_name)}
          >
            <Download className="size-3.5" data-icon="inline-start" />
            Exportar
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-text-dim uppercase tracking-wider">
            Métricas Clave
          </h2>
          <Popover>
            <PopoverTrigger>
              <button className="flex items-center gap-1.5 text-xs text-text-dim hover:text-text-secondary transition-colors">
                <Settings className="size-3.5" />
                Personalizar
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64">
              <PopoverHeader>
                <PopoverTitle>Métricas Visibles</PopoverTitle>
              </PopoverHeader>
              <div className="space-y-1 mt-2">
                {KPI_CONFIGS.map((cfg) => (
                  <label
                    key={cfg.key}
                    className="flex items-center gap-2 py-1 px-1 rounded hover:bg-white/5 cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={visibleKpis.includes(cfg.key)}
                      onChange={() => toggleKpi(cfg.key)}
                      className="accent-primary"
                    />
                    <span className="text-text-secondary">{cfg.label}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {metricsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {KPI_CONFIGS.filter((cfg) => visibleKpis.includes(cfg.key)).map(
              (cfg) => {
                const value = totals[cfg.key] ?? 0;
                const prevValue = prevTotals[cfg.key] ?? 0;
                const delta = deltaPercent(value, prevValue);
                const isPositive = delta !== null && delta > 0;
                const isGood =
                  delta !== null &&
                  ((cfg.higherIsBetter && delta > 0) ||
                    (!cfg.higherIsBetter && delta < 0));
                const glowColor =
                  delta !== null
                    ? isGood
                      ? "rgba(34, 197, 94, 0.15)"
                      : "rgba(239, 68, 68, 0.15)"
                    : undefined;
                const sparkData = sparklines[cfg.key] || [];

                return (
                  <GlassCard key={cfg.key} glowColor={glowColor}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-text-dim">{cfg.icon}</span>
                        <span className="text-xs text-text-dim font-medium">
                          {cfg.label}
                        </span>
                      </div>
                      {sparkData.length > 1 && (
                        <MiniSparkline
                          data={sparkData}
                          color={isGood ? "#22c55e" : delta !== null ? "#ef4444" : "#6b7280"}
                        />
                      )}
                    </div>
                    <p className="text-2xl font-bold text-text-primary mt-2">
                      {cfg.format(value)}
                    </p>
                    {delta !== null && (
                      <div
                        className={`flex items-center gap-1 mt-1 text-xs font-medium ${
                          isGood ? "text-success" : "text-error"
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="size-3" />
                        ) : (
                          <TrendingDown className="size-3" />
                        )}
                        {Math.abs(delta).toFixed(1)}% vs anterior
                      </div>
                    )}
                  </GlassCard>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* ── Main Chart ──────────────────────────────────────────── */}
      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-medium text-text-dim uppercase tracking-wider">
            Rendimiento en el Tiempo
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            {Object.keys(CHART_COLORS).map((key) => (
              <button
                key={key}
                onClick={() => toggleChartMetric(key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  chartMetrics.includes(key)
                    ? "border-white/20 bg-white/10 text-text-primary"
                    : "border-transparent bg-transparent text-text-dim hover:text-text-secondary"
                }`}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ background: CHART_COLORS[key] }}
                />
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {metricsLoading ? (
          <Skeleton className="h-72 w-full rounded-xl" />
        ) : daily.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={[...daily].sort((a, b) => a.date.localeCompare(b.date))}>
              <defs>
                {Object.entries(CHART_COLORS).map(([key, color]) => (
                  <linearGradient
                    key={key}
                    id={`gradient-${key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                tick={{ fontSize: 11 }}
                tickFormatter={(v: string) =>
                  new Date(v + "T00:00:00").toLocaleDateString("es-ES", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
              <RechartsTooltip content={<CustomChartTooltip />} />
              <Legend />
              {chartMetrics
                .filter((k) => CHART_COLORS[k])
                .map((key) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={CHART_KEY_MAP[key] || key}
                    name={key.charAt(0).toUpperCase() + key.slice(1)}
                    stroke={CHART_COLORS[key]}
                    fill={`url(#gradient-${key})`}
                    strokeWidth={2}
                  />
                ))}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-72 text-text-dim text-sm">
            Sin datos disponibles para este período
          </div>
        )}
      </GlassCard>

      {/* ── Secondary Charts Row ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Day of week bar chart */}
        <GlassCard className="space-y-4">
          <h2 className="text-sm font-medium text-text-dim uppercase tracking-wider">
            Por Día de la Semana
          </h2>
          {metricsLoading ? (
            <Skeleton className="h-56 w-full rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dayOfWeekData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis dataKey="day" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
                <RechartsTooltip content={<CustomChartTooltip />} />
                <Bar
                  dataKey="avgSpend"
                  name="Gasto Prom."
                  fill="#f97316"
                  radius={[4, 4, 0, 0]}
                  opacity={0.8}
                />
                <Bar
                  dataKey="avgClicks"
                  name="Clics Prom."
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  opacity={0.8}
                />
                <Bar
                  dataKey="avgConversions"
                  name="Conv Prom."
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                  opacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </GlassCard>

        {/* Conversion Funnel */}
        <GlassCard className="space-y-4">
          <h2 className="text-sm font-medium text-text-dim uppercase tracking-wider">
            Embudo de Conversión
          </h2>
          {metricsLoading ? (
            <Skeleton className="h-56 w-full rounded-xl" />
          ) : (
            <div className="flex flex-col items-center justify-center h-56 gap-3">
              {funnelData.map((item, i) => {
                const maxVal = funnelData[0].value || 1;
                const widthPct = Math.max(
                  20,
                  (item.value / maxVal) * 100
                );
                const prevVal = i > 0 ? funnelData[i - 1].value : null;
                const rate =
                  prevVal && prevVal > 0
                    ? ((item.value / prevVal) * 100).toFixed(1)
                    : null;
                return (
                  <div key={item.name} className="w-full flex flex-col items-center gap-1">
                    {rate && (
                      <span className="text-[10px] text-text-dim">{rate}%</span>
                    )}
                    <div
                      className="h-12 rounded-xl flex items-center justify-center transition-all"
                      style={{
                        width: `${widthPct}%`,
                        background: `linear-gradient(135deg, ${item.color}40, ${item.color}20)`,
                        border: `1px solid ${item.color}50`,
                      }}
                    >
                      <span className="text-xs font-medium text-text-primary">
                        {item.name}: {fmtNum(item.value)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>

      {/* ── Daily Metrics Table ─────────────────────────────────── */}
      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-text-dim uppercase tracking-wider">
            Métricas Diarias
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => exportCsv(daily, campaign.campaign_name)}
          >
            <Download className="size-3.5" data-icon="inline-start" />
            CSV
          </Button>
        </div>

        {metricsLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : daily.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.06] hover:bg-transparent">
                  {(
                    [
                      ["date", "Fecha"],
                      ["impressions", "Impresiones"],
                      ["reach", "Alcance"],
                      ["clicks", "Clics"],
                      ["ctr", "CTR"],
                      ["cpc", "CPC"],
                      ["cpm", "CPM"],
                      ["spend", "Gasto"],
                      ["conversions", "Conv"],
                      ["revenue", "Ingresos"],
                      ["roas", "ROAS"],
                    ] as [SortField, string][]
                  ).map(([field, label]) => (
                    <TableHead
                      key={field}
                      className="cursor-pointer select-none hover:text-text-primary transition-colors"
                      onClick={() => handleSort(field)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        {sortField === field ? (
                          sortDir === "asc" ? (
                            <ChevronUp className="size-3" />
                          ) : (
                            <ChevronDown className="size-3" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3 opacity-30" />
                        )}
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDaily.map((d, i) => (
                  <TableRow
                    key={d.date}
                    className={`border-white/[0.04] ${
                      i % 2 === 0 ? "bg-white/[0.01]" : ""
                    }`}
                  >
                    <TableCell className="text-text-secondary font-medium">
                      {d.date}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {d.impressions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {d.reach.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {d.clicks.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {d.ctr.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      ${d.cpc.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      ${d.cpm.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      ${d.spend.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {d.conversions}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      ${d.revenue.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-text-secondary font-medium">
                      {d.roas.toFixed(2)}x
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="border-white/[0.08] bg-white/[0.03] font-semibold">
                  <TableCell className="text-text-primary">Total</TableCell>
                  <TableCell className="text-text-primary">
                    {tableTotals.impressions.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-text-primary">
                    {tableTotals.reach.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-text-primary">
                    {tableTotals.clicks.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-text-primary">
                    {tableTotals.impressions > 0
                      ? (
                          (tableTotals.clicks / tableTotals.impressions) *
                          100
                        ).toFixed(2)
                      : "0.00"}
                    %
                  </TableCell>
                  <TableCell className="text-text-primary">
                    $
                    {tableTotals.clicks > 0
                      ? (tableTotals.spend / tableTotals.clicks).toFixed(2)
                      : "0.00"}
                  </TableCell>
                  <TableCell className="text-text-primary">
                    $
                    {tableTotals.impressions > 0
                      ? (
                          (tableTotals.spend / tableTotals.impressions) *
                          1000
                        ).toFixed(2)
                      : "0.00"}
                  </TableCell>
                  <TableCell className="text-text-primary">
                    ${tableTotals.spend.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-text-primary">
                    {tableTotals.conversions}
                  </TableCell>
                  <TableCell className="text-text-primary">
                    ${tableTotals.revenue.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-text-primary font-bold">
                    {tableTotals.spend > 0
                      ? (tableTotals.revenue / tableTotals.spend).toFixed(2)
                      : "0.00"}
                    x
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-text-dim text-sm">
            Sin datos diarios disponibles
          </div>
        )}
      </GlassCard>

      {/* ── Performance Insights ────────────────────────────────── */}
      {insights.length > 0 && (
        <GlassCard className="space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="size-4 text-warning" />
            <h2 className="text-sm font-medium text-text-dim uppercase tracking-wider">
              Análisis de Rendimiento
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {insights.map((insight, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${
                  insight.type === "good"
                    ? "border-success/20 bg-success/5"
                    : insight.type === "bad"
                    ? "border-error/20 bg-error/5"
                    : "border-white/[0.06] bg-white/[0.02]"
                }`}
              >
                <span className="mt-0.5">
                  {insight.type === "good" ? (
                    <TrendingUp className="size-4 text-success" />
                  ) : insight.type === "bad" ? (
                    <TrendingDown className="size-4 text-error" />
                  ) : (
                    <Minus className="size-4 text-text-dim" />
                  )}
                </span>
                <span
                  className={`text-sm ${
                    insight.type === "good"
                      ? "text-success"
                      : insight.type === "bad"
                      ? "text-error"
                      : "text-text-secondary"
                  }`}
                >
                  {insight.text}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

"use client";

import { Suspense, useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useAccount } from "@/contexts/account-context";
import {
  SearchIcon,
  LayoutGridIcon,
  TableIcon,
  PlusIcon,
  XIcon,
  FilterIcon,
  ArrowUpDownIcon,
  MoreHorizontalIcon,
  PauseIcon,
  CopyIcon,
  Trash2Icon,
  MegaphoneIcon,
  TrendingUpIcon,
  MousePointerClickIcon,
  DollarSignIcon,
  TargetIcon,
  SlidersHorizontalIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types & constants                                                 */
/* ------------------------------------------------------------------ */

interface CampaignMapping {
  id: string;
  platform: string;
  campaign_name: string;
  status: string;
  objective: string;
  budget_amount: number;
  budget_currency: string;
  created_at: string;
  last_synced_at: string | null;
  connected_account_id?: string;
  spend?: number;
  roas?: number;
  clicks?: number;
  impressions?: number;
  conversions?: number;
  ctr?: number;
  cpc?: number;
  daily_spend?: number[];
}

const PLATFORM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  meta: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  google: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  tiktok: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20" },
  linkedin: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20" },
};

const PLATFORM_LABELS: Record<string, string> = {
  meta: "Meta",
  google: "Google",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
};

const STATUS_OPTIONS = ["all", "active", "paused", "archived"] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number];
const STATUS_LABELS: Record<string, string> = {
  all: "Todos",
  active: "Activo",
  paused: "Pausado",
  archived: "Archivado",
};

const STATUS_DOT_COLORS: Record<string, string> = {
  active: "bg-emerald-400",
  paused: "bg-amber-400",
  archived: "bg-zinc-400",
};

const OBJECTIVE_OPTIONS = ["all", "awareness", "consideration", "conversion"] as const;
type ObjectiveFilter = (typeof OBJECTIVE_OPTIONS)[number];
const OBJECTIVE_LABELS: Record<string, string> = {
  all: "Todos los objetivos",
  awareness: "Awareness",
  consideration: "Consideration",
  conversion: "Conversion",
};

const DATE_RANGE_OPTIONS = [
  { value: "all", label: "Todo" },
  { value: "7", label: "7d" },
  { value: "30", label: "30d" },
  { value: "90", label: "90d" },
] as const;
type DateRange = (typeof DATE_RANGE_OPTIONS)[number]["value"];

const SORT_OPTIONS = [
  { value: "created_desc", label: "Mas recientes" },
  { value: "name_asc", label: "Nombre A-Z" },
  { value: "spend_desc", label: "Mayor gasto" },
  { value: "roas_desc", label: "Mayor ROAS" },
  { value: "clicks_desc", label: "Mas clicks" },
  { value: "impressions_desc", label: "Mas impresiones" },
] as const;
type SortOption = (typeof SORT_OPTIONS)[number]["value"];

type ViewMode = "grid" | "table";

/* ------------------------------------------------------------------ */
/*  Formatting helpers                                                */
/* ------------------------------------------------------------------ */

function formatCurrency(value: number | undefined): string {
  if (value === undefined || value === null) return "--";
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatNumber(value: number | undefined): string {
  if (value === undefined || value === null) return "--";
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
}

function formatPercent(value: number | undefined): string {
  if (value === undefined || value === null) return "--";
  return `${value.toFixed(2)}%`;
}

function roasColor(roas: number | undefined): string {
  if (roas === undefined || roas === null) return "text-text-muted";
  if (roas < 1) return "text-red-400";
  if (roas < 3) return "text-amber-400";
  return "text-emerald-400";
}

function ctrColor(ctr: number | undefined): string {
  if (ctr === undefined || ctr === null) return "text-text-muted";
  if (ctr < 0.5) return "text-red-400";
  if (ctr < 1) return "text-amber-400";
  return "text-emerald-400";
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function computeCtr(c: CampaignMapping): number | undefined {
  if (c.ctr !== undefined) return c.ctr;
  if (c.clicks && c.impressions && c.impressions > 0)
    return (c.clicks / c.impressions) * 100;
  return undefined;
}

function computeCpc(c: CampaignMapping): number | undefined {
  if (c.cpc !== undefined) return c.cpc;
  if (c.spend && c.clicks && c.clicks > 0) return c.spend / c.clicks;
  return undefined;
}

/* ------------------------------------------------------------------ */
/*  Mini sparkline (SVG)                                              */
/* ------------------------------------------------------------------ */

function MiniSparkline({ data, className }: { data?: number[]; className?: string }) {
  const points = data && data.length > 1 ? data : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const pathParts = points.map((v, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const linePath = pathParts.join(" ");
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      style={{ width: w, height: h }}
      fill="none"
    >
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(249,115,22)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="rgb(249,115,22)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#spark-grad)" />
      <path d={linePath} stroke="rgb(249,115,22)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                          */
/* ------------------------------------------------------------------ */

function CampaignsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5"
        >
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-10 rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Campaign Grid Card                                                */
/* ------------------------------------------------------------------ */

function CampaignCard({
  campaign,
  onClick,
}: {
  campaign: CampaignMapping;
  onClick: () => void;
}) {
  const pk = campaign.platform.toLowerCase();
  const pc = PLATFORM_COLORS[pk] || { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20" };
  const ctr = computeCtr(campaign);
  const cpc = computeCpc(campaign);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-5 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.05] hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      {/* Top row: name + status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-block h-2 w-2 rounded-full shrink-0 ${STATUS_DOT_COLORS[campaign.status] || "bg-zinc-400"}`}
            />
            <h3 className="text-sm font-semibold text-white truncate">
              {campaign.campaign_name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${pc.bg} ${pc.text} border ${pc.border}`}
            >
              {PLATFORM_LABELS[pk] || campaign.platform}
            </span>
            {campaign.objective && (
              <span className="text-[10px] text-text-muted font-medium uppercase tracking-wide">
                {campaign.objective}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Metrics 2x2 grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] px-3 py-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <DollarSignIcon className="h-3 w-3 text-text-muted" />
            <span className="text-[10px] text-text-muted uppercase tracking-wide">Gasto</span>
          </div>
          <span className="text-sm font-semibold text-white">
            {formatCurrency(campaign.spend ?? campaign.budget_amount)}
          </span>
        </div>

        <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] px-3 py-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <TrendingUpIcon className="h-3 w-3 text-text-muted" />
            <span className="text-[10px] text-text-muted uppercase tracking-wide">ROAS</span>
          </div>
          <span className={`text-sm font-semibold ${roasColor(campaign.roas)}`}>
            {campaign.roas !== undefined ? `${campaign.roas.toFixed(2)}x` : "--"}
          </span>
        </div>

        <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] px-3 py-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <MousePointerClickIcon className="h-3 w-3 text-text-muted" />
            <span className="text-[10px] text-text-muted uppercase tracking-wide">CTR</span>
          </div>
          <span className={`text-sm font-semibold ${ctrColor(ctr)}`}>
            {formatPercent(ctr)}
          </span>
        </div>

        <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] px-3 py-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <TargetIcon className="h-3 w-3 text-text-muted" />
            <span className="text-[10px] text-text-muted uppercase tracking-wide">CPC</span>
          </div>
          <span className="text-sm font-semibold text-white">
            {formatCurrency(cpc)}
          </span>
        </div>
      </div>

      {/* Sparkline */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-text-muted">Gasto 7d</span>
        <MiniSparkline data={campaign.daily_spend} className="opacity-60 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Actions dropdown for table row                                    */
/* ------------------------------------------------------------------ */

function CampaignActions({ campaign }: { campaign: CampaignMapping }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        onClick={(e) => e.stopPropagation()}
      >
        <MoreHorizontalIcon className="h-4 w-4 text-text-muted" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" sideOffset={4}>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <PauseIcon className="h-4 w-4 mr-2" />
          {campaign.status === "paused" ? "Reanudar" : "Pausar"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <CopyIcon className="h-4 w-4 mr-2" />
          Duplicar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Trash2Icon className="h-4 w-4 mr-2" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                         */
/* ------------------------------------------------------------------ */

export default function CampaignsPage() {
  return (
    <Suspense fallback={<CampaignsSkeleton />}>
      <CampaignsContent />
    </Suspense>
  );
}

function CampaignsContent() {
  const [campaigns, setCampaigns] = useState<CampaignMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const { selectedAccountId } = useAccount();

  const searchParams = useSearchParams();
  const router = useRouter();

  /* ---------- URL-persisted filters ---------- */
  const statusFilter = (searchParams.get("status") || "all") as StatusFilter;
  const objectiveFilter = (searchParams.get("objective") || "all") as ObjectiveFilter;
  const dateRange = (searchParams.get("date") || "all") as DateRange;
  const sortBy = (searchParams.get("sort") || "created_desc") as SortOption;
  const search = searchParams.get("q") || "";

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (
        value === "all" ||
        value === "" ||
        (key === "sort" && value === "created_desc")
      ) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [searchParams, router]
  );

  const setSearch = useCallback((v: string) => setParam("q", v), [setParam]);
  const setStatusFilter = useCallback((v: string) => setParam("status", v), [setParam]);
  const setObjectiveFilter = useCallback((v: string) => setParam("objective", v), [setParam]);
  const setDateRange = useCallback((v: string) => setParam("date", v), [setParam]);
  const setSortBy = useCallback((v: string) => setParam("sort", v), [setParam]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (objectiveFilter !== "all") count++;
    if (dateRange !== "all") count++;
    if (sortBy !== "created_desc") count++;
    if (search.trim()) count++;
    return count;
  }, [statusFilter, objectiveFilter, dateRange, sortBy, search]);

  const clearAllFilters = useCallback(() => {
    router.replace("?", { scroll: false });
  }, [router]);

  /* ---------- Data fetch ---------- */
  useEffect(() => {
    fetch("/api/platforms/campaigns")
      .then((r) => r.json())
      .then((data) => setCampaigns(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* ---------- Filter + sort ---------- */
  const filtered = useMemo(() => {
    let result = campaigns;

    if (selectedAccountId) {
      result = result.filter((c) => c.connected_account_id === selectedAccountId);
    }
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }
    if (objectiveFilter !== "all") {
      result = result.filter((c) =>
        c.objective?.toLowerCase().includes(objectiveFilter)
      );
    }
    if (dateRange !== "all") {
      const cutoff = daysAgo(Number(dateRange));
      result = result.filter((c) => new Date(c.created_at) >= cutoff);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        c.campaign_name.toLowerCase().includes(q)
      );
    }

    const sorted = [...result];
    switch (sortBy) {
      case "name_asc":
        sorted.sort((a, b) => a.campaign_name.localeCompare(b.campaign_name));
        break;
      case "spend_desc":
        sorted.sort(
          (a, b) =>
            (b.spend ?? b.budget_amount ?? 0) -
            (a.spend ?? a.budget_amount ?? 0)
        );
        break;
      case "roas_desc":
        sorted.sort((a, b) => (b.roas ?? 0) - (a.roas ?? 0));
        break;
      case "clicks_desc":
        sorted.sort((a, b) => (b.clicks ?? 0) - (a.clicks ?? 0));
        break;
      case "impressions_desc":
        sorted.sort((a, b) => (b.impressions ?? 0) - (a.impressions ?? 0));
        break;
      case "created_desc":
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
    }

    return sorted;
  }, [
    campaigns,
    selectedAccountId,
    statusFilter,
    objectiveFilter,
    dateRange,
    search,
    sortBy,
  ]);

  /* ---------- Counts per status ---------- */
  const statusCounts = useMemo(() => {
    const base = selectedAccountId
      ? campaigns.filter((c) => c.connected_account_id === selectedAccountId)
      : campaigns;
    const counts: Record<string, number> = { all: base.length };
    for (const c of base) {
      counts[c.status] = (counts[c.status] || 0) + 1;
    }
    return counts;
  }, [campaigns, selectedAccountId]);

  const activeCount = statusCounts["active"] || 0;
  const totalCount = statusCounts["all"] || 0;

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  return (
    <div className="max-w-6xl space-y-6">
      {/* ---- Header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">Campanas</h1>
            {totalCount > 0 && (
              <span className="inline-flex items-center justify-center h-6 min-w-[1.5rem] px-2 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                {totalCount}
              </span>
            )}
          </div>
          <p className="text-sm text-text-muted">
            {totalCount > 0
              ? `${activeCount} campana${activeCount !== 1 ? "s" : ""} activa${activeCount !== 1 ? "s" : ""} de ${totalCount} total`
              : "Gestiona tus campanas publicadas en todas las plataformas"}
          </p>
        </div>
        <Link href="/app/campaigns/new">
          <Button
            size="lg"
            className="bg-gradient-to-r from-primary to-secondary text-white border-0 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:brightness-110 transition-all"
          >
            <PlusIcon className="h-4 w-4 mr-1.5" />
            Nueva Campana
          </Button>
        </Link>
      </div>

      {/* ---- Filter bar (glass morphism) ---- */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4 space-y-4">
        {/* Row 1: search + view toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative w-full sm:w-[300px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              type="text"
              placeholder="Buscar campana..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/[0.03] border-white/[0.08] focus:border-primary/50"
            />
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            {/* View toggle */}
            <div className="flex items-center rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`inline-flex items-center justify-center h-7 w-7 rounded-md transition-all ${
                  viewMode === "grid"
                    ? "bg-white/[0.1] text-white"
                    : "text-text-muted hover:text-white"
                }`}
              >
                <LayoutGridIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`inline-flex items-center justify-center h-7 w-7 rounded-md transition-all ${
                  viewMode === "table"
                    ? "bg-white/[0.1] text-white"
                    : "text-text-muted hover:text-white"
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Active filter count + clear */}
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-[10px] gap-1">
                  <FilterIcon className="h-3 w-3" />
                  {activeFilterCount}
                </Badge>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors"
                >
                  <XIcon className="h-3 w-3" />
                  Limpiar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: status pills + objective + date + sort */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status pills */}
          <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
            {STATUS_OPTIONS.map((s) => {
              const isActive = statusFilter === s;
              const count = statusCounts[s] || 0;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? "bg-white/[0.1] text-white shadow-sm"
                      : "text-text-muted hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  {s !== "all" && (
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOT_COLORS[s] || "bg-zinc-400"}`}
                    />
                  )}
                  {STATUS_LABELS[s]}
                  <span
                    className={`text-[10px] ${
                      isActive ? "text-white/60" : "text-text-muted/60"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Objective select */}
          <div className="flex items-center gap-1.5">
            <SlidersHorizontalIcon className="h-3.5 w-3.5 text-text-muted" />
            <select
              value={objectiveFilter}
              onChange={(e) => setObjectiveFilter(e.target.value)}
              className="h-7 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 text-xs text-white focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/30 outline-none appearance-none cursor-pointer pr-6"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")",
                backgroundPosition: "right 4px center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "14px",
              }}
            >
              {OBJECTIVE_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {OBJECTIVE_LABELS[o]}
                </option>
              ))}
            </select>
          </div>

          {/* Date range pills */}
          <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
            {DATE_RANGE_OPTIONS.map((d) => {
              const isActive = dateRange === d.value;
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDateRange(d.value)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    isActive
                      ? "bg-white/[0.1] text-white shadow-sm"
                      : "text-text-muted hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDownIcon className="h-3.5 w-3.5 text-text-muted" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-7 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 text-xs text-white focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/30 outline-none appearance-none cursor-pointer pr-6"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")",
                backgroundPosition: "right 4px center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "14px",
              }}
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Result count */}
          {totalCount > 0 && (
            <span className="text-[11px] text-text-muted ml-auto hidden sm:block">
              {filtered.length} de {totalCount} campanas
            </span>
          )}
        </div>
      </div>

      {/* ---- Content ---- */}
      {loading ? (
        <CampaignsSkeleton />
      ) : filtered.length === 0 ? (
        /* ---- Empty state ---- */
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl py-16 px-8 flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-5">
            <MegaphoneIcon className="h-8 w-8 text-primary" />
          </div>
          {campaigns.length === 0 ? (
            <>
              <h3 className="text-lg font-semibold text-white mb-2">
                No hay campanas aun
              </h3>
              <p className="text-sm text-text-muted mb-6 max-w-sm">
                Genera copy con IA y publicalos directamente a Meta, Google y
                mas plataformas publicitarias.
              </p>
              <Link href="/app/campaigns/new">
                <Button className="bg-gradient-to-r from-primary to-secondary text-white border-0">
                  <PlusIcon className="h-4 w-4 mr-1.5" />
                  Crear primera campana
                </Button>
              </Link>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-white mb-2">
                No hay campanas que coincidan
              </h3>
              <p className="text-sm text-text-muted mb-6">
                Intenta ajustar los filtros para encontrar lo que buscas.
              </p>
              {activeFilterCount > 0 && (
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  className="border-white/[0.1]"
                >
                  <XIcon className="h-4 w-4 mr-1.5" />
                  Limpiar filtros
                </Button>
              )}
            </>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* ---- Grid view ---- */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              onClick={() => router.push(`/app/campaigns/${c.id}`)}
            />
          ))}
        </div>
      ) : (
        /* ---- Table view ---- */
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06] hover:bg-transparent">
                <TableHead className="text-text-muted text-[11px] font-medium uppercase tracking-wide pl-5">
                  Campana
                </TableHead>
                <TableHead className="text-text-muted text-[11px] font-medium uppercase tracking-wide">
                  Estado
                </TableHead>
                <TableHead className="text-text-muted text-[11px] font-medium uppercase tracking-wide text-right">
                  Gasto
                </TableHead>
                <TableHead className="text-text-muted text-[11px] font-medium uppercase tracking-wide text-right">
                  ROAS
                </TableHead>
                <TableHead className="text-text-muted text-[11px] font-medium uppercase tracking-wide text-right">
                  CTR
                </TableHead>
                <TableHead className="text-text-muted text-[11px] font-medium uppercase tracking-wide text-right">
                  CPC
                </TableHead>
                <TableHead className="text-text-muted text-[11px] font-medium uppercase tracking-wide text-right">
                  Conv.
                </TableHead>
                <TableHead className="text-text-muted text-[11px] font-medium uppercase tracking-wide text-right pr-5 w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const pk = c.platform.toLowerCase();
                const pc = PLATFORM_COLORS[pk] || {
                  bg: "bg-zinc-500/10",
                  text: "text-zinc-400",
                  border: "border-zinc-500/20",
                };
                const ctr = computeCtr(c);
                const cpc = computeCpc(c);

                return (
                  <TableRow
                    key={c.id}
                    className="border-white/[0.04] hover:bg-white/[0.03] cursor-pointer transition-colors"
                    onClick={() => router.push(`/app/campaigns/${c.id}`)}
                  >
                    {/* Name + platform */}
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center justify-center h-8 w-8 rounded-lg text-[10px] font-bold uppercase ${pc.bg} ${pc.text} border ${pc.border}`}
                        >
                          {(PLATFORM_LABELS[pk] || pk).slice(0, 2)}
                        </span>
                        <span className="text-sm font-medium text-white truncate max-w-[200px]">
                          {c.campaign_name}
                        </span>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOT_COLORS[c.status] || "bg-zinc-400"}`}
                        />
                        <span className="text-xs text-text-muted capitalize">
                          {STATUS_LABELS[c.status] || c.status}
                        </span>
                      </div>
                    </TableCell>

                    {/* Spend */}
                    <TableCell className="text-right text-sm font-medium text-white">
                      {formatCurrency(c.spend ?? c.budget_amount)}
                    </TableCell>

                    {/* ROAS */}
                    <TableCell
                      className={`text-right text-sm font-medium ${roasColor(c.roas)}`}
                    >
                      {c.roas !== undefined ? `${c.roas.toFixed(2)}x` : "--"}
                    </TableCell>

                    {/* CTR */}
                    <TableCell
                      className={`text-right text-sm font-medium ${ctrColor(ctr)}`}
                    >
                      {formatPercent(ctr)}
                    </TableCell>

                    {/* CPC */}
                    <TableCell className="text-right text-sm font-medium text-white">
                      {formatCurrency(cpc)}
                    </TableCell>

                    {/* Conversions */}
                    <TableCell className="text-right text-sm font-medium text-white">
                      {formatNumber(c.conversions)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right pr-5">
                      <CampaignActions campaign={c} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

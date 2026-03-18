"use client";

import { Suspense, useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useAccount } from "@/contexts/account-context";
import { SearchIcon } from "lucide-react";

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
}

const PLATFORM_ICONS: Record<string, string> = { meta: "\u{1F4D8}", google: "\u{1F50D}", tiktok: "\u{1F3B5}", linkedin: "\u{1F4BC}" };
const PLATFORM_COLORS: Record<string, string> = {
  meta: "bg-blue-500/20 text-blue-400",
  google: "bg-green-500/20 text-green-400",
  tiktok: "bg-pink-500/20 text-pink-400",
  linkedin: "bg-sky-600/20 text-sky-400",
};

const STATUS_OPTIONS = ["all", "active", "paused", "archived"] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number];

const OBJECTIVE_OPTIONS = ["all", "awareness", "consideration", "conversion"] as const;
type ObjectiveFilter = (typeof OBJECTIVE_OPTIONS)[number];

const DATE_RANGE_OPTIONS = [
  { value: "all", label: "Todas las fechas" },
  { value: "7", label: "Ultimos 7 dias" },
  { value: "30", label: "Ultimos 30 dias" },
  { value: "90", label: "Ultimos 90 dias" },
] as const;
type DateRange = (typeof DATE_RANGE_OPTIONS)[number]["value"];

const SORT_OPTIONS = [
  { value: "name_asc", label: "Nombre A-Z" },
  { value: "spend_desc", label: "Gasto (mayor)" },
  { value: "roas_desc", label: "ROAS (mayor)" },
  { value: "clicks_desc", label: "Clicks" },
  { value: "impressions_desc", label: "Impresiones" },
  { value: "created_desc", label: "Mas recientes" },
] as const;
type SortOption = (typeof SORT_OPTIONS)[number]["value"];

const OBJECTIVE_LABELS: Record<string, string> = {
  all: "Todos",
  awareness: "Awareness",
  consideration: "Consideration",
  conversion: "Conversion",
};

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function CampaignsSkeleton() {
  return (
    <Card variant="bordered" className="p-0 overflow-hidden">
      <div className="space-y-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 px-5 border-b border-border/50">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </Card>
  );
}

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
  const { selectedAccountId } = useAccount();

  const searchParams = useSearchParams();
  const router = useRouter();

  const statusFilter = (searchParams.get("status") || "all") as StatusFilter;
  const objectiveFilter = (searchParams.get("objective") || "all") as ObjectiveFilter;
  const dateRange = (searchParams.get("date") || "all") as DateRange;
  const sortBy = (searchParams.get("sort") || "created_desc") as SortOption;
  const search = searchParams.get("q") || "";

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all" || value === "" || (key === "sort" && value === "created_desc")) {
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

  useEffect(() => {
    fetch("/api/platforms/campaigns")
      .then((r) => r.json())
      .then((data) => setCampaigns(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = campaigns;

    if (selectedAccountId) {
      result = result.filter((c) => c.connected_account_id === selectedAccountId);
    }

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (objectiveFilter !== "all") {
      result = result.filter(
        (c) => c.objective?.toLowerCase().includes(objectiveFilter)
      );
    }

    if (dateRange !== "all") {
      const cutoff = daysAgo(Number(dateRange));
      result = result.filter((c) => new Date(c.created_at) >= cutoff);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.campaign_name.toLowerCase().includes(q));
    }

    const sorted = [...result];
    switch (sortBy) {
      case "name_asc":
        sorted.sort((a, b) => a.campaign_name.localeCompare(b.campaign_name));
        break;
      case "spend_desc":
        sorted.sort((a, b) => (b.spend ?? b.budget_amount ?? 0) - (a.spend ?? a.budget_amount ?? 0));
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
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return sorted;
  }, [campaigns, selectedAccountId, statusFilter, objectiveFilter, dateRange, search, sortBy]);

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Campanas</h1>
          <p className="text-sm text-text-muted">
            Gestiona tus campanas publicadas en todas las plataformas.
          </p>
        </div>
        <Link href="/app/campaigns/new">
          <Button size="sm">+ Nueva campana</Button>
        </Link>
      </div>

      <Separator />

      {/* Filter bar */}
      <Card variant="bordered" className="p-4 space-y-4">
        {/* Row 1: Search + active filter badge + clear */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-dim" />
            <Input
              type="text"
              placeholder="Buscar campana..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-surface"
            />
          </div>

          {activeFilterCount > 0 && (
            <Badge variant="default" className="text-xs">
              {activeFilterCount} filtro{activeFilterCount > 1 ? "s" : ""} activo{activeFilterCount > 1 ? "s" : ""}
            </Badge>
          )}

          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-primary hover:text-primary-hover transition-colors underline underline-offset-2"
            >
              Limpiar filtros
            </button>
          )}

          {campaigns.length > 0 && (
            <span className="text-xs text-text-dim ml-auto">
              {filtered.length} de {campaigns.length} campanas
            </span>
          )}
        </div>

        {/* Row 2: Filters */}
        <div className="flex flex-wrap items-end gap-4">
          {/* Status filter */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-text-dim uppercase tracking-wide">
              Estado
            </span>
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as string)}>
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="active">Activo</TabsTrigger>
                <TabsTrigger value="paused">Pausado</TabsTrigger>
                <TabsTrigger value="archived">Archivado</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Objective filter */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-text-dim uppercase tracking-wide">
              Objetivo
            </span>
            <Tabs value={objectiveFilter} onValueChange={(v) => setObjectiveFilter(v as string)}>
              <TabsList>
                {OBJECTIVE_OPTIONS.map((o) => (
                  <TabsTrigger key={o} value={o}>{OBJECTIVE_LABELS[o] || o}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Date range */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-text-dim uppercase tracking-wide">
              Periodo
            </span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-xs text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none appearance-none cursor-pointer pr-7"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")",
                backgroundPosition: "right 4px center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "16px",
              }}
            >
              {DATE_RANGE_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-text-dim uppercase tracking-wide">
              Ordenar
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-xs text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none appearance-none cursor-pointer pr-7"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")",
                backgroundPosition: "right 4px center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "16px",
              }}
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Campaign list */}
      {loading ? (
        <CampaignsSkeleton />
      ) : filtered.length === 0 ? (
        <Card variant="bordered" className="text-center py-12 space-y-3">
          <div className="text-4xl">{"\u{1F4E2}"}</div>
          {campaigns.length === 0 ? (
            <>
              <p className="text-text-dim">No hay campanas aun</p>
              <p className="text-xs text-text-dim">
                Genera copy con IA y publicalos directamente a tus plataformas.
              </p>
              <Link href="/app/campaigns/new">
                <Button size="sm">Crear primera campana</Button>
              </Link>
            </>
          ) : (
            <>
              <p className="text-text-dim">
                No se encontraron campanas con los filtros actuales
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-primary hover:text-primary-hover transition-colors underline underline-offset-2"
                >
                  Limpiar filtros
                </button>
              )}
            </>
          )}
        </Card>
      ) : (
        <Card variant="bordered" className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-text-dim text-xs font-medium pl-5">Campana</TableHead>
                <TableHead className="text-text-dim text-xs font-medium">Plataforma</TableHead>
                <TableHead className="text-text-dim text-xs font-medium">Estado</TableHead>
                <TableHead className="text-text-dim text-xs font-medium">Objetivo</TableHead>
                <TableHead className="text-text-dim text-xs font-medium text-right">Presupuesto</TableHead>
                <TableHead className="text-text-dim text-xs font-medium text-right pr-5">Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const platformKey = c.platform.toLowerCase();
                return (
                  <TableRow
                    key={c.id}
                    className="border-border/50 hover:bg-surface-hover/50 cursor-pointer"
                    onClick={() => router.push(`/app/campaigns/${c.id}`)}
                  >
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{PLATFORM_ICONS[platformKey] || "\u{1F4E2}"}</span>
                        <span className="text-sm font-medium text-text-primary">{c.campaign_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${PLATFORM_COLORS[platformKey] || "bg-surface text-text-dim"}`}>
                        {c.platform}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.status === "active" ? "success" : c.status === "paused" ? "warning" : "info"}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-text-muted">{c.objective}</TableCell>
                    <TableCell className="text-right text-xs text-text-secondary">
                      {c.budget_amount > 0 ? `$${c.budget_amount} ${c.budget_currency}` : "\u2014"}
                    </TableCell>
                    <TableCell className="text-right text-xs text-text-dim pr-5">
                      {new Date(c.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

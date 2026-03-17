"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { ReportCard } from "@/components/reports/report-card";

interface Report {
  id: string;
  type: "daily" | "weekly";
  date_from: string;
  date_to: string;
  metrics: {
    totals: Record<string, number>;
    deltas: Record<string, number>;
    week_average?: Record<string, number>;
    previous_totals?: Record<string, number>;
    by_platform?: Record<string, Record<string, number>>;
    campaign_count?: number;
  };
  ai_analysis: {
    summary?: string;
    highlights?: string[];
    recommendations?: string[];
    risk_areas?: string[];
    trends?: string[];
    platform_breakdown?: Array<{ platform: string; assessment: string }>;
    budget_advice?: string;
    overall_score?: number;
  };
  created_at: string;
}

type FilterType = "all" | "daily" | "weekly";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch("/api/reports");
        if (!res.ok) throw new Error("Failed to fetch reports");
        const data = await res.json();
        setReports(data.reports || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  const filtered = filter === "all" ? reports : reports.filter((r) => r.type === filter);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted mt-1">
          AI-powered performance reports generated daily and weekly
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "daily", "weekly"] as FilterType[]).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              filter === t
                ? "bg-primary/20 text-primary"
                : "text-muted hover:text-foreground hover:bg-surface"
            }`}
          >
            {t === "all" ? "All" : t === "daily" ? "Daily" : "Weekly"}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">&#128202;</div>
          <h2 className="text-lg font-semibold text-foreground">No reports yet</h2>
          <p className="text-sm text-muted mt-1">
            Reports are generated automatically. Daily reports run at 2 PM UTC, weekly reports every Monday.
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}

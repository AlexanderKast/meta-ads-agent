"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLATFORMS } from "@/lib/constants";
import type { Platform } from "@/lib/types";

interface Generation {
  id: string;
  platform: Platform;
  objective: string;
  tone: string;
  product: string;
  variations_count: number;
  created_at: string;
}

export default function HistoryPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/history?page=${page}`)
      .then((r) => r.json())
      .then((data) => {
        setGenerations(data.data || []);
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  async function handleDelete(id: string) {
    await fetch(`/api/history/${id}`, { method: "DELETE" });
    setGenerations((prev) => prev.filter((g) => g.id !== id));
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Historial</h1>
        <span className="text-sm text-text-dim">{total} generaciones</span>
      </div>

      {loading ? (
        <p className="text-text-dim text-sm">Cargando...</p>
      ) : generations.length === 0 ? (
        <Card variant="bordered" className="text-center py-12">
          <p className="text-text-dim">No hay generaciones aun</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {generations.map((gen) => {
            const platform = PLATFORMS[gen.platform];
            return (
              <Card key={gen.id} variant="bordered" className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span>{platform?.icon}</span>
                    <span className="text-sm font-medium text-text-primary">{platform?.label}</span>
                    <Badge variant="info">{gen.objective}</Badge>
                    <Badge>{gen.tone}</Badge>
                  </div>
                  <p className="text-xs text-text-dim truncate max-w-md">{gen.product}</p>
                  <p className="text-xs text-text-dim">
                    {new Date(gen.created_at).toLocaleDateString()} - {gen.variations_count} variaciones
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(gen.id)}
                  className="text-xs text-text-dim hover:text-error transition-colors"
                >
                  Eliminar
                </button>
              </Card>
            );
          })}
        </div>
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-text-dim self-center">Pagina {page}</span>
          <Button variant="secondary" size="sm" disabled={page * 20 >= total} onClick={() => setPage(page + 1)}>
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}

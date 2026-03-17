"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PLATFORMS } from "@/lib/constants";
import type { Platform } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  platform: Platform;
  objective: string;
  tone: string;
  product_template: string;
  audience_template: string;
  created_at: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<Platform>("meta");
  const [objective, setObjective] = useState("conversion");
  const [tone, setTone] = useState("profesional");
  const [productTemplate, setProductTemplate] = useState("");
  const [audienceTemplate, setAudienceTemplate] = useState("");

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data) => setTemplates(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        platform,
        objective,
        tone,
        product_template: productTemplate,
        audience_template: audienceTemplate,
      }),
    });

    if (res.ok) {
      const newTemplate = await res.json();
      setTemplates((prev) => [newTemplate, ...prev]);
      setShowForm(false);
      setName("");
      setProductTemplate("");
      setAudienceTemplate("");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Templates</h1>
        <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "+ Nuevo template"}
        </Button>
      </div>

      {showForm && (
        <Card variant="bordered">
          <form onSubmit={handleSave} className="space-y-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del template"
              required
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-dim focus:outline-none focus:border-primary text-sm"
            />
            <div className="grid grid-cols-4 gap-2">
              {(Object.entries(PLATFORMS) as [Platform, { label: string; icon: string }][]).map(([key, val]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPlatform(key)}
                  className={cn(
                    "p-2 rounded-lg border text-xs transition-all",
                    platform === key ? "border-primary bg-primary-light text-text-primary" : "border-border bg-surface text-text-muted"
                  )}
                >
                  {val.icon} {val.label}
                </button>
              ))}
            </div>
            <Textarea label="Template de producto" value={productTemplate} onChange={(e) => setProductTemplate(e.target.value)} rows={2} required />
            <Textarea label="Template de audiencia" value={audienceTemplate} onChange={(e) => setAudienceTemplate(e.target.value)} rows={2} />
            <Button type="submit" loading={saving}>Guardar</Button>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-text-dim text-sm">Cargando...</p>
      ) : templates.length === 0 ? (
        <Card variant="bordered" className="text-center py-12">
          <p className="text-text-dim">No hay templates aun</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((t) => (
            <Card key={t.id} variant="bordered" className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">{t.name}</span>
                <button onClick={() => handleDelete(t.id)} className="text-xs text-text-dim hover:text-error">
                  Eliminar
                </button>
              </div>
              <div className="flex gap-2">
                <Badge>{PLATFORMS[t.platform]?.icon} {t.platform}</Badge>
                <Badge variant="info">{t.objective}</Badge>
              </div>
              <p className="text-xs text-text-dim truncate">{t.product_template}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

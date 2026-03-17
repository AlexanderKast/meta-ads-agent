"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface BrandProfile {
  id: string;
  brand_name: string;
  description: string;
  tone_keywords: string[];
  target_audience: string;
  do_say: string[];
  dont_say: string[];
}

export default function BrandPage() {
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [toneKeywords, setToneKeywords] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [doSay, setDoSay] = useState("");
  const [dontSay, setDontSay] = useState("");

  useEffect(() => {
    fetch("/api/brand")
      .then((r) => r.json())
      .then((data) => {
        const profiles = Array.isArray(data) ? data : [];
        if (profiles.length > 0) {
          const b = profiles[0];
          setBrand(b);
          setBrandName(b.brand_name || "");
          setDescription(b.description || "");
          setToneKeywords(b.tone_keywords?.join(", ") || "");
          setTargetAudience(b.target_audience || "");
          setDoSay(b.do_say?.join("\n") || "");
          setDontSay(b.dont_say?.join("\n") || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const body = {
      id: brand?.id,
      brand_name: brandName,
      description,
      tone_keywords: toneKeywords.split(",").map((s) => s.trim()).filter(Boolean),
      target_audience: targetAudience,
      do_say: doSay.split("\n").filter(Boolean),
      dont_say: dontSay.split("\n").filter(Boolean),
    };

    const method = brand ? "PUT" : "POST";
    const res = await fetch("/api/brand", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const saved = await res.json();
      setBrand(saved);
    }
    setSaving(false);
  }

  if (loading) return <p className="text-text-dim text-sm">Cargando...</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Perfil de Marca</h1>
      <p className="text-sm text-text-muted">
        Define tu marca para que Claude genere copy consistente con tu identidad.
      </p>

      <Card variant="bordered">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Nombre de marca *</label>
            <input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              required
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-dim focus:outline-none focus:border-primary text-sm"
            />
          </div>

          <Textarea label="Descripcion" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Que hace tu marca, cual es tu propuesta de valor..." />
          <Textarea label="Palabras clave de tono (separadas por coma)" value={toneKeywords} onChange={(e) => setToneKeywords(e.target.value)} rows={1} placeholder="profesional, cercano, innovador" />
          <Textarea label="Audiencia objetivo" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} rows={2} placeholder="Describe tu audiencia ideal..." />
          <Textarea label="Do Say (una por linea)" value={doSay} onChange={(e) => setDoSay(e.target.value)} rows={3} placeholder="Frases o palabras que SI usamos..." />
          <Textarea label="Don't Say (una por linea)" value={dontSay} onChange={(e) => setDontSay(e.target.value)} rows={3} placeholder="Frases o palabras que NO usamos..." />

          <Button type="submit" loading={saving}>
            {brand ? "Actualizar perfil" : "Crear perfil"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

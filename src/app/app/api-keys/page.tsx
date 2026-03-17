"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ApiKey {
  id: string;
  name: string;
  key_preview: string;
  last_used_at: string | null;
  created_at: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/keys")
      .then((r) => r.json())
      .then((data) => setKeys(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newKeyName }),
    });

    if (res.ok) {
      const data = await res.json();
      setNewKeyValue(data.key);
      setKeys((prev) => [data.apiKey, ...prev]);
      setNewKeyName("");
    }
    setCreating(false);
  }

  async function handleRevoke(id: string) {
    await fetch(`/api/keys/${id}`, { method: "DELETE" });
    setKeys((prev) => prev.filter((k) => k.id !== id));
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">API Keys</h1>
        <p className="text-sm text-text-muted">Gestiona tus API keys para acceder a la API publica (solo plan Agency).</p>
      </div>

      {newKeyValue && (
        <Card variant="highlighted" className="space-y-2">
          <p className="text-sm text-text-primary font-medium">Nueva API Key creada</p>
          <p className="text-xs text-text-dim">Copia esta key ahora. No podras verla de nuevo.</p>
          <code className="block bg-surface border border-border rounded-lg p-3 text-sm text-primary break-all">
            {newKeyValue}
          </code>
          <Button variant="secondary" size="sm" onClick={() => setNewKeyValue(null)}>
            Entendido
          </Button>
        </Card>
      )}

      <Card variant="bordered">
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Nombre de la key (ej: Mi App)"
            required
            className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm placeholder-text-dim focus:outline-none focus:border-primary"
          />
          <Button type="submit" size="sm" loading={creating}>Crear key</Button>
        </form>
      </Card>

      {loading ? (
        <p className="text-text-dim text-sm">Cargando...</p>
      ) : keys.length === 0 ? (
        <Card variant="bordered" className="text-center py-8">
          <p className="text-text-dim">No hay API keys</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <Card key={key.id} variant="bordered" className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-sm text-text-primary font-medium">{key.name}</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-text-dim">{key.key_preview}</code>
                  {key.last_used_at && (
                    <Badge variant="info">
                      Usado: {new Date(key.last_used_at).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </div>
              <button onClick={() => handleRevoke(key.id)} className="text-xs text-text-dim hover:text-error transition-colors">
                Revocar
              </button>
            </Card>
          ))}
        </div>
      )}

      <Card variant="default" className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">Uso de la API</h3>
        <pre className="text-xs text-text-muted bg-surface rounded-lg p-3 overflow-x-auto">{`curl -X POST ${typeof window !== "undefined" ? window.location.origin : "https://claudeads.com"}/api/v1/generate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "platform": "meta",
    "objective": "conversion",
    "tone": "profesional",
    "product": "Tu producto aqui",
    "audience": "Tu audiencia",
    "variations": 3
  }'`}</pre>
      </Card>
    </div>
  );
}

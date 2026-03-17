"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function TeamPage() {
  const [inviteEmail, setInviteEmail] = useState("");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Equipo</h1>
        <p className="text-sm text-text-muted">Gestiona los miembros de tu equipo y permisos de colaboracion.</p>
      </div>

      <Card variant="bordered">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // TODO: Implement invite
            setInviteEmail("");
          }}
          className="flex gap-2"
        >
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@ejemplo.com"
            required
            className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm placeholder-text-dim focus:outline-none focus:border-primary"
          />
          <Button type="submit" size="sm">Invitar</Button>
        </form>
      </Card>

      <Card variant="bordered" className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
            T
          </div>
          <div>
            <p className="text-sm text-text-primary font-medium">Tu (Owner)</p>
            <p className="text-xs text-text-dim">Cuenta actual</p>
          </div>
        </div>
        <Badge variant="success">Owner</Badge>
      </Card>

      <div className="text-center py-8">
        <p className="text-sm text-text-dim">
          La colaboracion en equipo esta disponible en planes Pro y Agency.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import type { AdResponse } from "@/lib/types";
import { exportToCSV, exportToJSON, exportAllToClipboard, downloadFile } from "@/lib/export";
import { toast } from "@/components/ui/toast";

interface ExportMenuProps {
  result: AdResponse;
}

export function ExportMenu({ result }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleCSV() {
    const csv = exportToCSV(result);
    downloadFile(csv, `claude-ads-${result.platform}.csv`, "text/csv");
    setOpen(false);
    toast("CSV descargado", "success");
  }

  function handleJSON() {
    const json = exportToJSON(result);
    downloadFile(json, `claude-ads-${result.platform}.json`, "application/json");
    setOpen(false);
    toast("JSON descargado", "success");
  }

  async function handleClipboard() {
    const text = exportAllToClipboard(result);
    await navigator.clipboard.writeText(text);
    setOpen(false);
    toast("Copiado al clipboard", "success");
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-text-dim hover:text-text-primary transition-colors px-2 py-1 rounded-lg hover:bg-surface-hover border border-border"
      >
        Exportar
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-border rounded-xl shadow-lg z-20 min-w-[160px] py-1">
          <button
            onClick={handleCSV}
            className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover transition-colors"
          >
            CSV (Meta/Google)
          </button>
          <button
            onClick={handleJSON}
            className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover transition-colors"
          >
            JSON
          </button>
          <button
            onClick={handleClipboard}
            className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover transition-colors"
          >
            Copiar todo
          </button>
        </div>
      )}
    </div>
  );
}

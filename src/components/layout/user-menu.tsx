"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface UserMenuProps {
  email: string;
}

export function UserMenu({ email }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  const initial = email[0]?.toUpperCase() || "U";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-gray-900 border border-border rounded-xl shadow-lg z-20 min-w-[200px] py-1">
          <div className="px-4 py-2 border-b border-border">
            <p className="text-xs text-text-dim truncate">{email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover transition-colors"
          >
            Cerrar sesion
          </button>
        </div>
      )}
    </div>
  );
}

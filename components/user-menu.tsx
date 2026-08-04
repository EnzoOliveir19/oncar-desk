"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";

type Props = {
  profile: Profile;
};

export function UserMenu({ profile }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const firstName =
    profile.full_name?.split(" ")[0] ?? profile.email.split("@")[0];
  const initial = firstName[0]?.toUpperCase() ?? "?";

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Fecha com Esc
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full bg-white/[0.03] border border-hairline hover:bg-white/[0.06] transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            width={26}
            height={26}
            className="w-[26px] h-[26px] rounded-full ring-1 ring-hairline-strong"
          />
        ) : (
          <span
            className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-semibold text-white"
            style={{
              background:
                "linear-gradient(135deg, #FF6A3D, #E94E1B)",
            }}
          >
            {initial}
          </span>
        )}
        <span className="text-[13px] font-medium text-text-primary hidden sm:inline">
          {firstName}
        </span>
        <span className="font-mono text-[10px] text-text-muted">▾</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 min-w-[180px] rounded-xl bg-canvas/95 border border-hairline-strong backdrop-blur-md shadow-2xl overflow-hidden animate-slideUpFade"
        >
          <div className="px-3 py-2.5 border-b border-hairline">
            <p className="text-[13px] font-medium text-text-primary truncate">
              {profile.full_name || firstName}
            </p>
            <p className="text-[11px] text-text-muted truncate">
              {profile.email}
            </p>
          </div>
          <button
            role="menuitem"
            onClick={signOut}
            className="w-full text-left px-3 py-2 text-[13px] text-text-secondary hover:bg-white/[0.04] hover:text-text-primary transition-colors"
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}

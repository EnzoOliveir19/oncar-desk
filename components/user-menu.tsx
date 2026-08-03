"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";

type Props = {
  profile: Profile;
};

export function UserMenu({ profile }: Props) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const firstName = profile.full_name?.split(" ")[0] ?? profile.email.split("@")[0];

  return (
    <div className="flex items-center gap-2.5">
      {profile.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt=""
          className="w-7 h-7 rounded-full ring-1 ring-border"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-surface ring-1 ring-border flex items-center justify-center text-xs text-text-secondary">
          {firstName[0]?.toUpperCase()}
        </div>
      )}
      <span className="text-sm text-text-secondary hidden sm:inline">
        {firstName}
      </span>
      <button
        onClick={signOut}
        className="text-xs text-text-muted hover:text-text-secondary transition-colors ml-1"
      >
        sair
      </button>
    </div>
  );
}

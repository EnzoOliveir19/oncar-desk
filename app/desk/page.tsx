import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export default async function DeskPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware garante que user existe aqui, mas o TS não sabe.
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  return (
    <main className="min-h-screen p-8">
      <header className="flex items-center justify-between max-w-4xl mx-auto mb-12">
        <div>
          <p className="font-mono text-xs tracking-[0.3em] text-text-secondary uppercase">
            Oncar Desk
          </p>
          <p className="mt-1 text-sm text-text-muted">Fase 1 — auth funcionando</p>
        </div>
        <div className="flex items-center gap-3">
          {profile?.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={profile.full_name ?? "avatar"}
              className="w-8 h-8 rounded-full ring-1 ring-border"
            />
          )}
          <span className="text-sm text-text-primary">
            {profile?.full_name ?? user.email}
          </span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              sair
            </button>
          </form>
        </div>
      </header>

      <section className="max-w-4xl mx-auto">
        <div className="p-8 rounded-xl bg-floor border border-border">
          <p className="text-text-primary">
            🎉 Você tá logado com{" "}
            <span className="font-mono text-accent-light">{user.email}</span>.
          </p>
          <p className="mt-3 text-sm text-text-secondary leading-relaxed">
            A tela do escritório isométrico entra na Fase 2. Por enquanto, esse
            placeholder confirma que auth + banco + RLS estão funcionando ponta
            a ponta. Se você chegou aqui, tudo tá redondo.
          </p>
        </div>
      </section>
    </main>
  );
}

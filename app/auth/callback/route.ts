import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Rota que o Google chama de volta depois do OAuth.
 * Troca o `code` por uma sessão e redireciona pro app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/desk";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Trava dupla: mesmo que alguém contorne o `hd=` do OAuth,
      // rejeitamos qualquer email fora do domínio.
      const email = data.user.email ?? "";
      if (!email.endsWith("@oncar.com.br")) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=domain`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}

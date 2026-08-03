import { redirect } from "next/navigation";

/**
 * Raiz do app: middleware já garante que o usuário está autenticado.
 * Redireciona direto pro dashboard do escritório.
 */
export default function RootPage() {
  redirect("/desk");
}

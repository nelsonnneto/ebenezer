import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseChave, supabaseUrl } from '../ambiente';

/** Cliente Supabase para Server Components e Server Actions — age como o usuário logado (RLS aplicada). */
export async function supabaseServidor() {
  const store = await cookies();
  return createServerClient(supabaseUrl(), supabaseChave(), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (lista) => {
        try {
          lista.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Server Component não grava cookie; o proxy renova a sessão na próxima requisição.
        }
      },
    },
  });
}

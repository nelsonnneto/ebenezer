import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { supabaseChave, supabaseUrl } from './lib/ambiente';

// Rotas abertas sem login. Todo o resto exige sessão.
const PUBLICAS = ['/acesso', '/recuperar-senha', '/verificar', '/conheca', '/cadastro', '/r'];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl(), supabaseChave(), {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        lista.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Renova a sessão; getUser() valida o token no servidor de Auth.
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;
  const publica = PUBLICAS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!user && !publica) {
    const url = request.nextUrl.clone();
    url.pathname = '/acesso';
    url.search = pathname === '/' ? '' : `?volta=${encodeURIComponent(pathname + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  if (user && (pathname === '/acesso' || pathname === '/cadastro')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|woff2?)$).*)'],
};

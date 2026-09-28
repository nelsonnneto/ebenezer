import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServidor } from '@/lib/supabase/server';
import { CANAIS, COOKIE_ORIGEM, type Canal } from '@/lib/publico';

/**
 * Link rastreável do embaixador: /r/<slug>?c=<canal>.
 * Registra um acesso (tabela origem, sem dado pessoal do visitante), guarda o id no cookie por 90 dias
 * e leva à página pública. Se a pessoa se cadastrar ou entrar, a origem é vinculada ao novo doador.
 * Atribuição: último clique. Slug inexistente ou "instituto" gera origem sem embaixador (canal institucional).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = request.nextUrl.searchParams.get('c');
  const canal: Canal = CANAIS.includes(c as Canal) ? (c as Canal) : 'direto';
  const destino = new URL('/conheca', request.url);
  if (slug !== 'instituto') destino.searchParams.set('convite', '1');

  const sb = await supabaseServidor();
  const { data: origem } = await sb.rpc('fn_registrar_origem', { p_slug: slug.slice(0, 60), p_canal: canal });
  const res = NextResponse.redirect(destino, 303);
  if (typeof origem === 'string') {
    res.cookies.set(COOKIE_ORIGEM, origem, { httpOnly: true, sameSite: 'lax', secure: request.nextUrl.protocol === 'https:', path: '/', maxAge: 60 * 60 * 24 * 90 });
  }
  return res;
}

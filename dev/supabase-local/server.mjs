// ============================================================================
// Emulador mínimo da API do Supabase — SOMENTE para desenvolvimento e testes
// em ambientes sem Docker. Em qualquer outro caso, use `supabase start`.
//
// Implementa exatamente o subconjunto que o app usa:
//   REST    GET  /rest/v1/<view|tabela>   select, filtros eq/neq/gt/gte/lt/lte/in/is/like/ilike, order, limit, offset
//           POST /rest/v1/rpc/<função>    argumentos nomeados em JSON
//   Auth    POST /auth/v1/token?grant_type=password|refresh_token
//           GET  /auth/v1/user · POST /auth/v1/logout · POST /auth/v1/signup · POST /auth/v1/recover
//   Storage GET  /storage/v1/object/public/<bucket>/<caminho>   (lê de supabase/storage/)
//
// Cada requisição roda numa transação com `set local role` + `request.jwt.claims`,
// de modo que a RLS e as funções do banco se comportam como no Supabase real.
// ============================================================================
import http from 'node:http';
import { randomUUID, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { SignJWT, jwtVerify } from 'jose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 54321);
const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://postgres@localhost:5433/ebenezer_test';
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'super-secret-jwt-token-with-at-least-32-characters-long');
const STORAGE_DIR = path.resolve(__dirname, '../../supabase/storage');
const IDENT = /^[a-z_][a-z0-9_]*$/;

const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 10 });
// Conexões ociosas derrubadas (ex.: banco recriado pelos testes) não podem derrubar o processo.
pool.on('error', (e) => console.error(`conexão ociosa encerrada: ${e.message}`));
const refreshTokens = new Map(); // refresh_token → user id (memória: suficiente para dev)

// ---------------------------------------------------------------------------
// JWT
// ---------------------------------------------------------------------------
async function sign(claims, expiresIn, { fixo = false } = {}) {
  let jwt = new SignJWT(claims).setProtectedHeader({ alg: 'HS256', typ: 'JWT' });
  if (!fixo) jwt = jwt.setIssuedAt();
  if (expiresIn) jwt = jwt.setExpirationTime(expiresIn);
  return jwt.sign(JWT_SECRET);
}
async function claimsFrom(req) {
  const auth = req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.headers.apikey;
  if (!auth) return { role: 'anon' };
  try {
    const { payload } = await jwtVerify(auth, JWT_SECRET);
    return payload;
  } catch {
    const e = new Error('JWT inválido ou expirado'); e.status = 401; e.code = 'PGRST301'; throw e;
  }
}
// Chaves fixas (sem iat): as mesmas a cada execução, iguais às do Supabase CLI local.
export const ANON_KEY = await sign({ iss: 'supabase-demo', role: 'anon', exp: 1983812996 }, null, { fixo: true });
export const SERVICE_ROLE_KEY = await sign({ iss: 'supabase-demo', role: 'service_role', exp: 1983812996 }, null, { fixo: true });

// ---------------------------------------------------------------------------
// Execução com o papel e as claims da requisição
// ---------------------------------------------------------------------------
async function asRole(claims, fn) {
  const role = ['anon', 'authenticated', 'service_role'].includes(claims.role) ? claims.role : 'anon';
  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query(`set local role ${role}`);
    await client.query(
      `select set_config('request.jwt.claims', $1, true),
              set_config('request.jwt.claim.sub', $2, true),
              set_config('request.jwt.claim.role', $3, true)`,
      [JSON.stringify(claims), claims.sub ?? '', role]
    );
    const out = await fn(client);
    await client.query('commit');
    return out;
  } catch (e) {
    await client.query('rollback').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

// ---------------------------------------------------------------------------
// REST: leitura
// ---------------------------------------------------------------------------
const OPS = { eq: '=', neq: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=', like: 'like', ilike: 'ilike' };
const RESERVED = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns']);

function buildSelect(rel, params) {
  if (!IDENT.test(rel)) throw bad(`relação inválida: ${rel}`);
  const values = [];
  const p = (v) => { values.push(v); return `$${values.length}`; };

  const sel = (params.get('select') ?? '*').split(',').map((s) => s.trim()).filter(Boolean);
  const cols = sel.length === 1 && sel[0] === '*' ? '*' : sel.map((c) => { if (!IDENT.test(c)) throw bad(`coluna inválida: ${c}`); return `"${c}"`; }).join(', ');

  const where = [];
  for (const [key, raw] of params) {
    if (RESERVED.has(key)) continue;
    if (!IDENT.test(key)) throw bad(`filtro inválido: ${key}`);
    const dot = raw.indexOf('.');
    const op = raw.slice(0, dot), val = raw.slice(dot + 1);
    if (op === 'in') {
      const list = val.replace(/^\(|\)$/g, '').split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
      where.push(`"${key}"::text = any(${p(list)}::text[])`);
    } else if (op === 'is') {
      const v = { null: 'null', true: 'true', false: 'false' }[val];
      if (!v) throw bad(`is.${val} não suportado`);
      where.push(`"${key}" is ${v}`);
    } else if (OPS[op]) {
      where.push(`"${key}"::text ${OPS[op]} ${p(op.endsWith('like') ? val.replaceAll('*', '%') : val)}`);
    } else throw bad(`operador não suportado: ${op}`);
  }
  // comparação por texto quebraria ordenação numérica em gt/lt; o app só usa eq/in/is nesses campos
  const order = (params.get('order') ?? '').split(',').filter(Boolean).map((o) => {
    const [c, dir = 'asc', nulls] = o.split('.');
    if (!IDENT.test(c) || !['asc', 'desc'].includes(dir)) throw bad(`order inválido: ${o}`);
    return `"${c}" ${dir}${nulls === 'nullsfirst' ? ' nulls first' : nulls === 'nullslast' ? ' nulls last' : ''}`;
  });
  const limit = params.get('limit'), offset = params.get('offset');
  let sql = `select ${cols} from public."${rel}"`;
  if (where.length) sql += ` where ${where.join(' and ')}`;
  if (order.length) sql += ` order by ${order.join(', ')}`;
  if (limit) sql += ` limit ${Number(limit) | 0}`;
  if (offset) sql += ` offset ${Number(offset) | 0}`;
  return { sql: `select coalesce(json_agg(t), '[]'::json) as data from (${sql}) t`, values };
}

// ---------------------------------------------------------------------------
// REST: RPC
// ---------------------------------------------------------------------------
async function callRpc(client, fn, args) {
  if (!IDENT.test(fn)) throw bad(`função inválida: ${fn}`);
  const meta = await client.query(
    `select p.proretset as setof, t.typtype as kind, t.typname as tipo
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace join pg_type t on t.oid = p.prorettype
      where n.nspname = 'public' and p.proname = $1 limit 1`, [fn]);
  if (!meta.rowCount) { const e = new Error(`função public.${fn} não encontrada`); e.status = 404; e.code = 'PGRST202'; throw e; }
  const { setof, kind, tipo } = meta.rows[0];
  const keys = Object.keys(args ?? {});
  keys.forEach((k) => { if (!IDENT.test(k)) throw bad(`argumento inválido: ${k}`); });
  const call = `public."${fn}"(${keys.map((k, i) => `"${k}" => $${i + 1}`).join(', ')})`;
  const values = keys.map((k) => (args[k] !== null && typeof args[k] === 'object' ? JSON.stringify(args[k]) : args[k]));
  if (setof) return (await client.query(`select coalesce(json_agg(r), '[]'::json) as data from ${call} r`, values)).rows[0].data;
  if (tipo === 'void') { await client.query(`select ${call}`, values); return undefined; }
  if (kind === 'c') return (await client.query(`select to_json(r) as data from ${call} r`, values)).rows[0]?.data ?? null;
  return (await client.query(`select to_json(${call}) as data`, values)).rows[0].data;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
function userJson(u) {
  return {
    id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, phone: '',
    email_confirmed_at: u.email_confirmed_at, confirmed_at: u.email_confirmed_at, last_sign_in_at: new Date().toISOString(),
    app_metadata: u.raw_app_meta_data ?? { provider: 'email', providers: ['email'] },
    user_metadata: u.raw_user_meta_data ?? {}, identities: [], created_at: u.created_at, updated_at: u.updated_at, is_anonymous: false,
  };
}
async function session(u) {
  const expires_in = 3600;
  const access_token = await sign({
    aud: 'authenticated', sub: u.id, email: u.email, role: 'authenticated', session_id: randomUUID(),
    is_anonymous: false, user_metadata: u.raw_user_meta_data ?? {}, app_metadata: u.raw_app_meta_data ?? {},
  }, `${expires_in}s`);
  const refresh_token = randomBytes(24).toString('hex');
  refreshTokens.set(refresh_token, u.id);
  return { access_token, token_type: 'bearer', expires_in, expires_at: Math.floor(Date.now() / 1000) + expires_in, refresh_token, user: userJson(u) };
}
const USER_COLS = 'id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at';
async function findUser(where, values) {
  const r = await pool.query(`select ${USER_COLS} from auth.users where ${where}`, values);
  return r.rows[0];
}
function authError(status, code, msg) {
  const e = new Error(msg); e.status = status; e.auth = { code, error_code: code, msg, message: msg, error_description: msg }; return e;
}

async function handleAuth(req, url, body) {
  const route = url.pathname.replace('/auth/v1', '');
  if (route === '/token' && req.method === 'POST') {
    const grant = url.searchParams.get('grant_type');
    if (grant === 'password') {
      const u = await findUser(`lower(email) = lower($1) and encrypted_password = crypt($2, encrypted_password)`, [body.email ?? '', body.password ?? '']);
      if (!u) throw authError(400, 'invalid_credentials', 'Invalid login credentials');
      return [200, await session(u)];
    }
    if (grant === 'refresh_token') {
      const id = refreshTokens.get(body.refresh_token);
      if (!id) throw authError(400, 'refresh_token_not_found', 'Invalid Refresh Token: Refresh Token Not Found');
      refreshTokens.delete(body.refresh_token);
      return [200, await session(await findUser('id = $1', [id]))];
    }
    throw authError(400, 'unsupported_grant_type', `grant_type não suportado: ${grant}`);
  }
  if (route === '/user' && req.method === 'GET') {
    const claims = await claimsFrom(req).catch(() => null);
    if (!claims?.sub) throw authError(401, 'no_authorization', 'This endpoint requires a valid Bearer token');
    const u = await findUser('id = $1', [claims.sub]);
    if (!u) throw authError(404, 'user_not_found', 'User not found');
    return [200, userJson(u)];
  }
  if (route === '/logout' && req.method === 'POST') return [204, undefined];
  if (route === '/recover' && req.method === 'POST') return [200, {}];
  if (route === '/signup' && req.method === 'POST') {
    if (!body.email || !body.password || body.password.length < 6) throw authError(422, 'weak_password', 'Password should be at least 6 characters.');
    if (await findUser('lower(email) = lower($1)', [body.email])) throw authError(422, 'user_already_exists', 'User already registered');
    const r = await pool.query(
      `insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
       values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', $1, crypt($2, gen_salt('bf')), now(),
               '{"provider":"email","providers":["email"]}', $3) returning ${USER_COLS}`,
      [body.email, body.password, JSON.stringify(body.data ?? {})]);
    return [200, await session(r.rows[0])];
  }
  throw authError(404, 'not_found', `rota de auth não emulada: ${req.method} ${route}`);
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------
function bad(msg) { const e = new Error(msg); e.status = 400; e.code = 'PGRST100'; return e; }
const PG_STATUS = { '42501': 403, '23505': 409, P0002: 404, '23503': 409, '23514': 400, '22P02': 400 };
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.zip': 'application/zip' };

function send(res, req, status, data, extra = {}) {
  const headers = {
    'access-control-allow-origin': req.headers.origin ?? '*',
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info, accept-profile, content-profile, prefer, range, x-supabase-api-version',
    'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS, HEAD',
    'access-control-expose-headers': 'content-range',
    ...extra,
  };
  if (data === undefined || status === 204) { res.writeHead(status === 200 ? 204 : status, headers); return res.end(); }
  if (Buffer.isBuffer(data)) { res.writeHead(status, headers); return res.end(data); }
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { throw bad('corpo JSON inválido'); }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const t0 = Date.now();
  try {
    if (req.method === 'OPTIONS') return send(res, req, 204);

    if (url.pathname.startsWith('/auth/v1')) {
      const [status, data] = await handleAuth(req, url, req.method === 'GET' ? {} : await readBody(req));
      return send(res, req, status, data);
    }

    if (url.pathname.startsWith('/storage/v1/object/public/')) {
      const rel = decodeURIComponent(url.pathname.replace('/storage/v1/object/public/', ''));
      const file = path.resolve(STORAGE_DIR, rel);
      if (!file.startsWith(STORAGE_DIR)) throw bad('caminho inválido');
      try {
        const buf = await readFile(file);
        return send(res, req, 200, buf, { 'content-type': MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'public, max-age=3600' });
      } catch { const e = new Error('Object not found'); e.status = 404; throw e; }
    }

    if (url.pathname.startsWith('/rest/v1/')) {
      const claims = await claimsFrom(req);
      const target = url.pathname.replace('/rest/v1/', '');
      const wantsObject = (req.headers.accept ?? '').includes('vnd.pgrst.object');

      if (target.startsWith('rpc/') && req.method === 'POST') {
        const body = await readBody(req);
        const data = await asRole(claims, (c) => callRpc(c, target.slice(4), body));
        return send(res, req, 200, data);
      }
      if (req.method === 'GET' || req.method === 'HEAD') {
        const { sql, values } = buildSelect(target, url.searchParams);
        const rows = await asRole(claims, async (c) => (await c.query(sql, values)).rows[0].data);
        const range = { 'content-range': rows.length ? `0-${rows.length - 1}/*` : '*/0' };
        if (wantsObject) {
          if (rows.length !== 1) return send(res, req, 406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: `The result contains ${rows.length} rows`, hint: null });
          return send(res, req, 200, rows[0], range);
        }
        return send(res, req, 200, req.method === 'HEAD' ? undefined : rows, range);
      }
      throw bad(`${req.method} não emulado em /rest/v1 — o app escreve apenas por RPC`);
    }

    send(res, req, 404, { message: 'rota não emulada' });
  } catch (e) {
    const status = e.status ?? PG_STATUS[e.code] ?? 400;
    const payload = e.auth ?? { code: e.code ?? null, message: e.message, details: e.detail ?? null, hint: e.hint ?? null };
    send(res, req, status, payload);
    if (!process.env.QUIET) console.error(`✗ ${req.method} ${url.pathname} → ${status} ${e.code ?? ''} ${e.message}`);
  } finally {
    if (process.env.VERBOSE) console.log(`${req.method} ${url.pathname}${url.search} ${res.statusCode} ${Date.now() - t0}ms`);
  }
});

server.listen(PORT, () => {
  console.log(`Emulador Supabase em http://localhost:${PORT}  (banco: ${DATABASE_URL})`);
  console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}`);
});

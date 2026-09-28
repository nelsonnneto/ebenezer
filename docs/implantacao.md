# Implantação da versão de demonstração

Supabase hospedado (banco, Auth, Storage) + Vercel (app Next.js). Dados 100% sintéticos.

| Item | Valor |
|---|---|
| Projeto Supabase | `pcjxjneqzzhlyxfexaja` · West US (Oregon) · plano Free |
| URL da API | `https://pcjxjneqzzhlyxfexaja.supabase.co` |
| Chave usada pelo app | *publishable key* (`sb_publishable_…`) — pública por natureza; o que ela alcança é decidido pela RLS |
| Chaves que **nunca** entram no app nem no repositório | *secret key* / `service_role`, senha do banco |

## 1. Banco (uma vez, em projeto vazio)

1. Gere os scripts: `scripts/gerar-sql-hospedado.sh` → `dist/ebenezer-supabase-hospedado.sql` (instalação: migrações + seed + epílogo) e `dist/ebenezer-supabase-limpar.sql` (limpeza).
2. Copie o arquivo inteiro sem passar por editor de texto: `pbcopy < dist/ebenezer-supabase-hospedado.sql`.
3. Supabase → **SQL Editor** → *New query* → cole → sem nada selecionado → **Run**.
4. O resultado final é uma linha de conferência: 25 usuários, 25 doadores, 4 programas, 1 embaixador, 135 doações, 18 publicações, 1 bucket `midia`.

**O SQL Editor pode executar cada comando numa sessão própria e não trata o script como uma transação.** Por isso o script não cria objetos auxiliares (tabelas temporárias ou schemas de apoio) — cada comando do seed é autossuficiente —, não usa `set local` e qualifica as funções do pgcrypto (`extensions.crypt`). Se ainda assim o script único falhar, `dist/partes/` traz a mesma instalação em três arquivos (1-esquema, 2-dados, 3-ajustes) para executar um de cada vez. Se a execução parar no meio, rode `dist/ebenezer-supabase-limpar.sql` (remove o schema `public` do projeto, o gatilho em `auth.users` e os usuários `@exemplo.com.br`; preserva o bucket e as fotos) e execute a instalação de novo. A instalação se recusa a rodar sobre um projeto que já tenha o esquema.

Verificação feita antes da entrega: instalação → limpeza → instalação, executando cada comando numa conexão nova, com o pgcrypto no schema `extensions` e `search_path` sem `extensions` (condições do Supabase hospedado).

Mudanças futuras de esquema entram como **novas** migrações e são aplicadas uma a uma no SQL Editor (ou com `supabase db push`).

## 2. Imagens

Supabase → **Storage** → bucket `midia` (criado pelo script) → *Upload files* → as seis fotos de `supabase/storage/midia/`, na raiz do bucket e com os mesmos nomes.

## 3. Auth

- **Authentication → Sign In / Providers → Email**: desligar *Confirm email*. Na demonstração o cadastro entra direto; com a confirmação ligada, o app mostra a mensagem de "verifique seu e-mail" (o fluxo já trata os dois casos).
- **Authentication → URL Configuration**: *Site URL* = endereço da Vercel; em *Redirect URLs*, `https://<endereço>/**`.
- O SMTP nativo do Supabase só entrega e-mails a membros da organização e com limite horário baixo. Recuperação de senha para usuários reais exige SMTP próprio (pendência de produção).

## 4. Vercel

1. *Add New → Project* → importar `nelsonnneto/ebenezer`.
2. **Root Directory: `web`** (framework detectado: Next.js).
3. *Environment Variables*:

   | Nome | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://pcjxjneqzzhlyxfexaja.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | a *publishable key* |
   | `NEXT_PUBLIC_SITE_URL` | o endereço público do app (ex.: `https://ebenezer-conecta.vercel.app`) |

4. *Deploy*. Se o endereço definitivo só aparecer depois do primeiro deploy, ajuste `NEXT_PUBLIC_SITE_URL` e faça *Redeploy* — as variáveis `NEXT_PUBLIC_*` são embutidas no build.

## 5. Conferência pós-implantação

- `/conheca` abre sem login com indicadores e fotos.
- Login com `eduardo@exemplo.com.br` / `Ebenezer2026!` → Home com 14 meses e o certificado EC-2026-000148.
- Janela anônima: `/r/renata-c?c=whatsapp` → cadastro → doação → a Central da Renata passa a 13 doadores.
- `/verificar?n=EC-2026-000148` confirma o registro sem mostrar o nome.

## Salvaguardas aplicadas nesta etapa (migração 0011)

- **Funções internas fora da API.** `fn_confirmar_doacao`, `fn_emitir_certificado_interno`, `fn_avaliar_marcos*`, `fn_origem_do_doador` e o job de cobrança deixaram de ser executáveis por `PUBLIC`. Antes, o `revoke … from anon` não surtia efeito porque o Postgres concede `EXECUTE` a `PUBLIC` por padrão — um visitante poderia registrar uma doação confirmada fictícia chamando a função diretamente. Coberto por teste (pgTAP 0005).
- **Limite no link público.** No máximo 30 acessos por minuto por embaixador são registrados; acima disso a pessoa segue para a página, sem contar na métrica. Nenhum IP é armazenado.
- **pgcrypto no schema `extensions`.** As funções de certificado passaram a enxergar o schema onde o Supabase hospedado instala a extensão.

## Pendências de produção (fora do MVP)

- Região: em produção, `sa-east-1` (São Paulo) reduz a latência para doadores no Brasil.
- Job de cobrança (`fn_processar_cobrancas`) agendado com `pg_cron` ou n8n — na demonstração o histórico vem do seed.
- SMTP próprio e tela de redefinição de senha após o link de recuperação.
- Domínio definitivo (os textos prontos dos materiais usam `ebenezerconecta.org.br`; o app substitui pelo endereço em uso).

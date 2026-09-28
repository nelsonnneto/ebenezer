# EbenézerConecta

Plataforma de relacionamento com doadores do Instituto Social Ebenézer — MVP da Semana 10 do MBA em IA e Dados para Negócios (Inteli, Módulo 3, Desafio A: sustentabilidade e captação).

O produto converte o doador episódico em recorrente e o mantém: doação em poucos passos, controle total da recorrência, evidência agregada de resultado, reconhecimento por continuidade e mobilização da própria rede. Toda regra de negócio vive no banco; o front-end só chama funções e lê views.

**No ar (dados sintéticos):** https://ebenezer-vert.vercel.app · página pública: https://ebenezer-vert.vercel.app/conheca

**Protótipo navegável (Figma):** https://www.figma.com/proto/FF5lpXwZLKRE6GdU7qBhcN/?node-id=106-1059&starting-point-node-id=106-1059&scaling=min-zoom

## Estrutura

```
supabase/
  config.toml            configuração do Supabase CLI (Auth, Storage, bucket de imagens, seed)
  migrations/            12 migrations: enums → 4 domínios → funções → views → RLS → alinhamento ao Figma
                         → rede e feed → ambiente hospedado → anonimização
  seed.sql               dados sintéticos, relativos ao mês corrente
  storage/midia/         as seis fotos ilustrativas
  hospedado/             epílogo (Auth/Storage) e limpeza do projeto hospedado
  tests/                 pgTAP: esquema, regras, RLS, RPCs, rede, segurança e LGPD (83 asserções)
web/                     front-end Next.js 16 + Tailwind 4, fiel ao protótipo em Figma
  src/app/               telas públicas (conheça, cadastro, acesso, verificar) e do doador
  e2e/                   Playwright: US-01 a US-05 e página pública (12 testes) + evidências
dev/supabase-local/      emulador da API do Supabase para ambientes sem Docker (ADR-07)
scripts/                 db-local.sh (banco de testes) · gerar-sql-hospedado.sh (scripts para o SQL Editor)
testes/                  planilha de registro dos testes com usuários
docs/                    modelo de dados · decisões (ADR) · implantação · operação · custos
                         · testes com usuários · roteiro do vídeo
.github/workflows/       CI (pgTAP + build + e2e) · manter-ativo (evita a pausa do plano gratuito)
```

## Documentação

| Documento | Para quê |
|---|---|
| [`docs/modelo-de-dados.md`](docs/modelo-de-dados.md) | entidades, relacionamentos, base legal e retenção de cada dado |
| [`docs/decisoes.md`](docs/decisoes.md) | decisões de arquitetura (ADR-01 a ADR-10) |
| [`docs/implantacao.md`](docs/implantacao.md) | como publicar no Supabase e na Vercel |
| [`docs/operacao.md`](docs/operacao.md) | rotinas da coordenação e manutenção técnica |
| [`docs/custos.md`](docs/custos.md) | custo da demonstração e estimativa de produção |
| [`docs/testes-com-usuarios.md`](docs/testes-com-usuarios.md) + [`testes/registro-testes.xlsx`](testes/registro-testes.xlsx) | roteiro e registro dos testes com 3 usuários |
| [`docs/roteiro-video.md`](docs/roteiro-video.md) | roteiro do vídeo de demonstração |

## Rodar o banco

**Opção A — Supabase CLI (Docker):**

```bash
supabase start          # sobe Postgres, Auth, Storage e Studio locais
supabase db reset       # aplica migrations + seed do zero
supabase test db        # roda os testes pgTAP
```

Studio em http://localhost:54323 · API em http://localhost:54321.

**Opção B — Postgres 16 local, sem Docker** (é o que a CI usa):

```bash
sudo apt-get install postgresql-16 postgresql-16-pgtap
scripts/db-local.sh localhost 5433
```

## Rodar o app

```bash
# 1. Backend — escolha um:
supabase start && supabase db reset          # opção A: Supabase CLI (Docker)
scripts/db-local.sh && (cd dev/supabase-local && npm ci && npm start)   # opção B: sem Docker

# 2. Front-end
cd web
npm ci
cp .env.example .env.local                   # as chaves locais são as mesmas nas duas opções
npm run dev                                  # http://localhost:3000

# 3. Testes ponta a ponta (com o passo 1 e o `npm run dev` ativos)
npx playwright test                          # recria o banco de testes antes de rodar
```

| Rota | Tela do Figma | User story |
|---|---|---|
| `/conheca`, `/r/<slug>`, `/cadastro` | Conheça o Instituto — Página Pública, Criar Conta (pedido da validação) | US-05 |
| `/acesso`, `/recuperar-senha` | Acesso, Recuperar Senha, Recuperação Enviada | pré-condição |
| `/` | Homepage — Média fidelidade | US-02, US-03 |
| `/doar`, `/doar/confirmada` | Doação, Doação Confirmada | US-01 |
| `/recorrencia` | Gerenciar Recorrência | US-02 |
| `/jornada` | Minha Jornada | US-04 |
| `/certificados`, `/verificar` | Certificado | US-04 |
| `/atividades` | Atividades | US-03 |
| `/mobilizar`, `/compartilhar` | Mobilizar, Compartilhar | US-05 |

**Imagens.** Os seis arquivos em `supabase/storage/midia/` são as fotos ilustrativas do protótipo (1168 × 784). Não retratam crianças atendidas pelo Instituto; toda tela que as exibe traz essa indicação. Para trocar uma imagem, mantenha o nome do arquivo: `01-dia-de-arte.jpg`, `02-reforco-escolar.jpg`, `03-primeira-infancia.jpg`, `04-tecnologia.jpg`, `05-roda-de-conversa.jpg`, `06-patio-grupo.jpg`.

## Versão de demonstração (hospedada)

Supabase hospedado + Vercel. Passo a passo, variáveis e conferência em [`docs/implantacao.md`](docs/implantacao.md).

## Usuários de demonstração

Todos com senha `Ebenezer2026!`. Nenhum corresponde a pessoa real.

| E-mail | Perfil | Estado |
|---|---|---|
| `eduardo@exemplo.com.br` | doador recorrente — usuário da demo | R$ 120/mês, 14 meses consecutivos, 4 marcos e 4 certificados (EC-2026-000148 = Guardião da Comunidade), 10 meses para o Guardião da Educação |
| `rafael@exemplo.com.br` | doador pontual | 1 Pix há 5 meses; Primeiro Passo |
| `renata@exemplo.com.br` | embaixadora (`/r/renata-c`) | 67 acessos, 12 doadores mobilizados, 7 recorrentes |
| — | visitante | abra `/r/renata-c?c=whatsapp` numa janela anônima, crie a conta e doe: a Central da Renata passa a 13 |
| `coordenacao@exemplo.com.br` | coordenação | lê tudo, publica e atualiza indicadores |

## Perímetro ético

Nenhuma tabela identifica criança atendida; a menor granularidade é programa × mês. Toda imagem é ilustrativa por construção até que uma autorização de uso seja registrada. Valores doados são privados por padrão e nunca aparecem em view acessível a terceiros. Ver `docs/modelo-de-dados.md` e `docs/decisoes.md`.

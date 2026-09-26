# EbenézerConecta

Plataforma de relacionamento com doadores do Instituto Social Ebenézer — MVP da Semana 10 do MBA em IA e Dados para Negócios (Inteli, Módulo 3, Desafio A: sustentabilidade e captação).

O produto converte o doador episódico em recorrente e o mantém: doação em poucos passos, controle total da recorrência, evidência agregada de resultado, reconhecimento por continuidade e mobilização da própria rede. Toda regra de negócio vive no banco; o front-end só chama funções e lê views.

**Protótipo navegável (Figma):** https://www.figma.com/proto/FF5lpXwZLKRE6GdU7qBhcN/?node-id=106-1059&starting-point-node-id=106-1059&scaling=min-zoom

## Estrutura

```
supabase/
  config.toml            configuração do Supabase CLI (Auth, Storage, seed)
  migrations/            8 migrations: enums → 4 domínios → funções → views → RLS
  seed.sql               dados sintéticos, relativos ao mês corrente
  tests/                 pgTAP: esquema, regras, RLS e RPCs (58 asserções)
scripts/db-local.sh      recria e testa o banco num Postgres puro (sem Docker)
docs/                    modelo de dados, decisões técnicas, operação, custos
web/                     front-end Next.js (bloco 2)
```

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

## Usuários de demonstração

Todos com senha `Ebenezer2026!`. Nenhum corresponde a pessoa real.

| E-mail | Perfil | Estado |
|---|---|---|
| `eduardo@exemplo.com.br` | doador recorrente — usuário da demo | 14 meses consecutivos, 4 marcos, certificado EC-2026-000148 |
| `rafael@exemplo.com.br` | doador pontual | 1 Pix há 5 meses; Primeiro Passo |
| `renata@exemplo.com.br` | embaixadora (`/r/renata-c`) | 67 acessos, 12 doadores mobilizados, 7 recorrentes |
| `coordenacao@exemplo.com.br` | coordenação | lê tudo, publica e atualiza indicadores |

## Perímetro ético

Nenhuma tabela identifica criança atendida; a menor granularidade é programa × mês. Toda imagem é ilustrativa por construção até que uma autorização de uso seja registrada. Valores doados são privados por padrão e nunca aparecem em view acessível a terceiros. Ver `docs/modelo-de-dados.md` e `docs/decisoes.md`.

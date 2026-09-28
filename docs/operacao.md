# Operação: guia para quem mantém a plataforma

Público: a coordenação do Instituto e quem der suporte técnico. O MVP não tem painel administrativo próprio. A coordenação opera pelo **painel do Supabase** (Table Editor e SQL Editor) e as regras do banco garantem que nada quebre a coerência dos dados. Um painel administrativo é a evolução natural (ver "Pendências de produção" em `docs/implantacao.md`).

| Onde | Endereço |
|---|---|
| App publicado | `https://ebenezer-vert.vercel.app` |
| Página pública (para os perfis do Instituto) | `https://ebenezer-vert.vercel.app/conheca` |
| Link institucional por rede | `https://ebenezer-vert.vercel.app/r/instituto?c=instagram` (ou `linkedin`, `x`, `facebook`, `whatsapp`) |
| Banco, login e imagens | Supabase, projeto `pcjxjneqzzhlyxfexaja` |
| Hospedagem do app | Vercel, time *Inteli Modulo 3*, projeto `ebenezer` |
| Código | `github.com/nelsonnneto/ebenezer` (cada `git push` na `main` publica uma nova versão) |

---

## 1. Rotinas da coordenação

### Publicar uma atividade no feed
1. Supabase → **Storage → midia** → *Upload* da imagem, se houver. Use apenas imagens **ilustrativas ou autorizadas**; nunca uma foto que identifique uma criança atendida.
2. **Table Editor → imagem** → *Insert row*: `url_storage` = `midia/<arquivo>`, `descricao_alt` (texto alternativo), `ilustrativa` = `true`.
3. **Table Editor → publicacao** → *Insert row*:
   - `programa_id`: o programa (Laboratório de Sonhos, Reforço Escolar ou Primeira Infância; Vivência Terapêutica não gera publicações);
   - `titulo`, `texto`, `cadencia` (`diaria`, `semanal` ou `mensal`);
   - `metrica_rotulo` (ex.: "+24 horas de atividade"), `imagem_id`;
   - `publico` = `true` para aparecer na página pública, `status` = `publicada`, `publicada_em` = agora.
4. Conferir em `/atividades` (logado) e em `/conheca` (se pública).

### Atualizar os indicadores do mês (até o 1º dia útil)
**Table Editor → indicador** → uma linha por programa e tipo, com `periodo` = primeiro dia do mês (ex.: `2026-10-01`).
- Tipos: `criancas_atendidas`, `horas_atividade`, `frequencia_media` (em %), `atividades_realizadas`.
- `publico` = `true` para a página pública.
- Apenas números agregados por programa, nunca dado individual. A regra de agregação (crianças = último mês; horas e atividades = soma; frequência = média) está no banco, em `fn_painel_impacto`.

### Desativar o link de um embaixador
**Table Editor → embaixador** → `ativo` = `false`. O link passa a registrar acessos sem atribuí-los a ninguém, e o doador não consegue reativá-lo sozinho.

### Atender um pedido de exclusão de dados (LGPD)
No **SQL Editor**, com o e-mail do titular:
```sql
select public.fn_anonimizar_doador(id) from public.doador where email = 'pessoa@exemplo.com';
```
A função substitui nome e e-mail por valores anônimos e mantém as doações apenas para fins fiscais e contábeis, sem identificação. Registre a data do atendimento.

### Consultar a origem das doações (captação)
A coordenação lê `v_rede_origem_canal` e `v_rede_embaixador` no Table Editor: acessos e novos doadores por canal e por embaixador. Os embaixadores veem apenas a própria rede, sempre agregada.

## 2. Rotinas técnicas

| Rotina | Frequência | Como |
|---|---|---|
| Manter o projeto gratuito ativo | automática | O plano gratuito do Supabase pausa projetos sem atividade por 1 semana. O workflow `.github/workflows/manter-ativo.yml` acessa a página pública a cada 3 dias. Se o projeto pausar mesmo assim, reative em Supabase → *Restore project*. |
| Conferir erros do app | semanal | Vercel → projeto → **Logs**, filtro *Error* (o plano gratuito guarda 1 hora de logs). |
| Cópia de segurança | mensal (plano gratuito) | O plano gratuito do Supabase não faz backup diário. Exporte as tabelas principais em Table Editor → *Export to CSV*, ou use `supabase db dump`. No plano Pro há backup diário com 7 dias de retenção. |
| Nova versão do app | a cada mudança | `git push` na `main`; a Vercel publica em 1 a 3 minutos. Para reverter: Vercel → Deployments → versão anterior → *Promote to Production*. |
| Mudança no banco | a cada mudança | Nova migração em `supabase/migrations/`, testada localmente (`scripts/db-local.sh`), aplicada no SQL Editor. Nunca editar uma migração já aplicada. |
| Restaurar a demonstração | antes de testes e apresentações | `dist/ebenezer-supabase-limpar.sql` e depois `dist/ebenezer-supabase-hospedado.sql`, ambos no SQL Editor (`docs/implantacao.md`). |

## 3. Configuração que não pode se perder

| Onde | O quê |
|---|---|
| Vercel → Environment Variables | `SUPABASE_URL`, `SUPABASE_ANON_KEY` (publishable key), `SITE_URL` |
| Supabase → Authentication → URL Configuration | *Site URL* e *Redirect URLs* com o endereço público |
| Supabase → Authentication → Email | *Confirm email* desligado na demonstração (ligar em produção, com SMTP próprio) |
| Supabase → Storage | bucket `midia` público, com as seis fotos |

**Nunca** coloque a *secret key* (`sb_secret_…`), a `service_role` ou a senha do banco na Vercel, no código ou em mensagens.

## 4. Quando algo dá errado

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| "Internal Server Error" em todas as páginas | variável de ambiente ausente ou com nome errado | Vercel → Logs mostra "Variável de ambiente ausente: …"; corrigir e fazer *Redeploy* |
| Página abre, mas sem dados e sem login | projeto Supabase pausado | Supabase → *Restore project* |
| Fotos não aparecem | arquivo ausente ou com nome diferente no bucket `midia` | reenviar com o nome exato |
| Cadastro diz "verifique seu e-mail" | *Confirm email* ligado | desligar na demonstração, ou configurar SMTP |
| Link do embaixador não soma acessos | mais de 30 acessos por minuto no mesmo link (limite antiabuso) ou link desativado | aguardar; conferir `embaixador.ativo` |

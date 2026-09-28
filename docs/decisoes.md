# Registro de decisões técnicas

Cada decisão em meia página: contexto, decisão, consequências. Numeradas na ordem em que foram tomadas.

## ADR-01 · Backend low-code (Supabase) com front-end em código

**Contexto.** O módulo define desenvolvimento em plataformas no-code/low-code; o Instituto não tem equipe de tecnologia (bloco 5 do dossiê); o protótipo em Figma tem 12 telas com fidelidade média que a equipe quer preservar.

**Decisão.** Banco, autenticação, storage e políticas de acesso no Supabase (low-code). Front-end em Next.js gerado a partir do Figma, **sem nenhuma regra de negócio** — só chama RPCs e lê views.

**Consequências.** Toda a lógica é auditável em SQL e sobrevive à troca do front por uma ferramenta no-code (Softr, Glide, Lovable) sem perda. A coordenação opera pelo Supabase Studio. O custo de front é zero (Vercel Hobby); o de backend entra no business case como risco, não como custo fixo.

## ADR-02 · Lógica de negócio no banco, não no aplicativo

**Contexto.** Marcos, continuidade, conversão de rede e agregação de indicadores precisam ser idênticos em qualquer cliente e impossíveis de burlar.

**Decisão.** Views (`v_*`) para leitura e funções `security definer` (`fn_*`) para escrita. Tabelas de reconhecimento (`conquista`, `certificado`) não aceitam escrita direta de usuário — só de função — e são imutáveis por trigger.

**Consequências.** O front não consegue inventar um marco nem expor um valor que a RLS esconde. Testes de regra são testes SQL (pgTAP), executáveis em CI sem subir o app.

## ADR-03 · Nenhuma entidade "criança"

**Contexto.** Bloco 6 do dossiê: dado sobre criança atendida é sensível (LGPD art. 11), exige consentimento específico (art. 14) e parte dele é sigilo profissional. Nenhum grupo recebe registro individual.

**Decisão.** O esquema não tem tabela, coluna nem chave que identifique uma criança. A menor granularidade é `indicador` por programa × mês. `imagem.ilustrativa` é obrigatório enquanto não houver `autorizacao_ref`.

**Consequências.** A atribuição de causalidade individual que o §11 do produto proíbe é impossível por construção. O Desafio B (medir evolução socioemocional) fica fora do produto: ele consome indicador agregado, não o produz.

## ADR-04 · Cobrança simulada

**Contexto.** Regra 1 do bloco 6 proíbe dado real no protótipo e no MVP; não há CNPJ, conta nem gateway do Instituto disponíveis ao grupo.

**Decisão.** `doacao.meio = 'simulado'` e `fn_processar_cobrancas()` geram os eventos que um gateway geraria. O ponto de integração é uma única função (`fn_confirmar_doacao`).

**Consequências.** A demo mostra 14 meses de histórico em segundos. Integrar Pix ou cartão depois é substituir a origem do evento, não redesenhar o modelo.

## ADR-05 · Marcos por continuidade, nunca por valor

**Contexto.** §7 do produto: reconhecimento, não competição; sem ranking por valor; sem linguagem de perda.

**Decisão.** `marco.meses_requeridos` mede meses consecutivos; pausa congela a contagem sem zerar; marco conquistado é permanente. Valores individuais não aparecem em nenhuma view acessível a terceiros.

**Consequências.** Um doador de R$ 25 e um de R$ 500 percorrem a mesma trilha. Ranking por valor é impossível por ausência de dado exposto, não por escolha de tela.

**Revisão (Bloco 2).** Guardião da Educação passou de "ano-calendário completo" para 24 meses consecutivos, alinhado às telas Minha Jornada e Certificado do protótipo. A regra especial saiu do código: os cinco marcos da trilha do doador seguem o mesmo critério de continuidade.

## ADR-06 · Rastreio de origem por link próprio, sem tracker de terceiros

**Contexto.** Embaixadores precisam ver conversão; perfis institucionais precisam de link rastreável (achado da validação da Semana 5); LGPD limita coleta.

**Decisão.** `/r/<slug>?c=<canal>` cria uma `origem` anônima (embaixador + canal + data); no primeiro login ela é vinculada ao doador. Sem cookies de terceiros, sem fingerprint, sem IP armazenado.

**Consequências.** O embaixador vê só agregados (`v_rede_embaixador`); a coordenação vê a origem de cada doação; o doador pode ser anonimizado sem perder o dado fiscal.

## ADR-07 · Emulador local da API do Supabase para ambientes sem Docker

**Contexto.** O ambiente de desenvolvimento usado na construção do MVP não tem Docker nem acesso aos binários do PostgREST e do GoTrue; sem eles, o front não pode ser verificado ponta a ponta.

**Decisão.** `dev/supabase-local/server.mjs` implementa só o subconjunto da API que o app usa — leitura de views com filtros simples, RPC com argumentos nomeados, login por senha, `/user`, logout, recuperação e o Storage público — executando cada requisição numa transação com `set local role` e `request.jwt.claims`. As chaves são as mesmas do Supabase CLI local, então o `.env` não muda entre os dois.

**Consequências.** A RLS, as funções e as views são exercitadas de verdade: o emulador troca o servidor HTTP, não o banco. É ferramenta de desenvolvimento e de CI; não é implantável. O caminho padrão continua sendo `supabase start`. O app escreve no banco **só por RPC**, o que mantém o emulador pequeno e o contrato do front estreito.

## ADR-08 · Front-end sem estado próprio de negócio

**Contexto.** ADR-01 exige que o front possa ser trocado por uma ferramenta no-code sem perda.

**Decisão.** Next.js 16 com Server Components para leitura e Server Actions para escrita; cada ação chama exatamente uma RPC e só traduz o erro para o doador. O único conteúdo mantido no front são os três planos sugeridos da tela de Doação (nomes e textos editoriais) e as paradas do seletor de valor — o banco aceita qualquer valor entre R$ 25 e R$ 500.

**Consequências.** Nenhuma regra de marco, continuidade, agregação ou privacidade existe em TypeScript. Os testes de regra ficam no pgTAP; os testes do app verificam apenas o percurso das user stories.

## ADR-09 · Embaixador por adesão e porta de entrada pública

**Contexto.** O protótipo trata a Central do Embaixador como área de quem já mobiliza (Renata), mas não desenha como um doador passa a ter link. A validação com João Pedro Machado pediu que a plataforma fosse acessível por um link nos perfis do Instituto (Instagram, X, LinkedIn, Facebook) — o que exige uma página que abra sem login. O protótipo não tinha essa tela; ela foi desenhada depois do código (frames *Conheça o Instituto — Página Pública* e *Criar Conta*, com o fluxo de protótipo *Visitante (link público)*).

**Decisão.**
1. *Adesão pelo próprio doador.* `fn_tornar_embaixador()` cria o link de quem já tem ao menos uma doação confirmada. É idempotente, gera slug legível (`eduardo-m`) e reserva `instituto`, `conheca` e `admin`. A coordenação pode desativar o link (`embaixador.ativo = false`); o doador não o reativa sozinho.
2. *Link institucional.* `/r/instituto?c=<rede>` é o endereço para os perfis do Instituto: gera `origem` sem embaixador, com o canal. É o link que atende ao pedido da validação.
3. *Porta de entrada.* `/r/<slug>` registra a origem, grava um cookie próprio `ec_origem` (httpOnly, 90 dias, sem dado pessoal) e leva a `/conheca`, que mostra apenas o que a RLS entrega ao papel `anon`: indicadores e publicações marcados como públicos e o total agregado da meta anual. O convite é anunciado sem nomear quem convidou.
4. *Vinculação.* `/cadastro` (ou `/acesso`, para quem já tem conta) chama `fn_vincular_origem` com o cookie; a função só vincula se o doador ainda não tiver origem. Atribuição por **último clique** dentro da janela de 90 dias.
5. *Compartilhar.* Os textos sugeridos são conteúdo editorial do front (exceção à ADR-08, como os planos) e nunca incluem valor. Cada clique numa rede chama `fn_registrar_compartilhamento`, que alimenta o marco Voz da Causa.

**Consequências.** O embaixador passa a ser um estado do doador, não um cadastro à parte. `origem` pode receber linhas de visitantes que não se cadastram (é o que mede acessos e conversão); a função é aberta ao `anon`; por isso a migração 0011 limita o registro a 30 acessos por minuto por embaixador, sem guardar IP. O consentimento de comunicação é opcional e gravado com data (`fn_atualizar_consentimento`); a conta em si se apoia na execução do contrato de doação (LGPD, art. 7º, V).

**Lacunas do protótipo.** A "Agenda da próxima semana" da tela Atividades foi retirada do escopo por decisão do time: não há entidade de agenda no modelo e criá-la só para a tela seria conteúdo sem dono. Em seu lugar, um cartão com a cadência de publicação. O "Balanço da semana" é derivado das publicações (não há indicador semanal).

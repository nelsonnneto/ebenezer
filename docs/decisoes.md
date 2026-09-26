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

## ADR-06 · Rastreio de origem por link próprio, sem tracker de terceiros

**Contexto.** Embaixadores precisam ver conversão; perfis institucionais precisam de link rastreável (achado da validação da Semana 5); LGPD limita coleta.

**Decisão.** `/r/<slug>?c=<canal>` cria uma `origem` anônima (embaixador + canal + data); no primeiro login ela é vinculada ao doador. Sem cookies de terceiros, sem fingerprint, sem IP armazenado.

**Consequências.** O embaixador vê só agregados (`v_rede_embaixador`); a coordenação vê a origem de cada doação; o doador pode ser anonimizado sem perder o dado fiscal.

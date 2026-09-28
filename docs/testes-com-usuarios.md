# Testes com usuários: roteiro de moderação

**Objetivo.** Verificar se as cinco user stories do MVP são executáveis por pessoas reais, sem ajuda, na versão publicada (`https://ebenezer-vert.vercel.app`), e identificar os problemas de uso que mais afetam a conversão e a permanência do doador.

**Formato.** Três sessões individuais, moderadas, de cerca de 30 minutos cada, presenciais ou por videochamada com compartilhamento de tela. Cada participante representa um dos três perfis de uso do produto. O registro é feito na planilha `testes/registro-testes.xlsx`.

| Sessão | Perfil | Conta usada | User stories cobertas |
|---|---|---|---|
| P1 | Pessoa que nunca doou e chega por convite de uma embaixadora | cria a própria conta (e-mail fictício) | US-05 (entrada pelo link), US-01 |
| P2 | Doador recorrente que quer ajustar o apoio e acompanhar o impacto | `eduardo@exemplo.com.br` | US-02, US-03, US-04 |
| P3 | Embaixadora que mobiliza a própria rede | `renata@exemplo.com.br` | US-05 |

Os perfis correspondem às personas da documentação do projeto (PPT). Se os nomes das personas forem outros, basta ajustar a coluna "Perfil"; as tarefas não mudam.

**Ordem.** P1 antes de P3: a doação de P1 pelo link da Renata aparece na Central do Embaixador de P3, o que torna a tarefa P3-T1 verificável. P2 é independente.

---

## 1. Antes das sessões

1. **Restaurar os dados de demonstração** (limpeza + instalação no SQL Editor, ver `docs/implantacao.md`). Isso garante o mesmo ponto de partida para todos: Eduardo com R$ 120/mês e 14 meses; Renata com 12 doadores mobilizados.
2. Conferir, na versão publicada, que `/conheca` abre e que os logins do Eduardo e da Renata funcionam.
3. Separar para P1 um e-mail fictício, por exemplo `teste1@exemplo.com.br`, e uma senha simples (`Teste2026!`). **Nenhum dado pessoal real entra na plataforma**, e o pagamento é simulado.
4. Para P2 e P3, deixar o navegador já logado na conta correspondente, ou entregar e-mail e senha (`Ebenezer2026!`).
5. Abrir a planilha de registro e o cronômetro.

## 2. Abertura (3 min) — texto sugerido

> Obrigado por participar. Estamos testando a plataforma, não você: se algo ficar difícil, o problema é do produto e é exatamente isso que queremos descobrir. Vou pedir algumas tarefas; enquanto faz, pense em voz alta — diga o que está procurando, o que espera que aconteça e o que te surpreende. Eu não vou ajudar durante as tarefas, mas no fim conversamos sobre tudo. Todos os dados na plataforma são fictícios; nenhum pagamento é real. Posso registrar suas falas e [se aplicável] gravar a tela? Os registros serão usados só neste trabalho, sem seu nome.

Registrar o consentimento na planilha (aba Participantes). Sem consentimento para gravação, anotar apenas.

## 3. Tarefas

Leia cada tarefa em voz alta e entregue-a por escrito. Cronometre do fim da leitura até a pessoa dizer "terminei" ou desistir. Se a pessoa travar por mais de 3 minutos, ofereça seguir para a próxima e registre "não concluída".

Após cada tarefa, pergunte: **"De 1 (muito difícil) a 7 (muito fácil), quão fácil foi esta tarefa?"** (SEQ, Single Ease Question).

Classificação de sucesso: **S** = concluiu sem ajuda · **P** = concluiu com hesitação relevante, caminho errado ou uma dica · **N** = não concluiu.

### P1 — Pessoa que chega por convite

Envie o link por mensagem, como se fosse a Renata: `https://ebenezer-vert.vercel.app/r/renata-c?c=whatsapp` (abrir em janela anônima).

| # | Tarefa lida ao participante | Critério de sucesso |
|---|---|---|
| P1-T1 | "Uma amiga te mandou este link. Descubra o que o Instituto faz e quantas crianças foram atendidas no último mês." | Diz o número exibido no indicador "crianças atendidas no último mês" e cita pelo menos um programa. |
| P1-T2 | "Você decidiu apoiar. Crie sua conta com o e-mail e a senha deste papel." | Chega à tela de doação com a mensagem de boas-vindas. |
| P1-T3 | "Faça uma contribuição mensal de R$ 50." | Vê a tela "Doação confirmada" com o plano Semente do Impacto e R$ 50,00/mês. |
| P1-T4 | "Imagine que no mês que vem o orçamento aperte. Mostre onde você pausaria essa contribuição — não precisa pausar." | Chega à tela Gerenciar Recorrência, na área de pausa. |

### P2 — Doador recorrente (conta do Eduardo)

| # | Tarefa lida ao participante | Critério de sucesso |
|---|---|---|
| P2-T1 | "Você contribui há mais de um ano e quer aumentar sua contribuição para R$ 150 por mês. Faça isso." | Alteração confirmada: histórico mostra R$ 120,00 → R$ 150,00. |
| P2-T2 | "Descubra o que aconteceu no programa de Reforço Escolar nos últimos dias." | Filtra Atividades por Reforço Escolar (ou encontra a publicação) e resume uma atividade. |
| P2-T3 | "Quanto tempo falta para o seu próximo reconhecimento?" | Diz "10 meses" (Guardião da Educação, 14 de 24). |
| P2-T4 | "Abra seu certificado mais recente. Como alguém de fora poderia confirmar que ele é verdadeiro?" | Abre o certificado EC-2026-000148 e aponta o número de registro/verificação pública. |

### P3 — Embaixadora (conta da Renata)

| # | Tarefa lida ao participante | Critério de sucesso |
|---|---|---|
| P3-T1 | "Você divulga o Instituto entre amigos. Quantas pessoas já começaram a doar pelo seu convite, e qual rede trouxe mais gente?" | Diz 13 doadores (12 + P1) e WhatsApp. |
| P3-T2 | "Pegue uma mensagem pronta para mandar no WhatsApp com o seu link." | Copia o texto do material "Texto para WhatsApp" ou o link. |
| P3-T3 | "Prepare a publicação de um convite no LinkedIn — pode abrir o LinkedIn, mas não publique de fato." | Na tela Compartilhar, escolhe Convite e clica em LinkedIn (a aba da rede abre com o link). |
| P3-T4 | "Qual é o seu próximo reconhecimento como embaixadora e quanto falta?" | Diz "Mobilizador, faltam 12". |

## 4. Encerramento (7 min)

1. **SUS (System Usability Scale).** Entregar os 10 itens (aba SUS da planilha) com escala de 1 (discordo totalmente) a 5 (concordo totalmente). A planilha calcula a nota de 0 a 100.
2. **Perguntas abertas:**
   - "O que mais te chamou atenção, positiva ou negativamente?"
   - "Você se sentiria seguro em deixar uma contribuição mensal aqui? Por quê?"
   - "Faltou alguma informação para você decidir apoiar (ou continuar apoiando)?"
   - (P3) "Você usaria o link e os materiais com seus contatos? O que te impediria?"
3. Agradecer. Explicar que a conta criada (P1) é fictícia e será apagada.

## 5. Critérios de aceite do MVP

Definidos antes das sessões, para evitar leitura oportunista dos resultados:

| Métrica | Meta | Referência |
|---|---|---|
| Taxa de sucesso sem ajuda (S) | ≥ 80% das 12 tarefas | Tarefas centrais das user stories |
| SEQ médio por tarefa | ≥ 5,5 | Escala de 7 pontos |
| SUS médio | ≥ 68 | Média de referência da escala SUS |
| Problemas de severidade 3 ou 4 | 0 sem plano de correção | Escala de severidade de Nielsen (0 a 4) |

Com três participantes, os números são indicativos, não estatísticos. O valor principal está nos problemas observados: com cinco usuários já se identificam a maioria dos problemas de uso recorrentes, e com três os mais graves costumam aparecer. Isso deve ser dito com essa ressalva no relatório.

## 6. Depois das sessões

1. Consolidar os achados na aba **Achados** (problema, onde, quantos participantes, severidade, recomendação).
2. Classificar cada achado: corrigir antes da entrega, registrar como evolução, ou descartar (com justificativa).
3. **Restaurar os dados de demonstração** de novo antes de gravar o vídeo (a conta de P1 e as alterações de P2 e P3 mudam o estado do Eduardo e da Renata).
4. As correções feitas a partir dos testes entram como commits próprios, citando o achado.

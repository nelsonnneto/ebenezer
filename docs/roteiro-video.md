# Vídeo de demonstração: roteiro

**Duração-alvo:** 4 a 5 minutos. **Formato:** gravação de tela da versão publicada (`https://ebenezer-vert.vercel.app`), com narração. **Resolução:** navegador em 1440 px de largura (a largura do protótipo) e zoom de 100%.

**Antes de gravar**
1. Restaurar os dados de demonstração (limpeza + instalação, `docs/implantacao.md`). Assim o Eduardo aparece com 14 meses e a Renata com 12 doadores.
2. Deixar três abas prontas: (a) janela anônima com o link de convite; (b) sessão do Eduardo; (c) sessão da Renata. Usar navegadores ou perfis diferentes para as sessões não se misturarem.
3. E-mail fictício para o cadastro ao vivo: `ana.demo@exemplo.com.br`.
4. Fechar notificações do sistema e esconder favoritos do navegador.

---

| # | Tempo | Tela / ação | Narração (sugestão) |
|---|---|---|---|
| 1 | 0:00–0:25 | Slide ou `/conheca` parada no topo | "O Instituto Social Ebenézer acompanha crianças de 3 a 11 anos no Jardim Ângela, em São Paulo. O desafio: transformar o doador de uma vez em apoiador contínuo. O EbenézerConecta é o MVP que construímos para isso." |
| 2 | 0:25–0:55 | Aba anônima: abrir `…/r/renata-c?c=whatsapp`; mostrar o selo de convite, os indicadores, os programas e as atividades | "Tudo começa com um convite. A Renata, embaixadora, mandou este link pelo WhatsApp. A página abre sem login e mostra só dados agregados: nenhuma criança é identificada, e as imagens são ilustrativas." |
| 3 | 0:55–1:25 | Clicar em **Quero apoiar** → preencher o cadastro → marcar a Política de Privacidade → **Criar conta** | "Criar a conta leva menos de um minuto: nome, e-mail e senha. A comunicação por e-mail é opcional e o consentimento fica registrado." |
| 4 | 1:25–1:55 | Tela Doar: escolher **Semente do Impacto — R$ 50/mês** → Doação confirmada | "Na doação, a recorrência é o caminho natural, com três planos. A confirmação deixa claro: dá para alterar, pausar ou encerrar quando quiser, sem justificativa. O pagamento, nesta versão, é simulado." |
| 5 | 1:55–2:35 | Aba do Eduardo: Home → **Gerenciar recorrência**: subir para R$ 150; mostrar a pausa de 1 a 3 meses (sem confirmar) | "Este é o Eduardo, doador há 14 meses. Ele ajusta valor e frequência sozinho, e pode pausar por até três meses sem perder a sequência nem as conquistas." |
| 6 | 2:35–3:05 | **Atividades**: filtrar por Reforço Escolar; mostrar o balanço da semana e o boletim do mês | "A prestação de contas é contínua: registros diários, balanço semanal e boletim mensal, sempre por programa e sempre agregados." |
| 7 | 3:05–3:35 | **Jornada**: trilha de marcos, 14 de 24 meses → **Ver certificado** EC-2026-000148 → abrir `/verificar?n=EC-2026-000148` | "O reconhecimento é por continuidade, nunca por valor. Cada marco gera um certificado com registro que qualquer pessoa pode verificar, sem expor o nome do doador." |
| 8 | 3:35–4:15 | Aba da Renata: **Mobilizar** mostrando 13 doadores (o cadastro da cena 3 entrou), origem por canal com WhatsApp no topo → **Compartilhar** convite | "E o ciclo fecha aqui. A Renata vê que a rede dela ganhou mais um doador — o cadastro que acabamos de fazer — e de qual canal ele veio. Não há ranking entre embaixadores, e os valores de quem doou continuam privados." |
| 9 | 4:15–4:45 | Voltar a `/conheca` ou slide final com a arquitetura resumida | "Por trás: banco no Supabase com as regras de negócio e a privacidade garantidas no próprio banco, testadas automaticamente, e o app publicado na Vercel. Dados 100% sintéticos. O próximo passo é o teste com doadores reais do Instituto." |

**Pontos que precisam aparecer (checklist)**
- [ ] Entrada pública sem login e o link rastreável (pedido da validação com o João Pedro).
- [ ] Recorrência como padrão, com reversibilidade explícita.
- [ ] Ajuste e pausa sem falar com ninguém.
- [ ] Transparência agregada (indicadores e feed), sem identificar crianças.
- [ ] Marcos por continuidade e certificado verificável.
- [ ] A rede da embaixadora mudando em tempo real.
- [ ] Menção a dados sintéticos e pagamento simulado.

**Depois de gravar:** restaurar os dados de demonstração de novo, se o link for compartilhado com avaliadores.

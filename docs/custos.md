# Custos

Valores em dólares, sem impostos, conforme as páginas oficiais consultadas em 28/09/2026. A conversão para reais deve usar o câmbio do dia; os preços mudam, então **confira as fontes antes de qualquer decisão de contratação**.

## 1. Versão de demonstração (hoje): custo zero

| Serviço | Plano | Custo | Limites relevantes para o MVP |
|---|---|---|---|
| Supabase (banco, login, imagens) | Free | US$ 0 | 500 MB de banco; 1 GB de arquivos; 5 GB de tráfego; 50.000 usuários ativos/mês; **pausa após 1 semana sem atividade**; sem backup diário; até 2 projetos ativos |
| Vercel (app) | Hobby | US$ 0 | **Uso pessoal e não comercial apenas**; 100 GB de transferência; 1 milhão de requisições e de invocações de função/mês; logs de 1 hora; 100 deploys/dia |
| GitHub (código, CI, rotina "manter ativo") | Free | US$ 0 | Suficiente para o volume do projeto |
| E-mail transacional | — | US$ 0 | Não configurado: o SMTP nativo do Supabase só atende a demonstração |

**Folga do MVP em relação aos limites.** O banco de demonstração ocupa poucos megabytes e as seis fotos somam cerca de 1,8 MB. Os limites do plano gratuito comportam com folga os testes com usuários, a banca e um piloto pequeno. Os dois riscos reais são a **pausa por inatividade**, mitigada pela rotina `.github/workflows/manter-ativo.yml`, e a **ausência de backup automático**, mitigada pela exportação mensal descrita em `docs/operacao.md`.

## 2. Produção com o Instituto (estimativa)

A operação real muda duas premissas. Primeiro, o uso deixa de ser pessoal e acadêmico: a Vercel restringe o Hobby a uso não comercial, e uma plataforma de captação de uma organização deve ser tratada como uso institucional. Segundo, dados de doadores exigem backup e disponibilidade contínua.

| Item | Plano sugerido | Custo mensal | Por quê |
|---|---|---|---|
| Supabase | Pro | a partir de US$ 25 | Sem pausa; backup diário com 7 dias; 8 GB de disco; 250 GB de tráfego; 100.000 usuários ativos/mês; inclui US$ 10 de crédito de computação (instância Micro) |
| Vercel | Pro | US$ 20 (1 assento que publica; leitores gratuitos) | Uso institucional permitido; US$ 20 de crédito de uso incluído; logs de 1 dia |
| E-mail transacional | ex.: Resend Free | US$ 0 até 3.000 e-mails/mês (100/dia) | Confirmação de cadastro, recuperação de senha, boletim. Acima disso, plano pago |
| Domínio próprio | `.org.br` (Registro.br) | cerca de R$ 40 por ano | Credibilidade dos links de convite e dos e-mails. Confirmar preço e exigências da categoria no Registro.br |
| **Total** | | **cerca de US$ 45/mês + domínio** | Para o volume de um piloto (centenas de doadores) |

**O que não está no quadro.** O gateway de pagamento (Pix e cartão) cobra por transação, não por mês; a taxa depende do provedor e da negociação e deve ser avaliada na integração real, hoje simulada (ADR-04). Também não estão incluídas as horas de manutenção técnica.

**Alternativa de menor custo.** Se o Instituto obtiver da Vercel condição para organizações sem fins lucrativos, ou migrar o app para um hospedeiro que admita uso institucional gratuito, o custo cai para cerca de US$ 25/mês (apenas o Supabase Pro). A decisão depende de verificar essas condições junto aos fornecedores. Não assumimos que existam.

## 3. Quando revisar

- Ao passar de 1.000 doadores ativos ou 3.000 e-mails/mês.
- Se o banco passar de 60% do disco incluído (o painel do Supabase mostra o uso).
- Na integração com um gateway de pagamento real.

## Fontes

- Supabase — preços e limites dos planos: https://supabase.com/pricing
- Vercel — plano Hobby (limites e restrição a uso não comercial): https://vercel.com/docs/plans/hobby
- Vercel — plano Pro (taxa de plataforma, crédito e assentos): https://vercel.com/docs/plans/pro-plan
- Resend — plano gratuito: https://resend.com/pricing
- Registro.br — categorias e preço de registro: https://registro.br/dominio/categorias/

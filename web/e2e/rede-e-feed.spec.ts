import { test, expect, type Page } from '@playwright/test';

// Bloco 3: US-03 (feed de atividades), US-05 (embaixador e link rastreável) e a porta de entrada pública.
const SENHA = 'Ebenezer2026!';

async function entrar(page: Page, email: string, senha = SENHA) {
  await page.goto('/acesso');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(senha);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL('/');
}
const evidencia = (page: Page, nome: string) => page.screenshot({ path: `e2e/evidencias/${nome}.png`, fullPage: true });

test.describe('US-03 · feed de atividades', () => {
  test('Eduardo filtra o feed por cadência e por programa', async ({ page }) => {
    await entrar(page, 'eduardo@exemplo.com.br');
    await page.getByRole('link', { name: 'Atividades', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'O que aconteceu nos programas' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Atualizações diárias' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Balanço da semana' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Resumo do mês' })).toBeVisible();
    await evidencia(page, 'us03-1-feed');

    await page.getByRole('link', { name: 'Diárias' }).click();
    await expect(page).toHaveURL(/cadencia=diaria/);
    await expect(page.getByRole('heading', { name: 'Balanço da semana' })).toHaveCount(0);

    await page.getByRole('link', { name: 'Reforço Escolar' }).click();
    await expect(page).toHaveURL(/cadencia=diaria&programa=reforco/);
    const cartoes = page.locator('main article, article');
    await expect(cartoes.first()).toBeVisible();
    for (const c of await cartoes.all()) await expect(c).toContainText('Reforço Escolar');
    await evidencia(page, 'us03-2-filtro');
  });
});

test.describe('Porta de entrada pública', () => {
  test('a landing abre sem login e só mostra agregados', async ({ page }) => {
    await page.goto('/conheca');
    await expect(page.getByRole('heading', { name: /Se mudarmos o começo da história/ })).toBeVisible();
    await expect(page.getByText('crianças atendidas no último mês')).toBeVisible();
    await expect(page.getByText('Nenhum valor individual é exibido.')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Eduardo');
    await expect(page.locator('body')).not.toContainText('Renata');
    await evidencia(page, 'publico-1-conheca');
  });
});

test.describe('US-05 · embaixador mobiliza a própria rede', () => {
  test('visitante chega pelo link da Renata, cria conta, doa e aparece na rede dela', async ({ browser }) => {
    const visitante = await (await browser.newContext()).newPage();
    await visitante.goto('/r/renata-c?c=whatsapp');
    await expect(visitante).toHaveURL(/\/conheca\?convite=1/);
    await expect(visitante.getByText(/convite de alguém que já apoia/)).toBeVisible();

    await visitante.getByRole('link', { name: 'Quero apoiar' }).first().click();
    await expect(visitante.getByRole('heading', { name: 'Criar sua conta' })).toBeVisible();
    await visitante.getByLabel('Como quer ser chamado').fill('Lúcia Prado');
    await visitante.getByLabel('E-mail', { exact: true }).fill('lucia@exemplo.com.br');
    await visitante.getByLabel('Senha').fill('Convite2026!');
    await visitante.getByLabel(/Li a Política de Privacidade/).check();
    await evidencia(visitante, 'us05-1-cadastro');
    await visitante.getByRole('button', { name: /Criar conta/ }).click();

    await expect(visitante).toHaveURL(/\/doar\?bemvindo=1/);
    await expect(visitante.getByText(/Boas-vindas, Lúcia/)).toBeVisible();
    await visitante.getByPlaceholder('R$ 0,00').fill('80');
    await visitante.getByRole('button', { name: 'Doar valor único' }).click();
    await expect(visitante.getByRole('heading', { name: 'Doação confirmada' })).toBeVisible();

    const renata = await (await browser.newContext()).newPage();
    await entrar(renata, 'renata@exemplo.com.br');
    await renata.goto('/mobilizar');
    await expect(renata.getByText('doadores mobilizados', { exact: true }).locator('..')).toContainText('13');   // semente: 12
    await expect(renata.getByText('WhatsApp', { exact: true }).locator('..')).toContainText('7');
    await evidencia(renata, 'us05-2-rede-renata');
  });

  test('Eduardo ativa o próprio link e compartilha o convite', async ({ page }) => {
    await page.context().route(/^https:\/\/wa\.me\//, (r) => r.fulfill({ body: 'ok', contentType: 'text/plain' }));
    await entrar(page, 'eduardo@exemplo.com.br');
    await page.goto('/mobilizar');
    await page.getByRole('button', { name: 'Ativar meu link' }).click();
    await expect(page.getByText('localhost:3000/r/eduardo-m')).toBeVisible();
    await evidencia(page, 'us05-3-link-ativado');

    await page.getByRole('link', { name: 'Compartilhar', exact: true }).click();
    await expect(page.getByLabel('Mensagem que será publicada')).toHaveValue(/\/r\/eduardo-m/);
    await expect(page.getByLabel('Mensagem que será publicada')).not.toHaveValue(/R\$/);
    const [aba] = await Promise.all([page.waitForEvent('popup'), page.getByRole('button', { name: /WhatsApp/ }).click()]);
    expect(decodeURIComponent(aba.url())).toContain('/r/eduardo-m?c=whatsapp');
    await expect(page.getByRole('status')).toContainText('WhatsApp');
    await evidencia(page, 'us05-4-compartilhar');

    await page.goto('/mobilizar');
    await expect(page.getByText('Voz da Causa').locator('../..')).toContainText('Conquistado');
  });
});

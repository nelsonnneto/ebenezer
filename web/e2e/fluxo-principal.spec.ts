import { test, expect, type Page } from '@playwright/test';

const SENHA = 'Ebenezer2026!';

async function entrar(page: Page, email: string) {
  await page.goto('/acesso');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(SENHA);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL('/');
}

async function evidencia(page: Page, nome: string) {
  await page.screenshot({ path: `e2e/evidencias/${nome}.png`, fullPage: true });
}

test.describe('Acesso', () => {
  test('sem sessão, qualquer tela leva ao login', async ({ page }) => {
    await page.goto('/jornada');
    await expect(page).toHaveURL(/\/acesso\?volta=%2Fjornada/);
    await expect(page.getByRole('heading', { name: 'Entrar na sua conta' })).toBeVisible();
  });

  test('senha errada mostra mensagem e não entra', async ({ page }) => {
    await page.goto('/acesso');
    await page.getByLabel('E-mail').fill('eduardo@exemplo.com.br');
    await page.getByLabel('Senha').fill('errada');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText(/E-mail ou senha não conferem/)).toBeVisible();
    await expect(page).toHaveURL(/\/acesso/);
  });

  test('recuperação de senha responde de forma neutra', async ({ page }) => {
    await page.goto('/recuperar-senha');
    await page.getByLabel('E-mail').fill('qualquer@exemplo.com.br');
    await page.getByRole('button', { name: /Enviar link/ }).click();
    await expect(page.getByRole('heading', { name: 'Verifique seu e-mail' })).toBeVisible();
  });

  test('cadastro recusado mantém o que foi digitado e aponta todos os erros (achado A01)', async ({ page }) => {
    await page.goto('/cadastro');
    await page.getByLabel('Como quer ser chamado').fill('Marta Lins');
    await page.getByLabel('E-mail', { exact: true }).fill('marta@exemplo');
    await page.getByLabel(/^Senha/).fill('curta');
    await page.getByLabel(/Quero receber o boletim/).check();
    await page.getByRole('button', { name: /Criar conta/ }).click();

    await expect(page.getByText('Revise os campos indicados. O que você já digitou foi mantido.')).toBeVisible();
    await expect(page.getByText('Informe um e-mail válido.')).toBeVisible();
    await expect(page.getByText('A senha precisa ter pelo menos 8 caracteres.')).toBeVisible();
    await expect(page.getByText('Para criar a conta, confirme que leu a Política de Privacidade.')).toBeVisible();
    await expect(page.locator('input[name="nome"]')).toHaveValue('Marta Lins');
    await expect(page.locator('input[name="email"]')).toHaveValue('marta@exemplo');
    await expect(page.locator('input[name="comunicacao"]')).toBeChecked();
    await expect(page.locator('input[name="email"]')).toHaveAttribute('aria-invalid', 'true');
    await evidencia(page, 'a01-cadastro-recusado');

    await page.locator('input[name="email"]').fill('marta@exemplo.com.br');
    await page.locator('input[name="senha"]').fill('Cadastro2026!');
    await page.locator('input[name="privacidade"]').check();
    await page.getByRole('button', { name: /Criar conta/ }).click();
    await expect(page).toHaveURL(/\/doar\?bemvindo=1/);
  });
});

test.describe('US-01 · doador pontual passa a recorrente', () => {
  test('Rafael escolhe um plano e vê a confirmação com reversibilidade explícita', async ({ page }) => {
    await entrar(page, 'rafael@exemplo.com.br');
    await expect(page.getByRole('link', { name: 'Tornar meu apoio contínuo' })).toBeVisible();
    await evidencia(page, 'us01-1-home-sem-recorrencia');

    await page.getByRole('link', { name: 'Doar agora' }).click();
    await expect(page.getByRole('heading', { name: /Escolha como sua doação/ })).toBeVisible();
    await evidencia(page, 'us01-2-planos');

    await page.getByRole('button', { name: 'Doar R$ 50 / mês' }).click();
    await expect(page).toHaveURL(/\/doar\/confirmada\?tipo=recorrente/);
    await expect(page.getByRole('heading', { name: 'Doação confirmada' })).toBeVisible();
    await expect(page.getByText('Semente do Impacto')).toBeVisible();
    await expect(page.getByText('R$ 50,00 / mês')).toBeVisible();
    await expect(page.getByText(/sem justificativa/)).toBeVisible();
    await evidencia(page, 'us01-3-confirmacao');

    await page.goto('/');
    await expect(page.getByText('Recorrência ativa')).toBeVisible();
    await expect(page.getByText('Mensal · R$ 50,00')).toBeVisible();
  });

  test('doação única com valor livre', async ({ page }) => {
    await entrar(page, 'rafael@exemplo.com.br');
    await page.goto('/doar');
    await page.getByPlaceholder('R$ 0,00').fill('150');
    await page.getByRole('button', { name: 'Doar valor único' }).click();
    await expect(page.getByRole('heading', { name: 'Doação confirmada' })).toBeVisible();
    await expect(page.getByText('R$ 150,00').first()).toBeVisible();
  });
});

test.describe('US-02 · doador recorrente ajusta sem falar com ninguém', () => {
  test('Eduardo aumenta o valor, muda para semanal, pausa e retoma', async ({ page }) => {
    await entrar(page, 'eduardo@exemplo.com.br');
    await page.goto('/recorrencia');
    await expect(page.locator('output')).toHaveText('R$ 120');
    await expect(page.getByRole('button', { name: 'Confirmar alteração' })).toBeDisabled();

    await page.getByRole('button', { name: 'Aumentar valor' }).click();
    await page.getByRole('button', { name: 'Aumentar valor' }).click();
    await expect(page.locator('output')).toHaveText('R$ 200');
    await page.getByRole('radio', { name: 'Semanal' }).click();
    await expect(page.getByText('52 cobranças por ano')).toBeVisible();
    await evidencia(page, 'us02-1-ajuste');

    await page.getByRole('button', { name: 'Confirmar alteração' }).click();
    await expect(page.getByText('Alteração registrada.', { exact: false })).toBeVisible();
    await expect(page.getByText(/R\$ 120,00 → R\$ 200,00 · mensal → semanal/)).toBeVisible();

    await page.getByRole('button', { name: '1 mês' }).click();
    await expect(page.getByRole('heading', { name: 'Sua contribuição está pausada' })).toBeVisible();
    await expect(page.getByText(/Retoma automaticamente em/)).toBeVisible();
    await evidencia(page, 'us02-2-pausada');

    await page.goto('/');
    await expect(page.getByText('Recorrência pausada')).toBeVisible();
    await expect(page.getByText('14', { exact: true }).first()).toBeVisible(); // pausa não zera a sequência

    await page.goto('/recorrencia');
    await page.getByRole('button', { name: 'Retomar agora' }).click();
    await expect(page.getByText('Contribuição retomada.', { exact: false })).toBeVisible();
  });
});

test.describe('US-04 · jornada e certificado', () => {
  test('Eduardo vê a trajetória e o certificado com registro verificável', async ({ page }) => {
    await entrar(page, 'eduardo@exemplo.com.br');
    await page.goto('/jornada');
    await expect(page.getByRole('heading', { name: 'Sua trajetória de apoio, mês a mês.' })).toBeVisible();
    await expect(page.getByText('Guardião da Comunidade').first()).toBeVisible();
    await expect(page.getByText('14 de 24 meses · faltam 10')).toBeVisible();
    await evidencia(page, 'us04-1-jornada');

    await page.getByRole('link', { name: 'Ver certificado' }).click();
    await expect(page.locator('#certificado')).toContainText('Eduardo Mendes');
    await expect(page.locator('#certificado')).toContainText('EC-2026-000148');
    await expect(page.locator('#certificado')).not.toContainText('R$');
    await evidencia(page, 'us04-2-certificado');
  });

  test('verificação pública confirma o registro sem expor o titular', async ({ page }) => {
    await page.goto('/verificar?n=EC-2026-000148');
    await expect(page.getByText('Certificado válido')).toBeVisible();
    await expect(page.getByText('Guardião da Comunidade')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Eduardo');
  });
});

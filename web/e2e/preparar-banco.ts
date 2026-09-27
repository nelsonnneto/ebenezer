import { execSync } from 'node:child_process';
import path from 'node:path';

/** Recria o banco de testes do zero antes da suíte: cada execução parte do mesmo seed sintético. */
export default function prepararBanco() {
  if (process.env.PULAR_RESET) return;
  const raiz = path.resolve(__dirname, '../..');
  execSync(`${raiz}/scripts/db-local.sh ${process.env.PGHOST ?? 'localhost'} ${process.env.PGPORT ?? '5433'}`, { stdio: 'ignore' });
}

import type { Metadata } from 'next';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/ibm-plex-serif/400.css';
import '@fontsource/ibm-plex-serif/400-italic.css';
import '@fontsource/ibm-plex-serif/600.css';
import '@fontsource/ibm-plex-serif/700.css';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Ebenézer Conecta', template: '%s · Ebenézer Conecta' },
  description: 'Acompanhe o impacto dos programas do Instituto Social Ebenézer, sua jornada de apoio e seus certificados.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}

import './globals.css';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Sistema de Triagem Clínica — Protocolo de Manchester',
  description:
    'Sistema integrado de triagem clínica baseado no Protocolo de Manchester para classificação de risco e gerenciamento da fila de atendimento hospitalar.',
  keywords: 'triagem, manchester, saúde, hospital, urgência, emergência',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}

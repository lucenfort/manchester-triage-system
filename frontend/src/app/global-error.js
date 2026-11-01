'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="page-container">
          <div className="alert alert-error" role="alert" style={{ marginTop: '1rem' }}>
            <strong>Erro global da aplicação.</strong>
            <p style={{ margin: '0.5rem 0 0' }}>{error.message}</p>
            <button className="btn btn-secondary" onClick={reset} style={{ marginTop: '1rem' }}>
              Recarregar aplicação
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

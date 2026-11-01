'use client';

export default function Error({ error, reset }) {
  return (
    <div className="page-container">
      <div className="alert alert-error" role="alert" style={{ marginTop: '1rem' }}>
        <strong>Erro ao carregar a página.</strong>
        <p style={{ margin: '0.5rem 0 0' }}>{error.message}</p>
        <button className="btn btn-secondary" onClick={reset} style={{ marginTop: '1rem' }}>
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

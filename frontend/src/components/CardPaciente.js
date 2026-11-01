'use client';

/**
 * Componente CardPaciente — Card individual na fila de espera.
 *
 * Exibe informações do paciente, classificação Manchester,
 * tempo de espera normalizado em UTC e alerta de SLA excedido.
 */

const CLASSIFICACAO_INFO = {
  vermelho: { label: 'Emergência', emoji: '🔴', tempo: 'Imediato' },
  laranja: { label: 'Muito Urgente', emoji: '🟠', tempo: '10 min' },
  amarelo: { label: 'Urgente', emoji: '🟡', tempo: '60 min' },
  verde: { label: 'Pouco Urgente', emoji: '🟢', tempo: '120 min' },
  azul: { label: 'Não Urgente', emoji: '🔵', tempo: '240 min' },
};

const LIMITES_SLA = {
  vermelho: 0,
  laranja: 10,
  amarelo: 60,
  verde: 120,
  azul: 240,
};

/**
 * Normaliza uma string de data ISO vinda do banco (SQLite/PostgreSQL) para UTC,
 * evitando deslocamentos de fuso horário local.
 */
export function parseUTCDate(createdAt) {
  if (!createdAt) return new Date();
  if (createdAt instanceof Date) return createdAt;
  const str = String(createdAt).trim();
  const hasTimezone = /Z$|[+-]\d{2}:?\d{2}$/.test(str);
  return new Date(str.includes('T') && !hasTimezone ? `${str}Z` : str);
}

function formatarTempoEspera(diffMin) {
  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `${diffMin} min`;
  const horas = Math.floor(diffMin / 60);
  const minutos = diffMin % 60;
  return `${horas}h ${minutos}min`;
}

export default function CardPaciente({ triagem, onChamar }) {
  const info = CLASSIFICACAO_INFO[triagem.classificacao] || CLASSIFICACAO_INFO.azul;
  const agora = new Date();
  const criacao = parseUTCDate(triagem.created_at);
  const diffMin = Math.max(0, Math.floor((agora - criacao) / 60000));
  const tempoEspera = formatarTempoEspera(diffMin);

  const limite = LIMITES_SLA[triagem.classificacao] ?? 240;
  const slaExcedido = diffMin > limite;

  return (
    <div className={`paciente-card ${slaExcedido ? 'sla-exceeded' : ''}`} id={`paciente-card-${triagem.id}`}>
      <div className={`paciente-card-color ${triagem.classificacao}`}></div>

      <div className="paciente-card-body">
        <div className="paciente-card-info">
          <h3>{triagem.paciente.nome}</h3>
          <p>{triagem.queixa_principal}</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
            <span className={`paciente-card-badge ${triagem.classificacao}`}>
              {info.emoji} {info.label}
            </span>
            {slaExcedido && (
              <span className="sla-badge" id={`sla-badge-${triagem.id}`}>
                ⚠️ SLA Excedido
              </span>
            )}
          </div>
        </div>

        <div className="paciente-card-meta">
          <div className="paciente-card-timer">
            <div className="timer-value" style={slaExcedido ? { color: 'var(--manchester-vermelho)' } : {}}>
              {tempoEspera}
            </div>
            <div className="timer-label">Tempo de espera</div>
          </div>

          <button
            className="btn-chamar"
            onClick={() => onChamar(triagem.id)}
            id={`btn-chamar-${triagem.id}`}
          >
            Chamar
          </button>
        </div>
      </div>
    </div>
  );
}

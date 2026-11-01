'use client';

/**
 * Componente FilaPacientes — Lista da fila de espera com filtros por cor.
 */

import { useState } from 'react';
import CardPaciente from './CardPaciente';

const FILTROS = [
  { key: 'todos', label: 'Todos' },
  { key: 'vermelho', label: 'Vermelho' },
  { key: 'laranja', label: 'Laranja' },
  { key: 'amarelo', label: 'Amarelo' },
  { key: 'verde', label: 'Verde' },
  { key: 'azul', label: 'Azul' },
];

export default function FilaPacientes({ triagens, onChamar }) {
  const [filtro, setFiltro] = useState('todos');

  const triagensFiltradas =
    filtro === 'todos' ? triagens : triagens.filter((t) => t.classificacao === filtro);

  return (
    <div>
      <div className="fila-header">
        <div className="fila-filters">
          {FILTROS.map((f) => (
            <button
              key={f.key}
              className={`filter-btn ${f.key} ${filtro === f.key ? 'active' : ''}`}
              onClick={() => setFiltro(f.key)}
              id={`filtro-${f.key}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="refresh-indicator">
          <div className="refresh-dot"></div>
          <span>Atualização automática</span>
        </div>
      </div>

      <div className="fila-list">
        {triagensFiltradas.length === 0 ? (
          <div className="fila-empty" id="fila-vazia">
            <p>
              {filtro === 'todos'
                ? 'Nenhum paciente aguardando atendimento.'
                : `Nenhum paciente com classificação ${filtro}.`}
            </p>
          </div>
        ) : (
          triagensFiltradas.map((triagem) => (
            <CardPaciente key={triagem.id} triagem={triagem} onChamar={onChamar} />
          ))
        )}
      </div>
    </div>
  );
}

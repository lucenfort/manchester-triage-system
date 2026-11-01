'use client';

/**
 * Página Dashboard — Visão geral operacional e estatística do sistema.
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { obterEstatisticas } from '../services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const carregandoRef = useRef(false);

  useEffect(() => {
    carregarEstatisticas();
    const interval = setInterval(carregarEstatisticas, 15000);
    return () => clearInterval(interval);
  }, []);

  async function carregarEstatisticas() {
    if (carregandoRef.current) return;

    carregandoRef.current = true;
    try {
      const data = await obterEstatisticas();
      setStats(data);
    } catch (err) {
      setStats({
        total_aguardando: 0,
        vermelho: 0,
        laranja: 0,
        amarelo: 0,
        verde: 0,
        azul: 0,
        total_pacientes: 0,
        total_atendidos: 0,
      });
    } finally {
      carregandoRef.current = false;
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  const colors = [
    { key: 'vermelho', color: 'var(--manchester-vermelho, #E53935)', label: 'Emergência' },
    { key: 'laranja', color: 'var(--manchester-laranja, #FB8C00)', label: 'Muito Urgente' },
    { key: 'amarelo', color: 'var(--manchester-amarelo, #FDD835)', label: 'Urgente' },
    { key: 'verde', color: 'var(--manchester-verde, #43A047)', label: 'Pouco Urgente' },
    { key: 'azul', color: 'var(--manchester-azul, #1E88E5)', label: 'Não Urgente' },
  ];

  const totalWait =
    (stats?.vermelho || 0) +
    (stats?.laranja || 0) +
    (stats?.amarelo || 0) +
    (stats?.verde || 0) +
    (stats?.azul || 0);
  const R = 70;
  const C = 2 * Math.PI * R;

  let accumulatedOffset = 0;

  const segments = colors.map((col) => {
    const count = stats?.[col.key] || 0;
    const percentage = totalWait > 0 ? (count / totalWait) * 100 : 0;
    const strokeLength = totalWait > 0 ? (count / totalWait) * C : 0;
    const offset = accumulatedOffset;
    accumulatedOffset += strokeLength;

    return {
      ...col,
      count,
      percentage,
      strokeLength,
      offset,
    };
  });

  return (
    <div className="page-container" id="dashboard-page">
      <div className="page-header">
        <h1>Painel de Controle</h1>
        <p>Visão geral do sistema de triagem clínica — Protocolo de Manchester</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card" id="stat-total">
          <div className="stat-icon total">📊</div>
          <div className="stat-info">
            <h3>{stats.total_aguardando}</h3>
            <p>Aguardando</p>
          </div>
        </div>

        <div className="stat-card" id="stat-vermelho">
          <div className="stat-icon vermelho">🔴</div>
          <div className="stat-info">
            <h3 style={{ color: 'var(--manchester-vermelho)' }}>{stats.vermelho}</h3>
            <p>Emergência</p>
          </div>
        </div>

        <div className="stat-card" id="stat-laranja">
          <div className="stat-icon laranja">🟠</div>
          <div className="stat-info">
            <h3 style={{ color: 'var(--manchester-laranja)' }}>{stats.laranja}</h3>
            <p>Muito Urgente</p>
          </div>
        </div>

        <div className="stat-card" id="stat-amarelo">
          <div className="stat-icon amarelo">🟡</div>
          <div className="stat-info">
            <h3 style={{ color: 'var(--manchester-amarelo)' }}>{stats.amarelo}</h3>
            <p>Urgente</p>
          </div>
        </div>

        <div className="stat-card" id="stat-verde">
          <div className="stat-icon verde">🟢</div>
          <div className="stat-info">
            <h3 style={{ color: 'var(--manchester-verde)' }}>{stats.verde}</h3>
            <p>Pouco Urgente</p>
          </div>
        </div>

        <div className="stat-card" id="stat-azul">
          <div className="stat-icon azul">🔵</div>
          <div className="stat-info">
            <h3 style={{ color: 'var(--manchester-azul)' }}>{stats.azul}</h3>
            <p>Não Urgente</p>
          </div>
        </div>
      </div>

      <div className="dashboard-chart-section" id="dashboard-chart-section">
        <div className="chart-card">
          <h2>📊 Distribuição da Fila de Espera</h2>
          <p className="chart-subtitle">Proporção de pacientes aguardando por classificação de risco</p>
          <div className="chart-content">
            <div className="donut-chart-wrapper">
              <svg width="220" height="220" viewBox="0 0 200 200" className="donut-chart-svg">
                {totalWait === 0 ? (
                  <circle
                    cx="100"
                    cy="100"
                    r={R}
                    fill="transparent"
                    stroke="var(--border-subtle, #e0e0e0)"
                    strokeWidth="18"
                  />
                ) : (
                  <g transform="rotate(-90 100 100)">
                    {segments.map(
                      (seg) =>
                        seg.count > 0 && (
                          <circle
                            key={seg.key}
                            cx="100"
                            cy="100"
                            r={R}
                            fill="transparent"
                            stroke={seg.color}
                            strokeWidth="18"
                            strokeDasharray={`${seg.strokeLength} ${C}`}
                            strokeDashoffset={-seg.offset}
                            className={`donut-segment seg-${seg.key}`}
                          />
                        )
                    )}
                  </g>
                )}
                <text x="100" y="98" textAnchor="middle" className="donut-center-value">
                  {totalWait}
                </text>
                <text x="100" y="118" textAnchor="middle" className="donut-center-label">
                  Aguardando
                </text>
              </svg>
            </div>

            <div className="chart-legend-wrapper">
              {segments.map((seg) => {
                const hasPatients = seg.count > 0;
                return (
                  <div key={seg.key} className={`legend-item ${hasPatients ? 'active' : 'inactive'}`}>
                    <span className="legend-indicator" style={{ backgroundColor: seg.color }}></span>
                    <span className="legend-name">{seg.label}</span>
                    <span className="legend-count">
                      {seg.count} {seg.count === 1 ? 'paciente' : 'pacientes'}
                    </span>
                    {totalWait > 0 && (
                      <span className="legend-percentage">({seg.percentage.toFixed(0)}%)</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <Link href="/triagem" className="dashboard-card" id="card-triagem">
          <h2>🩺 Nova Triagem</h2>
          <p>
            Cadastrar paciente e realizar a classificação de risco pelo
            Protocolo de Manchester. Acesso exclusivo do enfermeiro triador.
          </p>
        </Link>

        <Link href="/painel" className="dashboard-card" id="card-painel">
          <h2>📋 Painel da Recepção</h2>
          <p>
            Visualizar a fila de espera ordenada por prioridade.
            Atualização automática a cada 10 segundos.
          </p>
        </Link>
      </div>

      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Total de pacientes cadastrados: <strong>{stats.total_pacientes}</strong>
          {' · '}
          Em atendimento: <strong>{stats.total_atendidos}</strong>
        </p>
      </div>
    </div>
  );
}

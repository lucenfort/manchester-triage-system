'use client';

/**
 * Página Painel da Recepção — Fila de espera por prioridade.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { listarFila, atenderPaciente, limparFila } from '../../services/api';
import FilaPacientes from '../../components/FilaPacientes';
import SeedDataButton from '../../components/SeedDataButton';

export default function PainelPage() {
  const [triagens, setTriagens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState(null);
  const carregandoRef = useRef(false);
  const [processando, setProcessando] = useState(new Set());

  const carregarFila = useCallback(async () => {
    if (carregandoRef.current) return;

    carregandoRef.current = true;
    try {
      const data = await listarFila();
      setTriagens(data);
    } catch (err) {
      console.error('Erro ao carregar fila:', err);
      setMensagem({
        tipo: 'error',
        texto: `Erro ao carregar a fila: ${err.message}`,
      });
    } finally {
      carregandoRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarFila();
    const interval = setInterval(carregarFila, 10000);
    return () => clearInterval(interval);
  }, [carregarFila]);

  async function handleChamar(triagemId) {
    if (processando.has(triagemId)) return;

    setProcessando((prev) => new Set(prev).add(triagemId));
    try {
      await atenderPaciente(triagemId);
      setMensagem({ tipo: 'success', texto: 'Paciente chamado para atendimento!' });
      await carregarFila();
      setTimeout(() => setMensagem(null), 3000);
    } catch (err) {
      if (err.message && err.message.includes('Paciente não está aguardando')) {
        setMensagem({ tipo: 'warning', texto: 'Paciente já foi chamado ou não está mais na fila.' });
        await carregarFila();
      } else {
        setMensagem({ tipo: 'error', texto: err.message });
      }
      setTimeout(() => setMensagem(null), 4000);
    } finally {
      setProcessando((prev) => {
        const novo = new Set(prev);
        novo.delete(triagemId);
        return novo;
      });
    }
  }

  async function handleLimparFila() {
    if (!window.confirm('Tem certeza que deseja limpar toda a fila de pacientes? Esta ação não pode ser desfeita.')) {
      return;
    }

    setLoading(true);
    try {
      await limparFila();
      setMensagem({ tipo: 'success', texto: 'Fila limpa com sucesso!' });
      await carregarFila();
      setTimeout(() => setMensagem(null), 3000);
    } catch (err) {
      setMensagem({ tipo: 'error', texto: `Erro ao limpar fila: ${err.message}` });
      setTimeout(() => setMensagem(null), 4000);
    } finally {
      setLoading(false);
    }
  }

  if (loading && triagens.length === 0) {
    return (
      <div className="page-container">
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" id="painel-page">
      <div className="page-header">
        <h1>Painel da Recepção</h1>
        <p>Fila de espera ordenada por prioridade — Protocolo de Manchester</p>
      </div>

      {mensagem && (
        <div className={`alert alert-${mensagem.tipo}`} id="painel-mensagem">
          <span>{mensagem.texto}</span>
        </div>
      )}

      <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          <strong>{triagens.length}</strong> paciente{triagens.length !== 1 ? 's' : ''} aguardando atendimento
        </p>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <SeedDataButton quantidade={30} onSuccess={carregarFila} />

          <button
            onClick={handleLimparFila}
            className="btn btn-danger"
            title="Remove todos os pacientes da fila"
            id="btn-limpar-fila"
          >
            Limpar Fila
          </button>
        </div>
      </div>

      <FilaPacientes triagens={triagens} onChamar={handleChamar} />
    </div>
  );
}

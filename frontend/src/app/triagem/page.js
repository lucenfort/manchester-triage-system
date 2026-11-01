'use client';

/**
 * Página de Triagem — Tela do Enfermeiro Triador.
 */

import { useState } from 'react';
import { cadastrarPaciente, registrarTriagem } from '../../services/api';
import FormTriagem from '../../components/FormTriagem';

export default function TriagemPage() {
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [ultimaTriagem, setUltimaTriagem] = useState(null);

  async function handleSubmit(dados) {
    setCarregando(true);
    setMensagem(null);

    try {
      let paciente;
      try {
        paciente = await cadastrarPaciente({
          nome: dados.nome,
          cpf: dados.cpf,
          data_nascimento: dados.data_nascimento,
        });
      } catch (err) {
        if (err.message.includes('CPF já cadastrado')) {
          const { listarPacientes } = await import('../../services/api');
          const pacientes = await listarPacientes();
          paciente = pacientes.find(
            (p) => p.cpf.replace(/\D/g, '') === dados.cpf.replace(/\D/g, '')
          );
          if (!paciente) throw new Error('Erro ao localizar paciente existente.');

          if (dados.nome.trim().toLowerCase() !== paciente.nome.trim().toLowerCase()) {
            throw new Error('CPF já cadastrado para outro paciente.');
          }
        } else {
          throw err;
        }
      }

      const triagem = await registrarTriagem({
        paciente_id: paciente.id,
        queixa_principal: dados.queixa_principal,
        dor_escala: dados.dor_escala,
        temperatura: parseFloat(dados.temperatura),
        pressao_sistolica: parseInt(dados.pressao_sistolica, 10),
        pressao_diastolica: parseInt(dados.pressao_diastolica, 10),
        freq_cardiaca: parseInt(dados.freq_cardiaca, 10),
        freq_respiratoria: parseInt(dados.freq_respiratoria, 10),
        nivel_consciencia: dados.nivel_consciencia,
        sangramento: dados.sangramento,
        convulsao: dados.convulsao,
        observacoes: dados.observacoes || '',
      });

      setUltimaTriagem(triagem);
      setMensagem({
        tipo: 'success',
        texto: `Triagem registrada com sucesso! Classificação: ${triagem.classificacao.toUpperCase()} — Paciente adicionado à fila.`,
      });
    } catch (err) {
      setMensagem({
        tipo: 'error',
        texto: `Erro ao registrar triagem: ${err.message}`,
      });
    } finally {
      setCarregando(false);
    }
  }

  const CORES_INFO = {
    vermelho: { label: 'EMERGÊNCIA', tempo: 'Imediato' },
    laranja: { label: 'MUITO URGENTE', tempo: '10 min' },
    amarelo: { label: 'URGENTE', tempo: '60 min' },
    verde: { label: 'POUCO URGENTE', tempo: '120 min' },
    azul: { label: 'NÃO URGENTE', tempo: '240 min' },
  };

  return (
    <div className="page-container" id="triagem-page">
      <div className="page-header">
        <h1>Triagem Clínica</h1>
        <p>Preencha os dados clínicos para classificação pelo Protocolo de Manchester</p>
      </div>

      {mensagem && (
        <div className={`alert alert-${mensagem.tipo}`} id="triagem-mensagem">
          <span>{mensagem.texto}</span>
        </div>
      )}

      {ultimaTriagem && (
        <div
          className={`classification-preview ${ultimaTriagem.classificacao}`}
          style={{ marginBottom: '1.5rem' }}
          id="resultado-triagem"
        >
          <h3 className={`classification-color ${ultimaTriagem.classificacao}`}>
            {CORES_INFO[ultimaTriagem.classificacao]?.label}
          </h3>
          <p>
            Paciente: <strong>{ultimaTriagem.paciente.nome}</strong>
            {' · '}Tempo máximo: {CORES_INFO[ultimaTriagem.classificacao]?.tempo}
          </p>
        </div>
      )}

      <FormTriagem onSubmit={handleSubmit} carregando={carregando} />
    </div>
  );
}

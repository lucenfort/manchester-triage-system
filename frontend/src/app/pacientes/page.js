'use client';

/**
 * Página de Consulta de Pacientes — Listagem, busca rápida e gerenciamento.
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { listarPacientes, excluirPaciente } from '../../services/api';
import { parseUTCDate } from '../../components/CardPaciente';

function formatarCPF(cpf) {
  if (!cpf) return '';
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return cpf;
  return `${clean.substring(0, 3)}.${clean.substring(3, 6)}.${clean.substring(6, 9)}-${clean.substring(9)}`;
}

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [erro, setErro] = useState(null);
  const carregandoRef = useRef(false);

  useEffect(() => {
    carregarPacientes();
  }, []);

  async function carregarPacientes() {
    if (carregandoRef.current) return;
    carregandoRef.current = true;
    setLoading(true);
    setErro(null);

    try {
      const data = await listarPacientes();
      setPacientes(data);
    } catch (err) {
      console.error('Erro ao carregar pacientes:', err);
      setErro('Não foi possível carregar a lista de pacientes.');
    } finally {
      carregandoRef.current = false;
      setLoading(false);
    }
  }

  async function handleExcluir(id, nome) {
    if (!window.confirm(`Tem certeza que deseja inativar o cadastro de ${nome}?`)) {
      return;
    }
    try {
      await excluirPaciente(id);
      await carregarPacientes();
    } catch (err) {
      console.error('Erro ao excluir paciente:', err);
      setErro('Erro ao excluir o paciente. Tente novamente.');
    }
  }

  const pacientesFiltrados = pacientes.filter((p) => {
    const termoBusca = busca.toLowerCase().trim();
    if (!termoBusca) return true;

    const cpfBusca = termoBusca.replace(/\D/g, '');
    const cpfLimpo = p.cpf.replace(/\D/g, '');
    const nomeLimpo = p.nome.toLowerCase();

    if (cpfBusca) {
      return cpfLimpo.includes(cpfBusca);
    }
    return nomeLimpo.includes(termoBusca);
  });

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" id="pacientes-page">
      <div className="page-header">
        <h1>Consulta de Pacientes</h1>
        <p>Listagem, busca rápida e gerenciamento de pacientes cadastrados no sistema</p>
      </div>

      {erro && (
        <div className="alert alert-error" id="pacientes-erro">
          <span>{erro}</span>
        </div>
      )}

      <div className="search-bar-container">
        <input
          type="text"
          className="form-input search-input"
          placeholder="Buscar por nome ou CPF..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          id="busca-paciente"
        />
        <Link href="/triagem" className="btn btn-primary" id="btn-novo-cadastro">
          Novo Cadastro
        </Link>
      </div>

      <div className="glass-card table-responsive" style={{ padding: 0, overflow: 'hidden' }}>
        {pacientesFiltrados.length === 0 ? (
          <div className="fila-empty" id="pacientes-vazio">
            <p>Nenhum paciente cadastrado {busca ? 'encontrado para a busca' : 'no sistema ainda'}.</p>
          </div>
        ) : (
          <table className="patients-table" id="tabela-pacientes">
            <thead>
              <tr>
                <th>Nome Completo</th>
                <th>CPF</th>
                <th>Data de Nascimento</th>
                <th>Data de Cadastro</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pacientesFiltrados.map((paciente) => (
                <tr key={paciente.id} className="patient-row" id={`paciente-row-${paciente.id}`}>
                  <td>
                    <strong>{paciente.nome}</strong>
                  </td>
                  <td>{formatarCPF(paciente.cpf)}</td>
                  <td>{paciente.data_nascimento}</td>
                  <td>{parseUTCDate(paciente.created_at).toLocaleDateString('pt-BR')}</td>
                  <td style={{ textAlign: 'center', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <Link
                      href={`/triagem?cpf=${paciente.cpf}`}
                      className="btn btn-outline"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      id={`btn-triar-${paciente.id}`}
                    >
                      Triar
                    </Link>
                    <button
                      onClick={() => handleExcluir(paciente.id, paciente.nome)}
                      className="btn btn-danger"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      id={`btn-excluir-${paciente.id}`}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

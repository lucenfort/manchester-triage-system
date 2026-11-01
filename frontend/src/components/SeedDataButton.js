'use client';

import { useState } from 'react';
import { cadastrarPaciente, registrarTriagem, seedTriagens } from '../services/api';

function gerarNome(i) {
  const nomes = ['Ana', 'Bruno', 'Carla', 'Daniel', 'Eva', 'Felipe', 'Gabriela', 'Hugo', 'Isabela', 'João', 'Karla', 'Leonardo', 'Mariana', 'Nicolas', 'Olívia', 'Paulo', 'Rafael', 'Sofia', 'Tiago', 'Vinícius'];
  const sobrenomes = ['Silva', 'Souza', 'Oliveira', 'Santos', 'Pereira', 'Lima', 'Gomes', 'Ribeiro'];
  return `${nomes[i % nomes.length]} ${sobrenomes[i % sobrenomes.length]} ${1000 + i}`;
}

function gerarCpfValido(semente) {
  const base9 = String(100000000 + (semente % 899999999)).padStart(9, '0');
  const calc = (digs, factor) => {
    let total = 0;
    for (let i = 0; i < digs.length; i++) {
      total += parseInt(digs[i], 10) * (factor - i);
    }
    const rem = total % 11;
    return rem < 2 ? '0' : String(11 - rem);
  };
  const d1 = calc(base9, 10);
  const d2 = calc(base9 + d1, 11);
  return base9 + d1 + d2;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function SeedDataButton({ quantidade = 30, onSuccess }) {
  const [rodando, setRodando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [mensagem, setMensagem] = useState(null);
  const [qtd, setQtd] = useState(quantidade);
  const [perfil, setPerfil] = useState('aleatorio');

  async function gerar() {
    setRodando(true);
    setProgresso(0);
    setMensagem(null);

    try {
      await seedTriagens({ quantidade: qtd, perfil });
      setProgresso(100);
      setMensagem({ tipo: 'success', texto: `Seed de ${qtd} triagens gerado (perfil: ${perfil}).` });
      if (onSuccess) onSuccess();
    } catch (err) {
      let falha = false;
      for (let i = 0; i < qtd; i++) {
        try {
          const nome = gerarNome(i);
          const cpf = gerarCpfValido(10000 + i);
          const dia = String((i % 28) + 1).padStart(2, '0');
          const data_nascimento = `${dia}/01/19${70 + (i % 30)}`;

          let paciente;
          try {
            paciente = await cadastrarPaciente({ nome, cpf, data_nascimento });
          } catch (err2) {
            const { listarPacientes } = await import('../services/api');
            const lista = await listarPacientes();
            paciente = lista.find((p) => p.cpf.replace(/\D/g, '') === cpf) || lista[0];
          }

          const triagem = {
            paciente_id: paciente.id,
            queixa_principal: 'Simulação clínica gerada automaticamente',
            dor_escala: randInt(0, 10),
            temperatura: Number((36 + Math.random() * 2).toFixed(1)),
            pressao_sistolica: randInt(90, 160),
            pressao_diastolica: randInt(60, 110),
            freq_cardiaca: randInt(60, 140),
            freq_respiratoria: randInt(10, 30),
            nivel_consciencia: ['alerta', 'responde_voz', 'confuso', 'responde_dor'][randInt(0, 3)],
            sangramento: Math.random() < 0.1,
            convulsao: Math.random() < 0.05,
            observacoes: 'Gerado automaticamente para simulação.',
          };

          await registrarTriagem(triagem);
          setProgresso(Math.round(((i + 1) / qtd) * 100));
        } catch (err3) {
          falha = true;
          setMensagem({ tipo: 'error', texto: `Erro no índice ${i}: ${err3.message}` });
          break;
        }
      }
      if (!falha) {
        setMensagem({ tipo: 'success', texto: 'Geração de triagens finalizada.' });
        if (onSuccess) onSuccess();
      }
    }

    setRodando(false);
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="number"
          min={1}
          max={500}
          value={qtd}
          onChange={(e) => setQtd(Number(e.target.value))}
          style={{
            width: '5rem',
            padding: '0.6rem',
            borderRadius: '4px',
            border: '1px solid var(--border-glass)',
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
          }}
          id="seed-qtd"
          title="Quantidade"
        />

        <select
          value={perfil}
          onChange={(e) => setPerfil(e.target.value)}
          id="seed-perfil"
          style={{
            padding: '0.6rem',
            borderRadius: '4px',
            border: '1px solid var(--border-glass)',
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="aleatorio">Aleatório</option>
          <option value="idoso">Idoso</option>
          <option value="crianca">Criança</option>
          <option value="urgente-heavy">Urgente (graves)</option>
          <option value="estavel">Estável</option>
        </select>

        <button className="btn btn-secondary" onClick={gerar} disabled={rodando} id="btn-gerar-30">
          {rodando ? `Gerando... ${progresso}%` : `Gerar ${qtd} triagens`}
        </button>
      </div>
      {mensagem && (
        <div style={{ marginTop: '0.5rem' }} className={`alert alert-${mensagem.tipo}`} id="seed-mensagem">
          {mensagem.texto}
        </div>
      )}
    </div>
  );
}

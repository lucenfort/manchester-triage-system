'use client';

/**
 * Componente FormTriagem — Formulário de triagem clínica com validação matemática
 * de CPF em tempo real e preview dinâmico do Protocolo de Manchester.
 */

import { useState, useEffect } from 'react';

function calcularPreview(dados) {
  if (
    dados.nivel_consciencia === 'inconsciente' ||
    dados.convulsao ||
    dados.freq_respiratoria < 10 ||
    dados.freq_respiratoria > 35 ||
    dados.pressao_sistolica < 80 ||
    dados.freq_cardiaca < 40 ||
    dados.freq_cardiaca > 150
  ) {
    return { cor: 'vermelho', label: 'Emergência', tempo: 'Imediato' };
  }
  if (
    dados.dor_escala >= 8 ||
    dados.temperatura >= 39.5 ||
    dados.sangramento ||
    dados.nivel_consciencia === 'confuso' ||
    dados.nivel_consciencia === 'responde_dor' ||
    dados.freq_cardiaca > 130 ||
    dados.pressao_sistolica < 90
  ) {
    return { cor: 'laranja', label: 'Muito Urgente', tempo: 'Até 10 min' };
  }
  if (
    dados.dor_escala >= 4 ||
    dados.temperatura >= 38.0 ||
    dados.freq_cardiaca > 110 ||
    dados.pressao_sistolica > 180 ||
    dados.pressao_diastolica > 110 ||
    dados.nivel_consciencia === 'responde_voz'
  ) {
    return { cor: 'amarelo', label: 'Urgente', tempo: 'Até 60 min' };
  }
  if (
    dados.dor_escala >= 1 ||
    dados.temperatura >= 37.5 ||
    dados.freq_cardiaca > 100
  ) {
    return { cor: 'verde', label: 'Pouco Urgente', tempo: 'Até 120 min' };
  }
  return { cor: 'azul', label: 'Não Urgente', tempo: 'Até 240 min' };
}

const VALORES_INICIAIS = {
  nome: '',
  cpf: '',
  data_nascimento: '',
  queixa_principal: '',
  dor_escala: 0,
  temperatura: 36.5,
  pressao_sistolica: 120,
  pressao_diastolica: 80,
  freq_cardiaca: 80,
  freq_respiratoria: 16,
  nivel_consciencia: 'alerta',
  sangramento: false,
  convulsao: false,
  observacoes: '',
};

/**
 * Validação matemática oficial dos dígitos verificadores do CPF.
 */
export function isCPFValid(cpf) {
  if (!cpf) return false;
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCPF.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCPF.charAt(10), 10)) return false;

  return true;
}

export default function FormTriagem({ onSubmit, carregando }) {
  const [form, setForm] = useState(VALORES_INICIAIS);

  const preview = calcularPreview(form);
  const cleanCpf = form.cpf.replace(/\D/g, '');
  const showCpfFeedback = cleanCpf.length > 0;
  const cpfValido = isCPFValid(form.cpf);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryCpf = params.get('cpf');
      if (queryCpf) {
        const cpfLimpo = queryCpf.replace(/\D/g, '');
        const x = cpfLimpo.match(/(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})/);
        const cpfFormatado = !x[2]
          ? x[1]
          : `${x[1]}.${x[2]}${x[3] ? `.${x[3]}` : ''}${x[4] ? `-${x[4]}` : ''}`;

        setForm((prev) => ({ ...prev, cpf: cpfFormatado.substring(0, 14) }));

        import('../services/api').then(({ listarPacientes }) => {
          listarPacientes()
            .then((pacientes) => {
              const paciente = pacientes.find((p) => p.cpf === cpfLimpo);
              if (paciente) {
                setForm((prev) => ({
                  ...prev,
                  nome: paciente.nome,
                  data_nascimento: paciente.data_nascimento,
                }));
              }
            })
            .catch((err) => console.error('Erro ao preencher dados de consulta:', err));
        });
      }
    }
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    let formattedValue = value;

    if (name === 'cpf') {
      const numbers = value.replace(/\D/g, '');
      const x = numbers.match(/(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})/);
      formattedValue = !x[2]
        ? x[1]
        : `${x[1]}.${x[2]}${x[3] ? `.${x[3]}` : ''}${x[4] ? `-${x[4]}` : ''}`;
      formattedValue = formattedValue.substring(0, 14);
    } else if (name === 'data_nascimento') {
      const numbers = value.replace(/\D/g, '');
      const x = numbers.match(/(\d{0,2})(\d{0,2})(\d{0,4})/);
      formattedValue = !x[2] ? x[1] : `${x[1]}/${x[2]}${x[3] ? `/${x[3]}` : ''}`;
      formattedValue = formattedValue.substring(0, 10);
    }

    setForm((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : type === 'number'
            ? Number(value)
            : formattedValue,
    }));
  }

  function handleSlider(e) {
    setForm((prev) => ({ ...prev, dor_escala: Number(e.target.value) }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  function handleReset() {
    setForm(VALORES_INICIAIS);
  }

  function corDor(valor) {
    if (valor === 0) return 'var(--manchester-azul)';
    if (valor <= 3) return 'var(--manchester-verde)';
    if (valor <= 7) return 'var(--manchester-amarelo)';
    return 'var(--manchester-laranja)';
  }

  return (
    <form onSubmit={handleSubmit} className="form-container" id="form-triagem">
      {/* === Dados do Paciente === */}
      <div className="form-section">
        <h2 className="form-section-title">Dados do Paciente</h2>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="nome">Nome Completo *</label>
            <input
              className="form-input" id="nome" name="nome" type="text"
              placeholder="Nome completo do paciente"
              value={form.nome} onChange={handleChange} required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="cpf">CPF *</label>
            <input
              className="form-input" id="cpf" name="cpf" type="text"
              placeholder="000.000.000-00"
              value={form.cpf} onChange={handleChange} required
            />
            {showCpfFeedback && (
              <span
                id="cpf-validation-message"
                style={{
                  fontSize: '0.85rem',
                  marginTop: '0.25rem',
                  display: 'block',
                  color: cpfValido ? 'var(--manchester-verde, #2e7d32)' : 'var(--manchester-vermelho, #d32f2f)',
                }}
              >
                {cpfValido ? 'CPF Válido' : 'CPF Inválido'}
              </span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="data_nascimento">Data de Nascimento *</label>
            <input
              className="form-input" id="data_nascimento" name="data_nascimento" type="text"
              placeholder="DD/MM/AAAA"
              value={form.data_nascimento} onChange={handleChange} required
            />
          </div>
        </div>
      </div>

      {/* === Queixa Principal === */}
      <div className="form-section">
        <h2 className="form-section-title">Queixa Principal</h2>
        <div className="form-group full-width">
          <label className="form-label" htmlFor="queixa_principal">Descreva a queixa *</label>
          <textarea
            className="form-textarea" id="queixa_principal" name="queixa_principal"
            placeholder="Descreva a queixa principal relatada pelo paciente..."
            value={form.queixa_principal} onChange={handleChange} required
          />
        </div>
      </div>

      {/* === Escala de Dor === */}
      <div className="form-section">
        <h2 className="form-section-title">Escala de Dor</h2>
        <div className="pain-scale">
          <div className="pain-value" style={{ color: corDor(form.dor_escala) }}>
            {form.dor_escala}
          </div>
          <div className="pain-slider-container">
            <input
              type="range" className="pain-slider" id="dor_escala"
              min="0" max="10" step="1"
              value={form.dor_escala} onChange={handleSlider}
            />
          </div>
          <div className="pain-labels">
            <span>0 - Sem dor</span>
            <span>5 - Moderada</span>
            <span>10 - Pior dor</span>
          </div>
        </div>
      </div>

      {/* === Sinais Vitais === */}
      <div className="form-section">
        <h2 className="form-section-title">Sinais Vitais</h2>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="temperatura">Temperatura (°C)</label>
            <input
              className="form-input" id="temperatura" name="temperatura"
              type="number" step="0.1" min="30" max="45"
              value={form.temperatura} onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="pressao_sistolica">PA Sistólica (mmHg)</label>
            <input
              className="form-input" id="pressao_sistolica" name="pressao_sistolica"
              type="number" min="40" max="300"
              value={form.pressao_sistolica} onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="pressao_diastolica">PA Diastólica (mmHg)</label>
            <input
              className="form-input" id="pressao_diastolica" name="pressao_diastolica"
              type="number" min="20" max="200"
              value={form.pressao_diastolica} onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="freq_cardiaca">Freq. Cardíaca (bpm)</label>
            <input
              className="form-input" id="freq_cardiaca" name="freq_cardiaca"
              type="number" min="20" max="250"
              value={form.freq_cardiaca} onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="freq_respiratoria">Freq. Respiratória (irpm)</label>
            <input
              className="form-input" id="freq_respiratoria" name="freq_respiratoria"
              type="number" min="4" max="60"
              value={form.freq_respiratoria} onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* === Discriminadores Clínicos === */}
      <div className="form-section">
        <h2 className="form-section-title">Discriminadores Clínicos</h2>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="nivel_consciencia">Nível de Consciência</label>
            <select
              className="form-select" id="nivel_consciencia" name="nivel_consciencia"
              value={form.nivel_consciencia} onChange={handleChange}
            >
              <option value="alerta">Alerta</option>
              <option value="responde_voz">Responde à Voz</option>
              <option value="confuso">Confuso</option>
              <option value="responde_dor">Responde à Dor</option>
              <option value="inconsciente">Inconsciente</option>
            </select>
          </div>
          <div className="form-group">
            <div className="form-checkbox-group">
              <input
                className="form-checkbox" id="sangramento" name="sangramento"
                type="checkbox" checked={form.sangramento} onChange={handleChange}
              />
              <label className="form-label" htmlFor="sangramento">
                Sangramento importante
              </label>
            </div>
          </div>
          <div className="form-group">
            <div className="form-checkbox-group">
              <input
                className="form-checkbox" id="convulsao" name="convulsao"
                type="checkbox" checked={form.convulsao} onChange={handleChange}
              />
              <label className="form-label" htmlFor="convulsao">
                Convulsão ativa ou recente
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* === Observações === */}
      <div className="form-section">
        <h2 className="form-section-title">Observações</h2>
        <div className="form-group full-width">
          <textarea
            className="form-textarea" id="observacoes" name="observacoes"
            placeholder="Observações adicionais do enfermeiro (opcional)..."
            value={form.observacoes} onChange={handleChange}
          />
        </div>
      </div>

      {/* === Preview de Classificação === */}
      <div className="form-section">
        <h2 className="form-section-title">Classificação Estimada</h2>
        <div className={`classification-preview ${preview.cor}`} id="preview-classificacao">
          <h3 className={`classification-color ${preview.cor}`}>
            {preview.label}
          </h3>
          <p>Tempo máximo de espera: {preview.tempo}</p>
        </div>
      </div>

      {/* === Botões === */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        <button
          type="submit" className="btn btn-primary btn-full"
          disabled={!cpfValido || carregando} id="btn-registrar-triagem"
        >
          {carregando ? 'Registrando...' : 'Registrar Triagem'}
        </button>
        <button
          type="button" className="btn btn-outline"
          onClick={handleReset} id="btn-limpar-form"
        >
          Limpar
        </button>
      </div>
    </form>
  );
}

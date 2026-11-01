/**
 * Serviço de comunicação HTTP com a API FastAPI.
 */

async function fetchAPI(endpoint, options = {}) {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errorMessage = `Erro na requisição: ${response.status}`;
    if (errorData.detail) {
      if (Array.isArray(errorData.detail)) {
        errorMessage = errorData.detail
          .map((err) => {
            const field = err.loc ? err.loc[err.loc.length - 1] : '';
            return `${field}: ${err.msg}`;
          })
          .join(', ');
      } else if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      }
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function cadastrarPaciente(dados) {
  return fetchAPI('/api/pacientes', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

export async function listarPacientes() {
  return fetchAPI('/api/pacientes');
}

export async function buscarPaciente(id) {
  return fetchAPI(`/api/pacientes/${id}`);
}

export async function excluirPaciente(id) {
  return fetchAPI(`/api/pacientes/${id}`, {
    method: 'DELETE',
  });
}

export async function registrarTriagem(dados) {
  return fetchAPI('/api/triagens', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

export async function listarFila() {
  return fetchAPI('/api/triagens/fila');
}

export async function buscarTriagem(id) {
  return fetchAPI(`/api/triagens/${id}`);
}

export async function atenderPaciente(triagemId) {
  return fetchAPI(`/api/triagens/${triagemId}/atender`, {
    method: 'PATCH',
  });
}

export async function obterEstatisticas() {
  return fetchAPI('/api/triagens/estatisticas');
}

export async function limparFila() {
  return fetchAPI('/api/triagens/fila', {
    method: 'DELETE',
  });
}

export async function seedTriagens(payload) {
  return fetchAPI('/api/seed', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

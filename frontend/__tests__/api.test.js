const mockFetch = jest.fn();

global.fetch = mockFetch;

describe('services/api', () => {
  beforeEach(() => {
    jest.resetModules();
    mockFetch.mockReset();
  });

  it('faz requisições same-origin para a fila', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1 }],
    });

    const { listarFila } = require('../src/services/api');

    const fila = await listarFila();

    expect(fila).toEqual([{ id: 1 }]);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/triagens/fila',
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('propaga mensagens do backend quando a resposta falha', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ detail: 'Serviço indisponível' }),
    });

    const { obterEstatisticas } = require('../src/services/api');

    await expect(obterEstatisticas()).rejects.toThrow('Serviço indisponível');
  });

  it('formata detalhes de erros de validação (422) corretamente', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        detail: [
          {
            loc: ['body', 'queixa_principal'],
            msg: 'String should have at least 5 characters',
            type: 'value_error.any_str.min_length',
          },
        ],
      }),
    });

    const { registrarTriagem } = require('../src/services/api');

    await expect(registrarTriagem({})).rejects.toThrow(
      'queixa_principal: String should have at least 5 characters'
    );
  });

  it('aceita endpoints sem barra inicial', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    const { buscarTriagem } = require('../src/services/api');

    await buscarTriagem('12');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/triagens/12',
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });
});

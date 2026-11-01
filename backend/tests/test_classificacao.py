from types import SimpleNamespace
from services.classificacao import classificar_manchester, gerar_cpf_valido
from schemas import PacienteCreate


def make_dados(**kwargs):
    defaults = dict(
        dor_escala=0,
        temperatura=36.5,
        pressao_sistolica=120,
        pressao_diastolica=80,
        freq_cardiaca=80,
        freq_respiratoria=16,
        nivel_consciencia="alerta",
        sangramento=False,
        convulsao=False,
    )
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


def test_classifica_vermelho():
    d = make_dados(convulsao=True)
    cor, tempo = classificar_manchester(d)
    assert cor == "vermelho"
    assert tempo == 0


def test_classifica_laranja():
    d = make_dados(dor_escala=9)
    cor, tempo = classificar_manchester(d)
    assert cor == "laranja"
    assert tempo == 10


def test_classifica_amarelo():
    d = make_dados(dor_escala=4)
    cor, tempo = classificar_manchester(d)
    assert cor == "amarelo"
    assert tempo == 60


def test_classifica_verde():
    d = make_dados(dor_escala=2)
    cor, tempo = classificar_manchester(d)
    assert cor == "verde"
    assert tempo == 120


def test_classifica_azul():
    d = make_dados()
    cor, tempo = classificar_manchester(d)
    assert cor == "azul"
    assert tempo == 240


def test_gerar_cpf_valido_passa_validacao_pydantic():
    for semente in (1, 42, 999, 123456):
        cpf = gerar_cpf_valido(semente)
        validado = PacienteCreate.validar_cpf(cpf)
        assert len(validado) == 11

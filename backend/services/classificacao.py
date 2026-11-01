"""
Serviço de classificação clínica baseado no Protocolo de Manchester
e utilitários matemáticos de validação/geração de CPF.
"""


def calcular_digito_cpf(digitos: str, fator_inicial: int) -> str:
    """Calcula um dígito verificador do CPF usando módulo 11."""
    soma = sum(int(ch) * (fator_inicial - idx) for idx, ch in enumerate(digitos))
    resto = soma % 11
    return "0" if resto < 2 else str(11 - resto)


def gerar_cpf_valido(semente: int) -> str:
    """
    Gera um CPF de 11 dígitos matematicamente válido a partir de um número inteiro,
    evitando sequências de dígitos repetidos.
    """
    base_num = (100_000_000 + (semente % 899_999_999))
    base9 = f"{base_num:09d}"
    if base9 == base9[0] * 9:
        base9 = "123456789"
    d1 = calcular_digito_cpf(base9, 10)
    d2 = calcular_digito_cpf(base9 + d1, 11)
    return base9 + d1 + d2


def classificar_manchester(dados) -> tuple[str, int]:
    """
    Classifica o paciente de acordo com o Protocolo de Manchester.

    Avalia os sinais vitais e discriminadores clínicos em ordem
    decrescente de gravidade, retornando a tupla:
    `(cor_classificacao, tempo_espera_max_minutos)`.
    """

    # 1. VERMELHO (Emergência) — Atendimento Imediato (0 min)
    condicoes_vermelho = [
        dados.nivel_consciencia == "inconsciente",
        bool(dados.convulsao),
        dados.freq_respiratoria < 10 or dados.freq_respiratoria > 35,
        dados.pressao_sistolica < 80,
        dados.freq_cardiaca < 40 or dados.freq_cardiaca > 150,
    ]
    if any(condicoes_vermelho):
        return ("vermelho", 0)

    # 2. LARANJA (Muito Urgente) — Até 10 minutos
    condicoes_laranja = [
        dados.dor_escala >= 8,
        dados.temperatura >= 39.5,
        bool(dados.sangramento),
        dados.nivel_consciencia in ("confuso", "responde_dor"),
        dados.freq_cardiaca > 130,
        dados.pressao_sistolica < 90,
    ]
    if any(condicoes_laranja):
        return ("laranja", 10)

    # 3. AMARELO (Urgente) — Até 60 minutos
    condicoes_amarelo = [
        dados.dor_escala >= 4,
        dados.temperatura >= 38.0,
        dados.freq_cardiaca > 110,
        dados.pressao_sistolica > 180,
        dados.pressao_diastolica > 110,
        dados.nivel_consciencia == "responde_voz",
    ]
    if any(condicoes_amarelo):
        return ("amarelo", 60)

    # 4. VERDE (Pouco Urgente) — Até 120 minutos
    condicoes_verde = [
        dados.dor_escala >= 1,
        dados.temperatura >= 37.5,
        dados.freq_cardiaca > 100,
    ]
    if any(condicoes_verde):
        return ("verde", 120)

    # 5. AZUL (Não Urgente) — Até 240 minutos
    return ("azul", 240)

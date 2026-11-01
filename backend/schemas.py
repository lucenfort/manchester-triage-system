"""
Schemas Pydantic para validação de contratos de entrada e saída da API.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

from services.classificacao import calcular_digito_cpf


class PacienteCreate(BaseModel):
    """Schema para cadastro ou reativação de um paciente."""
    nome: str = Field(..., min_length=3, max_length=200, description="Nome completo do paciente")
    cpf: str = Field(..., min_length=11, max_length=14, description="CPF do paciente (com ou sem pontuação)")
    data_nascimento: str = Field(..., description="Data de nascimento no formato DD/MM/AAAA")

    @field_validator("cpf")
    @classmethod
    def validar_cpf(cls, v: str) -> str:
        """Normaliza e valida os dígitos verificadores do CPF."""
        if not isinstance(v, str):
            raise ValueError("CPF deve ser uma string")
        digits = "".join(ch for ch in v if ch.isdigit())
        if len(digits) != 11:
            raise ValueError("CPF deve conter 11 dígitos")
        if digits == digits[0] * 11:
            raise ValueError("CPF inválido")

        d1 = calcular_digito_cpf(digits[:9], 10)
        d2 = calcular_digito_cpf(digits[:9] + d1, 11)
        if digits[-2:] != d1 + d2:
            raise ValueError("CPF inválido")
        return digits

    @field_validator("data_nascimento")
    @classmethod
    def validar_data_nascimento(cls, v: str) -> str:
        """Valida formato DD/MM/AAAA e plausibilidade cronológica."""
        if not isinstance(v, str):
            raise ValueError("Data de nascimento deve ser uma string")
        v = v.strip()
        try:
            dt = datetime.strptime(v, "%d/%m/%Y")
        except ValueError:
            raise ValueError("Data de nascimento deve estar no formato DD/MM/AAAA com valores válidos")

        hoje = datetime.now().date()
        if dt.date() > hoje:
            raise ValueError("Data de nascimento não pode ser no futuro")
        if hoje.year - dt.year > 130:
            raise ValueError("Data de nascimento inválida (idade irreal)")
        return v


class PacienteResponse(BaseModel):
    """Schema de saída com os dados do paciente."""
    id: int
    nome: str
    cpf: str
    data_nascimento: str
    ativo: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TriagemCreate(BaseModel):
    """Schema para registro de uma nova triagem clínica."""
    paciente_id: int = Field(..., description="ID do paciente cadastrado")
    queixa_principal: str = Field(..., min_length=5, max_length=500, description="Queixa principal relatada")

    # Sinais vitais
    dor_escala: int = Field(0, ge=0, le=10, description="Escala de dor de 0 a 10")
    temperatura: float = Field(36.5, ge=30.0, le=45.0, description="Temperatura corporal em °C")
    pressao_sistolica: int = Field(120, ge=40, le=300, description="Pressão arterial sistólica (mmHg)")
    pressao_diastolica: int = Field(80, ge=20, le=200, description="Pressão arterial diastólica (mmHg)")
    freq_cardiaca: int = Field(80, ge=20, le=250, description="Frequência cardíaca (bpm)")
    freq_respiratoria: int = Field(16, ge=4, le=60, description="Frequência respiratória (irpm)")

    # Discriminadores clínicos
    nivel_consciencia: str = Field(
        "alerta",
        description="Nível de consciência: alerta, responde_voz, responde_dor, confuso, inconsciente",
    )
    sangramento: bool = Field(False, description="Presença de sangramento importante")
    convulsao: bool = Field(False, description="Convulsão ativa ou recente")
    observacoes: Optional[str] = Field("", max_length=1000, description="Observações adicionais")


class TriagemResponse(BaseModel):
    """Schema de saída de triagem clínica com classificação atribuída."""
    id: int
    paciente_id: int
    paciente: PacienteResponse
    queixa_principal: str
    dor_escala: int
    temperatura: float
    pressao_sistolica: int
    pressao_diastolica: int
    freq_cardiaca: int
    freq_respiratoria: int
    nivel_consciencia: str
    sangramento: bool
    convulsao: bool
    classificacao: str
    tempo_espera_max: int
    status: str
    observacoes: Optional[str]
    timestamp_atendimento: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SeedPayload(BaseModel):
    """Parâmetros para geração de carga simulada."""
    quantidade: int = 30
    perfil: str = "aleatorio"

"""
Modelos ORM do banco de dados (SQLAlchemy).

Representa as entidades Paciente e Triagem do sistema de triagem clínica.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class Paciente(Base):
    """Entidade que representa um paciente cadastrado no sistema."""
    __tablename__ = "pacientes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(200), nullable=False)
    cpf = Column(String(14), unique=True, nullable=False, index=True)
    data_nascimento = Column(String(10), nullable=False)
    ativo = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    triagens = relationship("Triagem", back_populates="paciente")


class Triagem(Base):
    """Entidade que armazena um atendimento de triagem clínica e sua classificação de risco."""
    __tablename__ = "triagens"

    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False)

    queixa_principal = Column(String(500), nullable=False)

    # Sinais vitais
    dor_escala = Column(Integer, default=0)
    temperatura = Column(Float, default=36.5)
    pressao_sistolica = Column(Integer, default=120)
    pressao_diastolica = Column(Integer, default=80)
    freq_cardiaca = Column(Integer, default=80)
    freq_respiratoria = Column(Integer, default=16)

    # Discriminadores clínicos
    nivel_consciencia = Column(String(20), default="alerta")
    sangramento = Column(Boolean, default=False)
    convulsao = Column(Boolean, default=False)

    # Classificação de Manchester calculada automaticamente
    classificacao = Column(String(10), nullable=False)
    tempo_espera_max = Column(Integer, nullable=False)

    # Controle de atendimento na fila
    status = Column(String(20), default="aguardando")
    timestamp_atendimento = Column(DateTime, nullable=True)
    observacoes = Column(String(1000), default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    paciente = relationship("Paciente", back_populates="triagens")

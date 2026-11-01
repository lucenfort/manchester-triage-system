"""
Rotas para gerenciamento de pacientes.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Paciente, Triagem
from schemas import PacienteCreate, PacienteResponse

router = APIRouter(prefix="/api/pacientes", tags=["Pacientes"])


@router.post("", response_model=PacienteResponse, status_code=201)
def cadastrar_paciente(paciente: PacienteCreate, db: Session = Depends(get_db)):
    """
    Cadastra um novo paciente no sistema ou reativa um cadastro previamente inativado (soft-deleted).
    """
    existente = db.query(Paciente).filter(Paciente.cpf == paciente.cpf).first()
    if existente:
        if existente.ativo:
            raise HTTPException(status_code=400, detail="CPF já cadastrado no sistema.")
        existente.ativo = True
        existente.nome = paciente.nome
        existente.data_nascimento = paciente.data_nascimento
        db.commit()
        db.refresh(existente)
        return existente

    paciente_data = paciente.model_dump() if hasattr(paciente, "model_dump") else paciente.dict()
    novo_paciente = Paciente(**paciente_data)
    db.add(novo_paciente)
    db.commit()
    db.refresh(novo_paciente)
    return novo_paciente


@router.get("", response_model=List[PacienteResponse])
def listar_pacientes(db: Session = Depends(get_db)):
    """Lista todos os pacientes ativos cadastrados, ordenados alfabeticamente."""
    return db.query(Paciente).filter(Paciente.ativo.is_(True)).order_by(Paciente.nome).all()


@router.get("/{paciente_id}", response_model=PacienteResponse)
def buscar_paciente(paciente_id: int, db: Session = Depends(get_db)):
    """Busca um paciente ativo específico pelo ID."""
    paciente = (
        db.query(Paciente)
        .filter(Paciente.id == paciente_id, Paciente.ativo.is_(True))
        .first()
    )
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente não encontrado.")
    return paciente


@router.delete("/{paciente_id}", status_code=200)
def inativar_paciente(paciente_id: int, db: Session = Depends(get_db)):
    """
    Inativa logicamente (soft delete) um paciente e remove eventuais triagens
    pendentes ('aguardando') da fila ativa.
    """
    paciente = (
        db.query(Paciente)
        .filter(Paciente.id == paciente_id, Paciente.ativo.is_(True))
        .first()
    )
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente não encontrado.")

    paciente.ativo = False
    db.query(Triagem).filter(
        Triagem.paciente_id == paciente_id,
        Triagem.status == "aguardando",
    ).update({"status": "cancelado"})

    db.commit()
    return {"message": "Paciente inativado com sucesso."}

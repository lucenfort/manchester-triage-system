"""
Rotas para triagem clínica, fila de atendimento e estatísticas operacionais.
"""

from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import case
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Paciente, Triagem
from schemas import TriagemCreate, TriagemResponse
from services.classificacao import classificar_manchester

router = APIRouter(prefix="/api/triagens", tags=["Triagem"])

PRIORIDADE_ORDEM = {
    "vermelho": 1,
    "laranja": 2,
    "amarelo": 3,
    "verde": 4,
    "azul": 5,
}


@router.post("", response_model=TriagemResponse, status_code=201)
def registrar_triagem(triagem: TriagemCreate, db: Session = Depends(get_db)):
    """
    Registra uma nova triagem clínica para um paciente ativo e calcula automaticamente
    sua classificação de risco pelo Protocolo de Manchester.
    """
    paciente = (
        db.query(Paciente)
        .filter(Paciente.id == triagem.paciente_id, Paciente.ativo.is_(True))
        .first()
    )
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente não encontrado.")

    classificacao, tempo_espera = classificar_manchester(triagem)
    triagem_data = triagem.model_dump() if hasattr(triagem, "model_dump") else triagem.dict()

    nova_triagem = Triagem(
        **triagem_data,
        classificacao=classificacao,
        tempo_espera_max=tempo_espera,
    )
    db.add(nova_triagem)
    db.commit()
    db.refresh(nova_triagem)
    db.refresh(nova_triagem, ["paciente"])
    return nova_triagem


@router.get("/fila", response_model=List[TriagemResponse])
def listar_fila(db: Session = Depends(get_db)):
    """
    Lista a fila de espera ordenada por prioridade clínica (Vermelho → Azul)
    e por ordem de chegada (mais antigo primeiro).
    """
    ordem_prioridade = case(
        PRIORIDADE_ORDEM,
        value=Triagem.classificacao,
        else_=99,
    )

    return (
        db.query(Triagem)
        .join(Paciente, Triagem.paciente_id == Paciente.id)
        .options(joinedload(Triagem.paciente))
        .filter(Triagem.status == "aguardando", Paciente.ativo.is_(True))
        .order_by(ordem_prioridade, Triagem.created_at)
        .all()
    )


@router.get("/estatisticas")
def obter_estatisticas(db: Session = Depends(get_db)):
    """Retorna indicadores consolidados da fila de espera e atendimentos."""
    aguardando = (
        db.query(Triagem)
        .join(Paciente, Triagem.paciente_id == Paciente.id)
        .filter(Triagem.status == "aguardando", Paciente.ativo.is_(True))
    )

    return {
        "total_aguardando": aguardando.count(),
        "vermelho": aguardando.filter(Triagem.classificacao == "vermelho").count(),
        "laranja": aguardando.filter(Triagem.classificacao == "laranja").count(),
        "amarelo": aguardando.filter(Triagem.classificacao == "amarelo").count(),
        "verde": aguardando.filter(Triagem.classificacao == "verde").count(),
        "azul": aguardando.filter(Triagem.classificacao == "azul").count(),
        "total_pacientes": db.query(Paciente).filter(Paciente.ativo.is_(True)).count(),
        "total_atendidos": db.query(Triagem).filter(Triagem.status == "atendido").count(),
    }


@router.get("/{triagem_id}", response_model=TriagemResponse)
def buscar_triagem(triagem_id: int, db: Session = Depends(get_db)):
    """Busca os detalhes de uma triagem específica pelo ID."""
    triagem = (
        db.query(Triagem)
        .options(joinedload(Triagem.paciente))
        .filter(Triagem.id == triagem_id)
        .first()
    )
    if not triagem:
        raise HTTPException(status_code=404, detail="Triagem não encontrada.")
    return triagem


@router.patch("/{triagem_id}/atender", response_model=TriagemResponse)
def atender_paciente(triagem_id: int, db: Session = Depends(get_db)):
    """Chama um paciente que está aguardando na fila e registra o horário do atendimento."""
    triagem = (
        db.query(Triagem)
        .options(joinedload(Triagem.paciente))
        .filter(Triagem.id == triagem_id)
        .first()
    )
    if not triagem:
        raise HTTPException(status_code=404, detail="Triagem não encontrada.")

    if triagem.status != "aguardando":
        raise HTTPException(
            status_code=400,
            detail="Paciente não está aguardando atendimento.",
        )

    triagem.status = "atendido"
    triagem.timestamp_atendimento = datetime.now(timezone.utc)
    db.commit()
    db.refresh(triagem)
    return triagem


@router.delete("/fila")
def limpar_fila(db: Session = Depends(get_db)):
    """Remove os registros de triagem para reiniciar o ambiente de simulação."""
    try:
        db.query(Triagem).delete()
        db.commit()
        return {"message": "Fila limpa com sucesso."}
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao limpar a fila: {str(exc)}")

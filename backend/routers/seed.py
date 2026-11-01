"""
Endpoint para popular o sistema com dados clínicos simulados (seed).

Gera pacientes com CPFs matematicamente válidos e triagens distribuídas
de acordo com o perfil clínico selecionado.
"""

import random
from types import SimpleNamespace
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Paciente, Triagem
from schemas import SeedPayload
from services.classificacao import classificar_manchester, gerar_cpf_valido

router = APIRouter(prefix="/api/seed", tags=["Seed"])


def gerar_nome(i: int) -> str:
    nomes = [
        "Ana", "Bruno", "Carla", "Daniel", "Eva", "Felipe", "Gabriela", "Hugo", "Isabela", "João",
        "Karla", "Leonardo", "Mariana", "Nicolas", "Olívia", "Paulo", "Rafael", "Sofia", "Tiago", "Vinícius",
    ]
    sobrenomes = ["Silva", "Souza", "Oliveira", "Santos", "Pereira", "Lima", "Gomes", "Ribeiro"]
    return f"{nomes[i % len(nomes)]} {sobrenomes[i % len(sobrenomes)]} {1000 + i}"


def gerar_data_nascimento(perfil: str) -> str:
    if perfil == "idoso":
        ano = random.randint(1935, 1960)
    elif perfil == "crianca":
        ano = random.randint(2012, 2022)
    else:
        ano = random.randint(1970, 2005)
    dia = random.randint(1, 28)
    mes = random.randint(1, 12)
    return f"{dia:02d}/{mes:02d}/{ano}"


def gerar_sinais(perfil: str) -> dict:
    if perfil == "urgente-heavy":
        dor = random.randint(6, 10)
        temp = round(random.uniform(37.5, 40.0), 1)
        ps = random.randint(70, 180)
        fc = random.randint(90, 160)
        fr = random.randint(8, 40)
        sang = random.random() < 0.2
        conv = random.random() < 0.15
    elif perfil == "estavel":
        dor = random.randint(0, 3)
        temp = round(random.uniform(36.0, 37.4), 1)
        ps = random.randint(100, 130)
        fc = random.randint(60, 98)
        fr = random.randint(12, 20)
        sang = False
        conv = False
    else:
        dor = random.randint(0, 10)
        temp = round(random.uniform(36.0, 39.0), 1)
        ps = random.randint(90, 160)
        fc = random.randint(60, 140)
        fr = random.randint(10, 30)
        sang = random.random() < 0.08
        conv = random.random() < 0.03

    nivel = "alerta" if perfil == "estavel" else random.choice(["alerta", "responde_voz", "confuso", "responde_dor"])

    return {
        "dor_escala": dor,
        "temperatura": temp,
        "pressao_sistolica": ps,
        "pressao_diastolica": random.randint(60, 105),
        "freq_cardiaca": fc,
        "freq_respiratoria": fr,
        "nivel_consciencia": nivel,
        "sangramento": sang,
        "convulsao": conv,
    }


@router.post("", summary="Gerar dados de simulação (pacientes + triagens)")
def gerar_seed(payload: SeedPayload, db: Session = Depends(get_db)):
    """
    Gera `quantidade` pacientes (com CPFs válidos) e triagens usando o perfil selecionado.
    Perfis suportados: `'aleatorio'`, `'idoso'`, `'crianca'`, `'urgente-heavy'`, `'estavel'`.
    """
    quantidade = payload.quantidade
    perfil = payload.perfil
    if quantidade < 1 or quantidade > 1000:
        raise HTTPException(status_code=400, detail="Quantidade deve estar entre 1 e 1000")

    criados = []
    semente_base = random.randint(10_000, 9_000_000)

    try:
        for i in range(quantidade):
            nome = gerar_nome(random.randint(0, 1000) + i)
            cpf = gerar_cpf_valido(semente_base + i)
            data_nasc = gerar_data_nascimento(perfil)

            existente = db.query(Paciente).filter(Paciente.cpf == cpf).first()
            if existente:
                existente.ativo = True
                paciente = existente
            else:
                paciente = Paciente(nome=nome, cpf=cpf, data_nascimento=data_nasc, ativo=True)
                db.add(paciente)
                db.flush()

            sinais = gerar_sinais(perfil)
            dados = SimpleNamespace(**sinais)
            classificacao, tempo = classificar_manchester(dados)

            nova_triagem = Triagem(
                paciente_id=paciente.id,
                queixa_principal="Simulação clínica gerada automaticamente",
                dor_escala=sinais["dor_escala"],
                temperatura=sinais["temperatura"],
                pressao_sistolica=sinais["pressao_sistolica"],
                pressao_diastolica=sinais["pressao_diastolica"],
                freq_cardiaca=sinais["freq_cardiaca"],
                freq_respiratoria=sinais["freq_respiratoria"],
                nivel_consciencia=sinais["nivel_consciencia"],
                sangramento=sinais["sangramento"],
                convulsao=sinais["convulsao"],
                classificacao=classificacao,
                tempo_espera_max=tempo,
                observacoes=f"Gerado via /api/seed (perfil: {perfil})",
            )
            db.add(nova_triagem)
            db.flush()

            criados.append({
                "paciente_id": paciente.id,
                "triagem_id": nova_triagem.id,
                "classificacao": classificacao,
            })

        db.commit()
    except Exception:
        db.rollback()
        raise

    return {"quantidade": len(criados), "items": criados}

import os

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from database import Base, get_db
from services.classificacao import gerar_cpf_valido
from schemas import PacienteCreate


SQLALCHEMY_TEST_URL = "sqlite:///:memory:"


def setup_test_db():
    engine = create_engine(
        SQLALCHEMY_TEST_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    return TestingSessionLocal


@pytest.fixture(scope="module")
def client():
    TestingSessionLocal = setup_test_db()

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c


def test_criar_e_listar_paciente(client):
    payload = {
        "nome": "Teste Usuario",
        "cpf": gerar_cpf_valido(123456),
        "data_nascimento": "01/01/1990",
    }
    res = client.post("/api/pacientes", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["nome"] == payload["nome"]
    assert data["cpf"] == payload["cpf"]

    # Tentar criar mesmo CPF ativo retorna erro 400
    res2 = client.post("/api/pacientes", json=payload)
    assert res2.status_code == 400

    res_list = client.get("/api/pacientes")
    assert res_list.status_code == 200
    assert len(res_list.json()) >= 1


def test_registrar_triagem_e_fila(client):
    paciente = {
        "nome": "Paciente Triagem",
        "cpf": gerar_cpf_valido(999888),
        "data_nascimento": "02/02/1980",
    }
    r = client.post("/api/pacientes", json=paciente)
    assert r.status_code == 201
    paciente_id = r.json()["id"]

    triagem = {
        "paciente_id": paciente_id,
        "queixa_principal": "Convulsão generalizada",
        "dor_escala": 9,
        "temperatura": 37.0,
        "pressao_sistolica": 110,
        "pressao_diastolica": 70,
        "freq_cardiaca": 90,
        "freq_respiratoria": 20,
        "nivel_consciencia": "alerta",
        "sangramento": False,
        "convulsao": True,
        "observacoes": "Teste",
    }

    r2 = client.post("/api/triagens", json=triagem)
    assert r2.status_code == 201
    triagem_data = r2.json()
    assert triagem_data["classificacao"] == "vermelho"

    r3 = client.get("/api/triagens/fila")
    assert r3.status_code == 200
    fila = r3.json()
    assert any(t["id"] == triagem_data["id"] for t in fila)

    r4 = client.get("/api/triagens/estatisticas")
    assert r4.status_code == 200
    stats = r4.json()
    assert stats["total_aguardando"] >= 1


def test_atender_paciente(client):
    paciente = {
        "nome": "Atender Paciente",
        "cpf": gerar_cpf_valido(555444),
        "data_nascimento": "03/03/1975",
    }
    r = client.post("/api/pacientes", json=paciente)
    pid = r.json()["id"]

    triagem = {
        "paciente_id": pid,
        "queixa_principal": "Dor leve",
        "dor_escala": 2,
        "temperatura": 36.5,
        "pressao_sistolica": 120,
        "pressao_diastolica": 80,
        "freq_cardiaca": 80,
        "freq_respiratoria": 16,
        "nivel_consciencia": "alerta",
        "sangramento": False,
        "convulsao": False,
        "observacoes": "",
    }
    r2 = client.post("/api/triagens", json=triagem)
    tid = r2.json()["id"]

    r3 = client.patch(f"/api/triagens/{tid}/atender")
    assert r3.status_code == 200
    assert r3.json()["status"] == "atendido"
    assert r3.json()["timestamp_atendimento"] is not None


def test_criar_paciente_data_invalida(client):
    p1 = {"nome": "Paciente Errado", "cpf": gerar_cpf_valido(100200), "data_nascimento": "abc"}
    assert client.post("/api/pacientes", json=p1).status_code == 422

    p2 = {"nome": "Paciente Errado 2", "cpf": gerar_cpf_valido(100201), "data_nascimento": "31/02/1990"}
    assert client.post("/api/pacientes", json=p2).status_code == 422

    p3 = {"nome": "Paciente Errado 3", "cpf": gerar_cpf_valido(100202), "data_nascimento": "01/01/2500"}
    assert client.post("/api/pacientes", json=p3).status_code == 422

    p4 = {"nome": "Paciente Errado 4", "cpf": gerar_cpf_valido(100203), "data_nascimento": "01/01/1850"}
    assert client.post("/api/pacientes", json=p4).status_code == 422


def test_inativar_paciente_remove_da_fila_e_permite_reativacao(client):
    payload = {
        "nome": "Paciente Deletar",
        "cpf": gerar_cpf_valido(300400),
        "data_nascimento": "05/05/1995",
    }
    res = client.post("/api/pacientes", json=payload)
    assert res.status_code == 201
    pid = res.json()["id"]

    # Criar triagem aguardando para esse paciente
    res_tri = client.post(
        "/api/triagens",
        json={"paciente_id": pid, "queixa_principal": "Cefaleia moderada", "dor_escala": 5},
    )
    assert res_tri.status_code == 201
    tid = res_tri.json()["id"]

    # Inativar paciente (soft delete)
    res_delete = client.delete(f"/api/pacientes/{pid}")
    assert res_delete.status_code == 200

    # Buscar paciente inativo por ID retorna 404
    assert client.get(f"/api/pacientes/{pid}").status_code == 404

    # Triagem pendente não deve mais aparecer na fila ativa
    fila = client.get("/api/triagens/fila").json()
    assert not any(t["id"] == tid for t in fila)

    # Re-cadastrar mesmo CPF reativa o paciente
    re_payload = {
        "nome": "Paciente Reativado",
        "cpf": payload["cpf"],
        "data_nascimento": "05/05/1995",
    }
    res_re = client.post("/api/pacientes", json=re_payload)
    assert res_re.status_code == 201
    re_data = res_re.json()
    assert re_data["id"] == pid
    assert re_data["nome"] == "Paciente Reativado"
    assert re_data["ativo"] is True


def test_seed_gera_cpfs_validos(client):
    res = client.post("/api/seed", json={"quantidade": 5, "perfil": "estavel"})
    assert res.status_code == 200
    data = res.json()
    assert data["quantidade"] == 5

    pacientes = client.get("/api/pacientes").json()
    for p in pacientes:
        assert len(PacienteCreate.validar_cpf(p["cpf"])) == 11

import importlib
from sqlalchemy import inspect, text


def test_sqlite_schema_migration_adds_missing_columns(tmp_path, monkeypatch):
    db_path = tmp_path / "legacy_triagem.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")

    import database

    importlib.reload(database)

    with database.engine.begin() as connection:
        connection.execute(
            text(
                "CREATE TABLE pacientes ("
                "id INTEGER PRIMARY KEY, "
                "nome VARCHAR(200) NOT NULL, "
                "cpf VARCHAR(14) NOT NULL UNIQUE, "
                "data_nascimento VARCHAR(10) NOT NULL, "
                "created_at DATETIME)"
            )
        )
        connection.execute(
            text(
                "CREATE TABLE triagens ("
                "id INTEGER PRIMARY KEY, "
                "paciente_id INTEGER NOT NULL, "
                "queixa_principal VARCHAR(500) NOT NULL, "
                "dor_escala INTEGER, "
                "temperatura FLOAT, "
                "pressao_sistolica INTEGER, "
                "pressao_diastolica INTEGER, "
                "freq_cardiaca INTEGER, "
                "freq_respiratoria INTEGER, "
                "nivel_consciencia VARCHAR(20), "
                "sangramento BOOLEAN, "
                "convulsao BOOLEAN, "
                "classificacao VARCHAR(10) NOT NULL, "
                "tempo_espera_max INTEGER NOT NULL, "
                "status VARCHAR(20), "
                "observacoes VARCHAR(1000), "
                "created_at DATETIME, "
                "FOREIGN KEY(paciente_id) REFERENCES pacientes (id))"
            )
        )

    database.ensure_sqlite_schema()

    cols_triagens = {col["name"] for col in inspect(database.engine).get_columns("triagens")}
    cols_pacientes = {col["name"] for col in inspect(database.engine).get_columns("pacientes")}
    assert "timestamp_atendimento" in cols_triagens
    assert "ativo" in cols_pacientes

"""
Configuração do banco de dados com SQLAlchemy.

Por padrão, utiliza SQLite local para facilitar o desenvolvimento e testes.
Quando DATABASE_URL é definido no ambiente, conecta-se ao PostgreSQL (Docker/Produção).
"""

import os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./triagem.db")

engine_kwargs = {}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependência do FastAPI que gerencia o ciclo de vida da sessão do banco."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_sqlite_schema():
    """
    Garante que bancos já existentes possuam as colunas mais recentes do schema
    (`timestamp_atendimento` em `triagens` e `ativo` em `pacientes`).
    """
    inspector = inspect(engine)
    dialect_name = engine.dialect.name
    table_names = inspector.get_table_names()

    if "triagens" in table_names:
        columns_triagens = {col["name"] for col in inspector.get_columns("triagens")}
        if "timestamp_atendimento" not in columns_triagens:
            with engine.begin() as conn:
                col_type = "DATETIME" if dialect_name == "sqlite" else "TIMESTAMP WITHOUT TIME ZONE"
                conn.execute(text(f"ALTER TABLE triagens ADD COLUMN timestamp_atendimento {col_type}"))

    if "pacientes" in table_names:
        columns_pacientes = {col["name"] for col in inspector.get_columns("pacientes")}
        if "ativo" not in columns_pacientes:
            with engine.begin() as conn:
                default_val = "1" if dialect_name == "sqlite" else "TRUE"
                conn.execute(text(f"ALTER TABLE pacientes ADD COLUMN ativo BOOLEAN DEFAULT {default_val}"))

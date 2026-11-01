"""
Sistema de Triagem Clínica — Protocolo de Manchester

Ponto de entrada da API FastAPI.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base, ensure_sqlite_schema
from routers import pacientes, triagem, seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_sqlite_schema()
    yield


app = FastAPI(
    lifespan=lifespan,
    redirect_slashes=False,
    title="Sistema de Triagem Clínica — Protocolo de Manchester",
    description=(
        "API RESTful para acolhimento hospitalar, classificação automática de risco "
        "pelo Protocolo de Manchester e gerenciamento da fila de emergência em tempo real."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pacientes.router)
app.include_router(triagem.router)
app.include_router(seed.router)


@app.get("/", tags=["Root"])
def root():
    """Rota raiz com metadados e links de navegação da API."""
    return {
        "sistema": "Triagem Clínica — Protocolo de Manchester",
        "versao": "1.0.0",
        "documentacao": "/docs",
        "endpoints": {
            "pacientes": "/api/pacientes",
            "triagens": "/api/triagens",
            "fila": "/api/triagens/fila",
            "estatisticas": "/api/triagens/estatisticas",
            "seed": "/api/seed",
        },
    }

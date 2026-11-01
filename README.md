<p align="center">
  <img src="./banner.svg" alt="Sistema de Triagem Clínica — Protocolo de Manchester" width="100%" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python_3.11+-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/Next.js_14-React_18-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js"/>
  <img src="https://img.shields.io/badge/PostgreSQL_/_SQLite-SQLAlchemy-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
</p>

# 🏥 Sistema de Triagem Clínica — Protocolo de Manchester

Aplicação Full Stack para acolhimento hospitalar, classificação automática de risco clínico pelo **Protocolo de Manchester** e gestão da fila de atendimento de emergência em tempo real.

---

## ✨ Principais Funcionalidades

- **Classificação Automática (Protocolo de Manchester):** Motor clínico determinístico que avalia sinais vitais e discriminadores para atribuir prioridade e SLA de atendimento (**Vermelho**, **Laranja**, **Amarelo**, **Verde** e **Azul**).
- **Fila Inteligente em Tempo Real:** Ordenação automática por gravidade clínica e tempo de chegada, com indicadores visuais de **SLA Excedido** quando o tempo de espera ultrapassa o limite da classificação.
- **Dashboard Analítico:** Indicadores em tempo real e gráfico Donut interativo renderizado em SVG nativo com proporções da fila de espera.
- **Conformidade LGPD & Validação de Dados:**
  - Validação matemática de dígitos verificadores de CPF em tempo real (frontend e backend).
  - *Soft Delete* (inativação lógica) de pacientes com reativação automática mediante novo atendimento.
  - Prevenção de vazamento de dados sensíveis em conflitos de CPF.
- **Simulador de Carga (Seed):** Geração instantânea de lotes de pacientes e triagens com CPFs matematicamente válidos e diferentes perfis clínicos (`aleatorio`, `urgente-heavy`, `estavel`, `idoso`, `crianca`).

---

## 🎨 Protocolo de Manchester — Matriz de Risco

| Cor | Classificação | Tempo Alvo (SLA) | Principais Discriminadores Clínicos |
|:---:|:---|:---:|:---|
| 🔴 **Vermelho** | Emergência | **0 min** (Imediato) | Inconsciente, convulsão ativa, FR < 10 ou > 35 irpm, PAS < 80 mmHg, FC < 40 ou > 150 bpm |
| 🟠 **Laranja** | Muito Urgente | **10 min** | Dor ≥ 8, Temp ≥ 39.5 °C, sangramento importante, confuso/responde à dor, FC > 130 bpm, PAS < 90 mmHg |
| 🟡 **Amarelo** | Urgente | **60 min** | Dor ≥ 4, Temp ≥ 38.0 °C, FC > 110 bpm, PAS > 180 ou PAD > 110 mmHg, responde à voz |
| 🟢 **Verde** | Pouco Urgente | **120 min** | Dor ≥ 1, Temp ≥ 37.5 °C, FC > 100 bpm |
| 🔵 **Azul** | Não Urgente | **240 min** | Sinais vitais estáveis e ausência de discriminadores de urgência |

---

## 🏗️ Arquitetura do Projeto

```text
manchester-triage-system/
├── backend/                     # API RESTful (Python 3.11 + FastAPI + SQLAlchemy)
│   ├── routers/                 # Rotas de pacientes, triagem/fila e seed de simulação
│   ├── services/                # Motor isolado do Protocolo de Manchester e utilitários de CPF
│   ├── tests/                   # Suíte de testes automatizados (pytest)
│   ├── database.py              # Configuração SQLite/PostgreSQL e auto-migração de schema
│   ├── models.py                # Entidades ORM (Paciente, Triagem)
│   ├── schemas.py               # Contratos e validações Pydantic v2
│   └── main.py                  # Ponto de entrada FastAPI e ciclo de vida
├── frontend/                    # Interface Web (Next.js 14 App Router + React 18)
│   ├── src/app/                 # Páginas: Dashboard (/), Triagem (/triagem), Pacientes (/pacientes), Painel (/painel)
│   ├── src/components/          # Componentes visuais (FormTriagem, FilaPacientes, CardPaciente, Navbar)
│   ├── src/services/            # Cliente HTTP centralizado
│   └── __tests__/               # Suíte de testes unitários e de integração (Jest + Testing Library)
└── docker-compose.yml           # Orquestração completa (PostgreSQL 16 + Backend + Frontend)
```

---

## 🚀 Como Executar

### Opção 1: Execução Completa com Docker (Recomendado)

Certifique-se de ter o **Docker** e o **Docker Compose** instalados:

```bash
docker compose up --build
```

- **Frontend (Aplicação Web):** [http://localhost:3000](http://localhost:3000)
- **Backend (API REST):** [http://localhost:8000](http://localhost:8000)
- **Documentação Interativa (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)

Para encerrar e remover volumes:
```bash
docker compose down -v
```

### Opção 2: Execução Local (Desenvolvimento)

#### 1. Backend (FastAPI — usa SQLite local automaticamente se `DATABASE_URL` não for definido)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### 2. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Testes Automatizados

O projeto conta com cobertura de testes de unidade e integração no Backend e no Frontend:

```bash
# Executar testes do Backend (pytest)
cd backend && pytest -v

# Executar testes do Frontend (Jest + React Testing Library)
cd frontend && npm test
```

---

## 📡 Principais Endpoints da API

| Método | Endpoint | Descrição |
|:---:|:---|:---|
| `POST` | `/api/pacientes` | Cadastra novo paciente ou reativa cadastro inativo pelo CPF |
| `GET` | `/api/pacientes` | Lista pacientes ativos ordenados alfabeticamente |
| `GET` | `/api/pacientes/{id}` | Consulta dados de um paciente ativo por ID |
| `DELETE` | `/api/pacientes/{id}` | Inativa logicamente um paciente (*soft delete*) e cancela triagens pendentes |
| `POST` | `/api/triagens` | Registra sinais vitais e classifica automaticamente pelo Protocolo de Manchester |
| `GET` | `/api/triagens/fila` | Retorna a fila ativa ordenada por prioridade clínica e horário de chegada |
| `GET` | `/api/triagens/estatisticas` | Retorna contadores por cor, total aguardando, atendidos e pacientes ativos |
| `PATCH` | `/api/triagens/{id}/atender` | Registra a chamada do paciente para atendimento médico com *timestamp* |
| `DELETE` | `/api/triagens/fila` | Limpa os registros da fila de triagem |
| `POST` | `/api/seed` | Popula o banco com lote de pacientes e triagens simuladas |

---

## 👨‍💻 Autor

Desenvolvido por **Luciano Silva de Arruda**  
🔗 [github.com/lucenfort](https://github.com/lucenfort) · 📧 [lucen4t@gmail.com](mailto:lucen4t@gmail.com)

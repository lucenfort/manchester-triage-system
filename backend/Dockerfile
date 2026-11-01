# Dockerfile para o backend FastAPI com suporte a PostgreSQL e SQLite
FROM python:3.11-slim

WORKDIR /app

# Instalar dependências de sistema necessárias para o driver PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependências Python (cache de camada)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código-fonte
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

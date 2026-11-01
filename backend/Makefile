VENV=.venv
PYTHON=$(VENV)/bin/python
PIP=$(VENV)/bin/pip

.PHONY: setup test run

setup:
	python3 -m venv $(VENV)
	$(PIP) install --upgrade pip setuptools wheel
	$(PIP) install -r requirements.txt

test: setup
	$(VENV)/bin/pytest -v

run: setup
	$(VENV)/bin/uvicorn main:app --reload --port 8000

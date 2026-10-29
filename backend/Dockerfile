FROM python:3.12-slim

WORKDIR /app

RUN pip install uv

# Keep the virtualenv outside /app: docker-compose bind-mounts ./backend over /app
# for live reload, which would otherwise hide it (and celery with it).
ENV UV_PROJECT_ENVIRONMENT=/opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY pyproject.toml .
RUN uv sync --no-dev

COPY app/ app/

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

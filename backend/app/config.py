from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    app_name: str = "DocuMind"
    app_env: str = "development"
    secret_key: str
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30

    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "documind"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Celery
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    # Storage
    storage_provider: str = "minio"  # minio | s3
    s3_endpoint_url: str = "http://localhost:9000"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "minioadmin"
    s3_bucket_name: str = "documind"

    # LLM
    llm_provider: str = "openai"  # openai | anthropic
    llm_model: str = "gpt-4o-mini"
    embedding_model: str = "text-embedding-3-small"
    openai_api_key: str = ""
    anthropic_api_key: str = ""

    # CORS
    allowed_origins: list[str] = ["http://localhost:5173"]

    # Limits
    max_upload_size_bytes: int = 50 * 1024 * 1024  # 50 MB
    allowed_mime_types: list[str] = [
        "application/pdf",
        "text/csv",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
    ]


settings = Settings()

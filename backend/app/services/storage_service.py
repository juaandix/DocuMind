import uuid
from pathlib import Path

import boto3
from botocore.config import Config

from app.config import settings

_LOCAL_ROOT = Path("/tmp/documind-storage")


class StorageService:
    def __init__(self):
        if settings.storage_provider == "local":
            self._client = None
            return

        kwargs = {
            "aws_access_key_id": settings.s3_access_key,
            "aws_secret_access_key": settings.s3_secret_key,
            "region_name": "us-east-1",
        }
        if settings.storage_provider == "minio":
            kwargs["endpoint_url"] = settings.s3_endpoint_url
            kwargs["config"] = Config(signature_version="s3v4")

        self._client = boto3.client("s3", **kwargs)
        self._bucket = settings.s3_bucket_name

    def _ensure_bucket(self):
        try:
            self._client.head_bucket(Bucket=self._bucket)
        except Exception:
            self._client.create_bucket(Bucket=self._bucket)

    async def upload(self, file_bytes: bytes, filename: str, content_type: str) -> str:
        key = f"documents/{uuid.uuid4()}/{filename}"
        if settings.storage_provider == "local":
            path = _LOCAL_ROOT / key
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(file_bytes)
            return key

        self._ensure_bucket()
        self._client.put_object(
            Bucket=self._bucket,
            Key=key,
            Body=file_bytes,
            ContentType=content_type,
        )
        return key

    async def download(self, key: str) -> bytes:
        if settings.storage_provider == "local":
            return (_LOCAL_ROOT / key).read_bytes()

        response = self._client.get_object(Bucket=self._bucket, Key=key)
        return response["Body"].read()

    async def delete(self, key: str) -> None:
        if settings.storage_provider == "local":
            path = _LOCAL_ROOT / key
            if path.exists():
                path.unlink()
            return

        self._client.delete_object(Bucket=self._bucket, Key=key)

    def presigned_url(self, key: str, expires_in: int = 3600) -> str:
        if settings.storage_provider == "local":
            return f"/local-storage/{key}"

        return self._client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self._bucket, "Key": key},
            ExpiresIn=expires_in,
        )

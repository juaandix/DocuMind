"""
Create or reset a PLATFORM_ADMIN user for the DocuMind admin panel.

Usage:
    uv run python scripts/create_platform_admin.py
    uv run python scripts/create_platform_admin.py --email admin@example.com --password secret123
"""
import argparse
import asyncio
from datetime import UTC, datetime

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings
from app.core.security import hash_password
from app.models.user import UserRole


async def main(email: str, password: str) -> None:
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.mongodb_db_name]

    existing = await db.users.find_one({"email": email})

    if existing:
        await db.users.update_one(
            {"email": email},
            {"$set": {
                "hashed_password": hash_password(password),
                "role": UserRole.PLATFORM_ADMIN,
                "is_active": True,
                "updated_at": datetime.now(UTC),
            }},
        )
        print(f"✓ Updated existing user → PLATFORM_ADMIN: {email}")
    else:
        # PLATFORM_ADMIN users don't belong to a workspace
        placeholder_ws = ObjectId()
        await db.users.insert_one({
            "_id": ObjectId(),
            "email": email,
            "hashed_password": hash_password(password),
            "full_name": "Platform Admin",
            "workspace_id": placeholder_ws,
            "role": UserRole.PLATFORM_ADMIN,
            "avatar_url": None,
            "is_active": True,
            "created_at": datetime.now(UTC),
            "updated_at": datetime.now(UTC),
        })
        print(f"✓ Created PLATFORM_ADMIN: {email}")

    client.close()
    print(f"  Admin panel → http://localhost:4200")
    print(f"  Email:    {email}")
    print(f"  Password: {password}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", default="admin@documind.io")
    parser.add_argument("--password", default="Admin1234!")
    args = parser.parse_args()
    asyncio.run(main(args.email, args.password))

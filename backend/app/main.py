from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth, chat, clients, workers


@asynccontextmanager
async def lifespan(_app: FastAPI):
    import app.models  # noqa: F401 — register models with Base.metadata

    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="TrustHome API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(workers.router, prefix="/api/workers", tags=["workers"])
app.include_router(clients.router, prefix="/api/clients", tags=["clients"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])




@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

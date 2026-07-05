import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.analyses import router as analyses_router

app = FastAPI(title="File Insight API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyses_router, prefix="/api")


@app.get("/api/healthz")
def health():
    return {"status": "ok"}

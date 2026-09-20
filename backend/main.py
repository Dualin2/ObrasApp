from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app import models, database
from app.routers import projects, history, daily, users

# models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Control de Obra API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(daily.router)
app.include_router(history.router)
app.include_router(users.router)

@app.get("/")
def read_root():
    return {"message": "API funcionando correctamente"}

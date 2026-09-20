from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from .. import models, database

router = APIRouter(prefix="/api/users", tags=["Users"])

class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    password: str
    role: str

@router.post("/login")
def login(payload: UserLogin, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == payload.username, models.User.password == payload.password).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    return {"id": user.id, "username": user.username, "role": user.role}

@router.get("")
def get_users(db: Session = Depends(database.get_db)):
    return db.query(models.User).all()

@router.post("")
def create_user(payload: UserCreate, db: Session = Depends(database.get_db)):
    existing = db.query(models.User).filter(models.User.username == payload.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    
    new_user = models.User(
        username=payload.username,
        password=payload.password,
        role=payload.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": new_user.id, "username": new_user.username, "role": new_user.role}

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.username == "master":
        raise HTTPException(status_code=403, detail="No se puede borrar al usuario master")
    db.delete(user)
    db.commit()
    return {"ok": True}

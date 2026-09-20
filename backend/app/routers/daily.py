from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, crud, database

router = APIRouter(prefix="/api/operations", tags=["Operations"])

@router.post("/delivery-notes")
def submit_delivery_note(note: schemas.DeliveryNoteCreate, db: Session = Depends(database.get_db)):
    """Sube un albarán y hace el reparto de costes entre las unidades de obra."""
    return crud.create_delivery_note(db=db, note=note)

@router.post("/daily-progress")
def submit_daily_progress(progress: schemas.DailyProgressCreate, db: Session = Depends(database.get_db)):
    """Sube el avance físico (medición) de una unidad de obra en el día."""
    # Como es un entorno de prueba, ponemos un user_id fijo = 1 (el encargado)
    # TODO: En un sistema real, el user_id viene del token de autenticación
    return crud.create_daily_progress(db=db, progress=progress, user_id=1)

@router.post("/incidents")
def submit_incident(project_id: int, date: str, incident_type: str, description: str, db: Session = Depends(database.get_db)):
    """Registra una incidencia (Ej: Lluvia, avería, retraso)"""
    from datetime import datetime
    date_obj = datetime.strptime(date, "%Y-%m-%d").date()
    
    incident = models.Incident(
        project_id=project_id,
        date=date_obj,
        incident_type=incident_type,
        description=description
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident

from fastapi import HTTPException

@router.get("/delivery-notes/{note_id}")
def get_delivery_note(note_id: int, db: Session = Depends(database.get_db)):
    note = db.query(models.DeliveryNote).filter(models.DeliveryNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Albarán no encontrado")
    
    # Construir una respuesta detallada con los nombres de las unidades de obra
    allocations_detail = []
    for alloc in note.allocations:
        wu = alloc.work_unit
        allocations_detail.append({
            "id": alloc.id,
            "work_unit_id": wu.id,
            "work_unit_code": wu.code,
            "work_unit_name": wu.name,
            "allocated_percentage": alloc.allocated_percentage,
            "allocated_cost": alloc.allocated_cost
        })
        
    return {
        "id": note.id,
        "date": note.date,
        "provider": note.provider,
        "material_description": note.material_description,
        "total_quantity": note.total_quantity,
        "total_cost": note.total_cost,
        "contract_id": note.contract_id,
        "allocations": allocations_detail
    }

@router.put("/delivery-notes/{note_id}")
def update_delivery_note(note_id: int, note_data: schemas.DeliveryNoteCreate, db: Session = Depends(database.get_db)):
    """Actualiza un albarán y recalcula los repartos de coste"""
    updated_note = crud.update_delivery_note(db=db, note_id=note_id, note_data=note_data)
    if not updated_note:
        raise HTTPException(status_code=404, detail="Albarán no encontrado")
    return {"ok": True, "id": updated_note.id}

@router.delete("/delivery-notes/{note_id}")
def delete_delivery_note(note_id: int, db: Session = Depends(database.get_db)):
    """Elimina un albarán y sus repartos de coste asociados"""
    note = db.query(models.DeliveryNote).filter(models.DeliveryNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Albarán no encontrado")
    
    # Eliminar repartos asociados primero (para no romper integridad referencial)
    db.query(models.CostAllocation).filter(models.CostAllocation.delivery_note_id == note_id).delete()
    
    db.delete(note)
    db.commit()
    return {"ok": True}

@router.delete("/daily-progress/{progress_id}")
def delete_daily_progress(progress_id: int, db: Session = Depends(database.get_db)):
    """Elimina un avance de producción diario"""
    progress = db.query(models.DailyProgress).filter(models.DailyProgress.id == progress_id).first()
    if not progress:
        raise HTTPException(status_code=404, detail="Avance no encontrado")
    
    db.delete(progress)
    db.commit()
    return {"ok": True}

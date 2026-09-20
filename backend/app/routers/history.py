from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from typing import List

from .. import models, database

router = APIRouter(prefix="/api/daily", tags=["Daily Report"])

@router.get("/{project_id}/report")
def get_daily_report(project_id: int, report_date: date, db: Session = Depends(database.get_db)):
    """Devuelve todo lo ocurrido en la obra en un día concreto: Albaranes, Avances e Incidencias."""
    
    # 1. Albaranes de ese día
    delivery_notes = db.query(models.DeliveryNote).filter(
        models.DeliveryNote.project_id == project_id,
        models.DeliveryNote.date == report_date
    ).all()
    
    # 2. Avances de obra de ese día (y a qué unidad corresponden)
    progresses = db.query(models.DailyProgress).join(models.WorkUnit).filter(
        models.WorkUnit.project_id == project_id,
        models.DailyProgress.date == report_date
    ).all()
    
    # 3. Incidencias del día
    incidents = db.query(models.Incident).filter(
        models.Incident.project_id == project_id,
        models.Incident.date == report_date
    ).all()
    
    return {
        "date": report_date,
        "total_deliveries": len(delivery_notes),
        "total_spent_today": sum(note.total_cost for note in delivery_notes),
        "deliveries": [
            {
                "id": n.id,
                "provider": n.provider,
                "description": n.material_description,
                "cost": n.total_cost,
                "quantity": n.total_quantity,
                "image": n.receipt_image
            } for n in delivery_notes
        ],
        "progresses": [
            {
                "id": p.id,
                "work_unit": p.work_unit.name,
                "code": p.work_unit.code,
                "quantity": p.executed_quantity,
                "notes": p.notes
            } for p in progresses
        ],
        "incidents": [
            {
                "id": i.id,
                "type": i.incident_type,
                "description": i.description
            } for i in incidents
        ]
    }

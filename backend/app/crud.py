from sqlalchemy.orm import Session
from . import models, schemas

def get_work_units(db: Session, project_id: int):
    return db.query(models.WorkUnit).filter(models.WorkUnit.project_id == project_id).all()

def create_work_unit(db: Session, work_unit: schemas.WorkUnitCreate, project_id: int):
    db_wu = models.WorkUnit(**work_unit.model_dump(), project_id=project_id)
    db.add(db_wu)
    db.commit()
    db.refresh(db_wu)
    return db_wu

def create_delivery_note(db: Session, note: schemas.DeliveryNoteCreate):
    """
    Crea un albarán y procesa matemáticamente sus líneas de imputación (el reparto de costes)
    """
    # 1. Crear el Albarán (Cabecera)
    db_note = models.DeliveryNote(
        project_id=note.project_id,
        contract_id=note.contract_id,
        date=note.date,
        provider=note.provider,
        material_description=note.material_description,
        total_quantity=note.total_quantity,
        total_cost=note.total_cost
    )
    db.add(db_note)
    db.flush() # Para obtener el ID del albarán sin hacer commit todavía

    # 2. Procesar las imputaciones
    for alloc in note.allocations:
        # Calcular el coste económico proporcional de esta línea
        if alloc.allocated_percentage > 0:
            perc = min(alloc.allocated_percentage, 100.0)
            cost = (perc / 100.0) * note.total_cost
        else:
            # Si se asigna por cantidad absoluta (ej: 40 m3 de 100 m3)
            cost = (alloc.allocated_quantity / note.total_quantity) * note.total_cost if note.total_quantity > 0 else 0

        db_alloc = models.CostAllocation(
            delivery_note_id=db_note.id,
            work_unit_id=alloc.work_unit_id,
            allocated_quantity=alloc.allocated_quantity,
            allocated_percentage=alloc.allocated_percentage,
            allocated_cost=cost
        )
        db.add(db_alloc)

    db.commit()
    db.refresh(db_note)
    return db_note

def update_delivery_note(db: Session, note_id: int, note_data: schemas.DeliveryNoteCreate):
    """
    Actualiza un albarán existente y recrea sus líneas de imputación.
    """
    db_note = db.query(models.DeliveryNote).filter(models.DeliveryNote.id == note_id).first()
    if not db_note:
        return None

    # Actualizar cabecera
    db_note.contract_id = note_data.contract_id
    db_note.date = note_data.date
    db_note.provider = note_data.provider
    db_note.material_description = note_data.material_description
    db_note.total_quantity = note_data.total_quantity
    db_note.total_cost = note_data.total_cost

    # Borrar imputaciones viejas
    db.query(models.CostAllocation).filter(models.CostAllocation.delivery_note_id == note_id).delete()
    db.flush()

    # Crear imputaciones nuevas
    for alloc in note_data.allocations:
        if alloc.allocated_percentage > 0:
            perc = min(alloc.allocated_percentage, 100.0)
            cost = (perc / 100.0) * note_data.total_cost
        else:
            cost = (alloc.allocated_quantity / note_data.total_quantity) * note_data.total_cost if note_data.total_quantity > 0 else 0

        db_alloc = models.CostAllocation(
            delivery_note_id=db_note.id,
            work_unit_id=alloc.work_unit_id,
            allocated_quantity=alloc.allocated_quantity,
            allocated_percentage=alloc.allocated_percentage,
            allocated_cost=cost
        )
        db.add(db_alloc)

    db.commit()
    db.refresh(db_note)
    return db_note

def create_daily_progress(db: Session, progress: schemas.DailyProgressCreate, user_id: int):
    db_prog = models.DailyProgress(
        **progress.model_dump(),
        user_id=user_id
    )
    db.add(db_prog)
    db.commit()
    db.refresh(db_prog)
    return db_prog

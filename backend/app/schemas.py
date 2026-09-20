from pydantic import BaseModel
from typing import List, Optional
from datetime import date

# ---- UNIDADES DE OBRA ----
class WorkUnitBase(BaseModel):
    chapter: str
    code: str
    name: str
    measurement: float
    target_cost_price: float
    sale_price: float
    certified_quantity: float = 0.0

class WorkUnitCreate(WorkUnitBase):
    pass

class WorkUnit(WorkUnitBase):
    id: int
    project_id: int

    class Config:
        from_attributes = True

# ---- IMPUTACIONES (REPARTO) ----
class CostAllocationCreate(BaseModel):
    work_unit_id: int
    allocated_quantity: float
    allocated_percentage: float

class CostAllocation(CostAllocationCreate):
    id: int
    delivery_note_id: int
    allocated_cost: float

    class Config:
        from_attributes = True

# ---- ALBARANES ----
class DeliveryNoteBase(BaseModel):
    date: date
    provider: str
    material_description: str
    total_quantity: float
    total_cost: float
    contract_id: Optional[int] = None

class DeliveryNoteCreate(DeliveryNoteBase):
    project_id: int
    allocations: List[CostAllocationCreate]

class DeliveryNote(DeliveryNoteBase):
    id: int
    project_id: int
    allocations: List[CostAllocation]

    class Config:
        from_attributes = True

# ---- AVANCE DIARIO ----
class DailyProgressCreate(BaseModel):
    work_unit_id: int
    date: date
    executed_quantity: float
    notes: Optional[str] = None

class DailyProgress(DailyProgressCreate):
    id: int
    user_id: int

    class Config:
        from_attributes = True
class CertificationUpdate(BaseModel):
    amount: float

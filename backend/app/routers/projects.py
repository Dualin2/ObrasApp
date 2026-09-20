from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import pandas as pd
import io

from .. import models, database

router = APIRouter(prefix="/api/projects", tags=["Projects"])

@router.get("/")
def get_projects(db: Session = Depends(database.get_db)):
    return db.query(models.Project).all()

@router.post("/")
def create_project(name: str, db: Session = Depends(database.get_db)):
    db_project = models.Project(name=name)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("/{project_id}/work-units")
def get_work_units(project_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.WorkUnit).filter(models.WorkUnit.project_id == project_id).all()

@router.post("/{project_id}/work-units")
def create_work_unit(project_id: int, wu: schemas.WorkUnitCreate, db: Session = Depends(database.get_db)):
    db_wu = models.WorkUnit(
        project_id=project_id,
        chapter=wu.chapter,
        code=wu.code,
        name=wu.name,
        measurement=wu.measurement,
        target_cost_price=wu.target_cost_price,
        sale_price=wu.sale_price
    )
    db.add(db_wu)
    db.commit()
    db.refresh(db_wu)
    return db_wu

@router.put("/{project_id}/work-units/{wu_id}")
def update_work_unit(project_id: int, wu_id: int, wu: schemas.WorkUnitCreate, db: Session = Depends(database.get_db)):
    db_wu = db.query(models.WorkUnit).filter(models.WorkUnit.id == wu_id, models.WorkUnit.project_id == project_id).first()
    if not db_wu:
        raise HTTPException(status_code=404, detail="Unidad de obra no encontrada")
    
    db_wu.chapter = wu.chapter
    db_wu.code = wu.code
    db_wu.name = wu.name
    db_wu.measurement = wu.measurement
    db_wu.target_cost_price = wu.target_cost_price
    db_wu.sale_price = wu.sale_price
    db.commit()
    db.refresh(db_wu)
    return db_wu

@router.delete("/{project_id}/work-units/{wu_id}")
def delete_work_unit(project_id: int, wu_id: int, db: Session = Depends(database.get_db)):
    db_wu = db.query(models.WorkUnit).filter(models.WorkUnit.id == wu_id, models.WorkUnit.project_id == project_id).first()
    if not db_wu:
        raise HTTPException(status_code=404, detail="Unidad de obra no encontrada")
    db.delete(db_wu)
    db.commit()
    return {"ok": True}

@router.get("/{project_id}/delivery-notes")
def get_delivery_notes(project_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.DeliveryNote).filter(models.DeliveryNote.project_id == project_id).order_by(models.DeliveryNote.date.desc()).all()

@router.get("/{project_id}/contracts")
def get_contracts(project_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.Contract).filter(models.Contract.project_id == project_id).all()

@router.post("/{project_id}/contracts")
def create_contract(project_id: int, contract: dict, db: Session = Depends(database.get_db)):
    c = models.Contract(
        project_id=project_id,
        provider=contract['provider'],
        concept=contract['concept'],
        unit_price=contract['unit_price']
    )
    db.add(c)
    db.commit()
    return c

@router.get("/{project_id}/dashboard")
def get_project_dashboard(project_id: int, db: Session = Depends(database.get_db)):
    """Calcula los KPIs financieros y productivos de la obra en tiempo real."""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")

    work_units = db.query(models.WorkUnit).filter(models.WorkUnit.project_id == project_id).all()
    
    presupuesto_coste = sum([wu.measurement * wu.target_cost_price for wu in work_units])
    presupuesto_venta = sum([wu.measurement * wu.sale_price for wu in work_units])
    
    # Producción (Avances x Precio Venta) y Coste Previsto de la Producción
    produccion_venta = 0.0
    coste_previsto_ejecutado = 0.0
    progress_records = db.query(models.DailyProgress).join(models.WorkUnit).filter(models.WorkUnit.project_id == project_id).all()
    
    progress_by_wu = {}
    for p in progress_records:
        progress_by_wu[p.work_unit_id] = progress_by_wu.get(p.work_unit_id, 0) + p.executed_quantity
        
    for wu_id, qty in progress_by_wu.items():
        wu = next((w for w in work_units if w.id == wu_id), None)
        if wu:
            produccion_venta += qty * wu.sale_price
            coste_previsto_ejecutado += qty * wu.target_cost_price
            
    # Coste Real (Repartos de Albaranes)
    allocations = db.query(models.CostAllocation).join(models.DeliveryNote).filter(models.DeliveryNote.project_id == project_id).all()
    coste_real = 0.0
    real_cost_by_wu = {}
    for alloc in allocations:
        # El coste imputado a la unidad es el % del coste total del albarán
        cost_amount = alloc.delivery_note.total_cost * (alloc.allocated_percentage / 100.0)
        coste_real += cost_amount
        real_cost_by_wu[alloc.work_unit_id] = real_cost_by_wu.get(alloc.work_unit_id, 0) + cost_amount
        
    # Top Desviaciones
    deviations = []
    for wu in work_units:
        executed_qty = progress_by_wu.get(wu.id, 0)
        real_c = real_cost_by_wu.get(wu.id, 0)
        target_c = executed_qty * wu.target_cost_price
        sale_v = executed_qty * wu.sale_price
        
        if executed_qty > 0 or real_c > 0:
            diff = target_c - real_c
            deviations.append({
                "id": wu.id,
                "code": wu.code,
                "name": wu.name,
                "executed_qty": executed_qty,
                "target_cost": target_c,
                "real_cost": real_c,
                "sale_value": sale_v,
                "deviation": diff,
                "status": "warning" if diff < 0 else "success"
            })
            
    # Ordenar por mayor desviación negativa (las que más pierden dinero)
    deviations.sort(key=lambda x: x["deviation"])
    top_deviations = deviations[:5]

    uncontracted_deliveries = db.query(models.DeliveryNote).filter(
        models.DeliveryNote.project_id == project_id, 
        models.DeliveryNote.contract_id == None
    ).count()
    
    # Certificación total y pendientes
    certificacion_total = 0.0
    unidades_pendientes_certificar = 0
    importe_pendiente_certificar = 0.0

    for wu in work_units:
        certificacion_total += (wu.certified_quantity * wu.sale_price)
        executed_qty = progress_by_wu.get(wu.id, 0)
        if executed_qty > wu.certified_quantity:
            unidades_pendientes_certificar += 1
            importe_pendiente_certificar += (executed_qty - wu.certified_quantity) * wu.sale_price
    
    return {
        "kpis": {
            "presupuesto_venta": presupuesto_venta,
            "presupuesto_coste": presupuesto_coste,
            "produccion_total": produccion_venta,
            "coste_real_total": coste_real,
            "margen_produccion": produccion_venta - coste_real,
            "margen_certificacion": certificacion_total - coste_real,
            "desviacion_coste": coste_previsto_ejecutado - coste_real,
            "uncontracted_deliveries": uncontracted_deliveries,
            "certificacion": certificacion_total,
            "coste_previsto": coste_previsto_ejecutado,
            "unidades_pendientes_certificar": unidades_pendientes_certificar,
            "importe_pendiente_certificar": importe_pendiente_certificar
        },
        "top_deviations": top_deviations
    }

class CertificationItemUpdate(BaseModel):
    work_unit_id: int
    certified_quantity: float

class BulkCertificationUpdate(BaseModel):
    items: List[CertificationItemUpdate]

@router.put("/{project_id}/certifications")
def update_certifications(project_id: int, payload: BulkCertificationUpdate, db: Session = Depends(database.get_db)):
    for item in payload.items:
        db_wu = db.query(models.WorkUnit).filter(models.WorkUnit.id == item.work_unit_id, models.WorkUnit.project_id == project_id).first()
        if db_wu:
            db_wu.certified_quantity = item.certified_quantity
    db.commit()
    return {"ok": True}

@router.get("/{project_id}/certification-data")
def get_certification_data(project_id: int, db: Session = Depends(database.get_db)):
    work_units = db.query(models.WorkUnit).filter(models.WorkUnit.project_id == project_id).all()
    progress_records = db.query(models.DailyProgress).join(models.WorkUnit).filter(models.WorkUnit.project_id == project_id).all()
    
    progress_by_wu = {}
    for p in progress_records:
        progress_by_wu[p.work_unit_id] = progress_by_wu.get(p.work_unit_id, 0) + p.executed_quantity

    data = []
    for wu in work_units:
        data.append({
            "id": wu.id,
            "chapter": wu.chapter,
            "code": wu.code,
            "name": wu.name,
            "sale_price": wu.sale_price,
            "executed_quantity": progress_by_wu.get(wu.id, 0.0),
            "certified_quantity": wu.certified_quantity
        })
    return data

@router.post("/{project_id}/import-excel")
async def import_excel(project_id: int, file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    """Importa el presupuesto desde un archivo Excel (columnas: Codigo, Nombre, Medicion, Precio Coste, Precio Venta)"""
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Formato de archivo inválido. Sube un archivo Excel (.xlsx)")
    
    contents = await file.read()
    try:
        df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error leyendo el Excel: {str(e)}")
    
    expected_cols = ["Codigo", "Nombre", "Medicion", "Precio Coste", "Precio Venta"]
    for col in expected_cols:
        if col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Falta la columna requerida: '{col}'. Revisa la plantilla.")
    
    def safe_float(val):
        import math
        try:
            if pd.isna(val) or val == "" or (isinstance(val, float) and math.isnan(val)):
                return 0.0
            return float(val)
        except:
            return 0.0

    imported_count = 0
    for index, row in df.iterrows():
        if pd.isna(row["Codigo"]) or str(row["Codigo"]).strip() == "nan" or str(row["Codigo"]).strip() == "":
            continue

        codigo_str = str(row["Codigo"])
        capitulo = codigo_str.split('.')[0] if '.' in codigo_str else codigo_str

        wu = models.WorkUnit(
            project_id=project_id,
            chapter=capitulo,
            code=codigo_str,
            name=str(row["Nombre"]) if pd.notna(row["Nombre"]) else "",
            measurement=safe_float(row["Medicion"]),
            target_cost_price=safe_float(row["Precio Coste"]),
            sale_price=safe_float(row["Precio Venta"])
        )
        db.add(wu)
        imported_count += 1
        
    db.commit()
    return {"message": f"✅ Éxito: Se han importado {imported_count} unidades de obra al proyecto."}

@router.post("/{project_id}/import-contracts")
async def import_contracts(project_id: int, file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    """Importa contratos desde un archivo Excel (columnas: Proveedor, Concepto, Precio Unitario)"""
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Formato de archivo inválido. Sube un archivo Excel (.xlsx)")
    
    contents = await file.read()
    try:
        df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error leyendo el Excel: {str(e)}")
    
    # Tolerancia en los nombres de las columnas
    expected_cols = ["Proveedor", "Concepto", "Precio Unitario"]
    # Comprobar si existen (case insensitive o aproximado, pero por ahora exacto)
    for col in expected_cols:
        if col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Falta la columna requerida: '{col}'. Revisa la plantilla.")
    
    def safe_float(val):
        import math
        try:
            if pd.isna(val) or val == "" or (isinstance(val, float) and math.isnan(val)):
                return 0.0
            return float(val)
        except:
            return 0.0

    imported_count = 0
    for index, row in df.iterrows():
        provider = str(row["Proveedor"]).strip()
        concept = str(row["Concepto"]).strip()
        
        if pd.isna(row["Proveedor"]) or provider == "nan" or provider == "":
            continue
            
        c = models.Contract(
            project_id=project_id,
            provider=provider,
            concept=concept if pd.notna(row["Concepto"]) and concept != "nan" else "Sin Concepto",
            unit_price=safe_float(row["Precio Unitario"])
        )
        db.add(c)
        imported_count += 1
        
    db.commit()
    return {"message": f"✅ Éxito: Se han importado {imported_count} líneas de contrato."}

@router.post("/{project_id}/import-bc3")
async def import_bc3(project_id: int, file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    """Importa el presupuesto básico desde un archivo FIEBDC-3 (.bc3)"""
    if not file.filename.lower().endswith('.bc3'):
        raise HTTPException(status_code=400, detail="Formato de archivo inválido. Sube un archivo .bc3")
    
    contents = await file.read()
    try:
        text = contents.decode("windows-1252") # BC3 standard encoding
    except:
        text = contents.decode("utf-8")
        
    lines = text.split("\n")
    imported_count = 0
    
    for line in lines:
        if line.startswith("~C|"):
            parts = line.split("|")[1].split("#")
            if len(parts) >= 6:
                codigo = parts[0].replace("\\", "")
                resumen = parts[2]
                try:
                    precio_coste = float(parts[5].replace(',', '.')) if parts[5] else 0.0
                except:
                    precio_coste = 0.0
                
                # Filtro muy básico: ignorar raíces cortas, quedarse con partidas
                if len(codigo) >= 4:
                    wu = models.WorkUnit(
                        project_id=project_id,
                        chapter=codigo[:2],
                        code=codigo,
                        name=resumen[:100],
                        measurement=1.0, # Calculable en un parser BC3 completo mediante el árbol ~D
                        target_cost_price=precio_coste,
                        sale_price=precio_coste * 1.10 # Margen estimado del 10%
                    )
                    db.add(wu)
                    imported_count += 1
                    
    db.commit()
    return {"message": f"Éxito: Se han procesado {imported_count} conceptos del archivo BC3."}

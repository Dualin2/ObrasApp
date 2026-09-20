from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, DateTime, Enum
from sqlalchemy.orm import declarative_base, relationship
import enum

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String)  # 'master', 'jefe_obra', 'encargado'

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    certification_amount = Column(Float, default=0.0)

    work_units = relationship("WorkUnit", back_populates="project")
    delivery_notes = relationship("DeliveryNote", back_populates="project")

class Contract(Base):
    __tablename__ = "contracts"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    provider = Column(String)
    concept = Column(String)
    unit_price = Column(Float)
    
    delivery_notes = relationship("DeliveryNote", back_populates="contract")

class WorkUnit(Base):
    __tablename__ = "work_units"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    chapter = Column(String)
    code = Column(String, index=True)
    name = Column(String)
    measurement = Column(Float, default=0.0)
    target_cost_price = Column(Float, default=0.0)
    sale_price = Column(Float, default=0.0)
    certified_quantity = Column(Float, default=0.0)
    
    project = relationship("Project", back_populates="work_units")
    allocations = relationship("CostAllocation", back_populates="work_unit")
    progresses = relationship("DailyProgress", back_populates="work_unit")

class DeliveryNote(Base):
    __tablename__ = "delivery_notes"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=True)
    date = Column(Date, default=date.today)
    provider = Column(String)
    material_description = Column(String)
    total_quantity = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)
    receipt_image = Column(String, nullable=True)
    
    project = relationship("Project", back_populates="delivery_notes")
    contract = relationship("Contract", back_populates="delivery_notes")
    allocations = relationship("CostAllocation", back_populates="delivery_note")

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    date = Column(Date, default=date.today)
    incident_type = Column(String)
    description = Column(String)
    
    project = relationship("Project")

class CostAllocation(Base):
    __tablename__ = "cost_allocations"
    id = Column(Integer, primary_key=True, index=True)
    delivery_note_id = Column(Integer, ForeignKey("delivery_notes.id"))
    work_unit_id = Column(Integer, ForeignKey("work_units.id"))
    allocated_quantity = Column(Float, default=0.0)
    allocated_percentage = Column(Float, default=0.0)
    allocated_cost = Column(Float, default=0.0)

    delivery_note = relationship("DeliveryNote", back_populates="allocations")
    work_unit = relationship("WorkUnit", back_populates="allocations")

class DailyProgress(Base):
    __tablename__ = "daily_progresses"
    id = Column(Integer, primary_key=True, index=True)
    work_unit_id = Column(Integer, ForeignKey("work_units.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(Date, default=date.today)
    executed_quantity = Column(Float, default=0.0)
    notes = Column(String, nullable=True)

    work_unit = relationship("WorkUnit", back_populates="progresses")
    user = relationship("User")

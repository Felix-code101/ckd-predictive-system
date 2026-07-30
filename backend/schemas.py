from pydantic import BaseModel, Field
from typing import Optional

class PatientDataSchema(BaseModel):
    # Demographics
    age: float = Field(..., ge=18, le=120, example=58.0)
    gender: str = Field(..., example="Male")  # "Male" or "Female"

    # Body Metrics & Vitals
    bmi: float = Field(..., ge=10.0, le=70.0, example=28.5)
    weight_kg: float = Field(..., ge=30.0, le=250.0, example=82.0)
    height_cm: float = Field(..., ge=100.0, le=220.0, example=170.0)
    bp_systolic: float = Field(..., ge=60.0, le=240.0, example=135.0)
    bp_diastolic: float = Field(..., ge=40.0, le=140.0, example=85.0)

    # Serum Chemistry
    serum_creatinine: float = Field(..., ge=0.2, le=15.0, example=1.4)
    blood_urea_nitrogen: float = Field(..., ge=2.0, le=100.0, example=22.0)
    albumin_serum: float = Field(..., ge=1.0, le=6.0, example=4.1)
    phosphorus: float = Field(..., ge=1.0, le=10.0, example=3.6)
    bicarbonate: float = Field(..., ge=10.0, le=40.0, example=24.0)
    calcium: float = Field(..., ge=5.0, le=15.0, example=9.2)
    uric_acid: float = Field(..., ge=1.0, le=15.0, example=6.5)
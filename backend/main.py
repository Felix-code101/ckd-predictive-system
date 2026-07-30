import os
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

try:
    from backend.schemas import PatientDataSchema
except ImportError:
    from schemas import PatientDataSchema

app = FastAPI(
    title="CKD Clinical Decision Support API",
    version="1.0.0",
    description="RESTful API for Chronic Kidney Disease Screening"
)

# Enable CORS for browser integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

artifacts = {}

@app.on_event("startup")
def load_artifacts():
    try:
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        artifact_path = os.path.join(base_dir, "model_artifacts")

        if not os.path.exists(artifact_path):
            artifact_path = "model_artifacts"

        artifacts["model"] = joblib.load(os.path.join(artifact_path, "best_ckd_model.joblib"))
        artifacts["imputer"] = joblib.load(os.path.join(artifact_path, "knn_imputer.joblib"))
        artifacts["scaler"] = joblib.load(os.path.join(artifact_path, "minmax_scaler.joblib"))
        artifacts["encoders"] = joblib.load(os.path.join(artifact_path, "label_encoders.joblib"))
        artifacts["feature_names"] = joblib.load(os.path.join(artifact_path, "feature_names.joblib"))
        print("✓ All 5 model artifacts loaded into memory.")
    except Exception as e:
        print(f"❌ Error loading artifacts: {e}")

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "artifacts_loaded": len(artifacts) == 5
    }

@app.post("/predict", status_code=status.HTTP_200_OK)
def predict_ckd(patient: PatientDataSchema):
    if len(artifacts) < 5:
        raise HTTPException(status_code=500, detail="Server artifacts not loaded properly.")

    try:
        input_dict = patient.dict()
        df_input = pd.DataFrame([input_dict])

        # Reorder columns to match training schema
        feature_cols = artifacts["feature_names"]
        df_input = df_input.reindex(columns=feature_cols)

        # Apply saved label encoders
        encoders = artifacts["encoders"]
        for col, le in encoders.items():
            if col in df_input.columns:
                val = str(df_input[col].iloc[0])
                if val in le.classes_:
                    df_input[col] = le.transform([val])[0]
                else:
                    df_input[col] = 0

        # Apply KNN Imputer and Min-Max Scaler
        transformed_features = artifacts["scaler"].transform(
            artifacts["imputer"].transform(df_input)
        )

        # Execute Model Inference
        model = artifacts["model"]
        prediction = int(model.predict(transformed_features)[0])
        probability = float(model.predict_proba(transformed_features)[0][1])

        # Risk Tier Classification
        if probability >= 0.70:
            risk_tier = "High Risk"
            recommendation = "Immediate nephrology referral and comprehensive renal panel recommended."
        elif probability >= 0.35:
            risk_tier = "Moderate Risk"
            recommendation = "Schedule follow-up renal monitoring in 3–6 months; monitor BP and glucose."
        else:
            risk_tier = "Low Risk"
            recommendation = "Maintain routine annual health screening."

        return {
            "prediction": prediction,
            "probability_score": round(probability, 4),
            "risk_tier": risk_tier,
            "clinical_recommendation": recommendation,
            "disclaimer": "Decision support output only. Does not substitute professional diagnosis."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
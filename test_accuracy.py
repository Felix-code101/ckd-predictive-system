import joblib
import pandas as pd
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
from sklearn.model_selection import train_test_split


def test_model_accuracy():  # <-- Renamed to start with 'test_' for pytest
    print("\n--- Loading Test Data and Serialized Model ---")

    # 1. Load serialized model artifacts
    model = joblib.load("model_artifacts/best_ckd_model.joblib")
    imputer = joblib.load("model_artifacts/knn_imputer.joblib")
    scaler = joblib.load("model_artifacts/minmax_scaler.joblib")
    encoders = joblib.load("model_artifacts/label_encoders.joblib")

    # 2. Re-load NHANES dataset and reconstruct 30% test split
    df = pd.read_csv("CKD_NHANES_2021_2023.csv").dropna(subset=['egfr'])

    cols_to_drop = [
        'participant_id', 'egfr', 'ckd_stage', 'ckd_present',
        'albumin_creatinine_ratio', 'urine_albumin', 'urine_creatinine',
        'diabetes_diagnosed', 'insulin_use', 'diabetes_pills',
        'ever_smoked', 'current_smoker',
        'ethnicity', 'education_level', 'poverty_income_ratio'
    ]

    X = df.drop(columns=cols_to_drop)
    y = df['ckd_present']

    _, X_test, _, y_test = train_test_split(
        X, y, test_size=0.30, random_state=42, stratify=y
    )

    # 3. Apply exact transformations to X_test
    for col, le in encoders.items():
        if col in X_test.columns:
            X_test[col] = le.transform(X_test[col].astype(str))

    X_test_scaled = scaler.transform(imputer.transform(X_test))

    # 4. Predict
    y_pred = model.predict(X_test_scaled)
    y_proba = model.predict_proba(X_test_scaled)[:, 1]

    # 5. Output Evaluation Report
    auc = roc_auc_score(y_test, y_proba)
    print("\n================ MODEL ACCURACY REPORT ================")
    print(f"Confusion Matrix:\n{confusion_matrix(y_test, y_pred)}")
    print(f"\nROC-AUC Score: {auc:.4f}")
    print("\nDetailed Classification Metrics:")
    print(classification_report(y_test, y_pred, target_names=["No CKD (0)", "CKD Present (1)"]))

    # Assertion for pytest pass/fail check
    assert auc > 0.85, f"Expected ROC-AUC > 0.85, got {auc}"


if __name__ == "__main__":
    test_model_accuracy()
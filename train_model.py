import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
from sklearn.impute import KNNImputer
from sklearn.utils import resample

from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score, accuracy_score


def run_training_pipeline(csv_path: str = "CKD_NHANES_2021_2023.csv"):
    print(f"--- 1. Ingesting Dataset: {csv_path} ---")
    df = pd.read_csv(csv_path)

    # Filter to participants with valid lab data
    df_valid = df.dropna(subset=['egfr']).copy()
    print(f"Valid Cohort Records: {df_valid.shape[0]}")

    os.makedirs("model_artifacts", exist_ok=True)

    # --- 2. Separate Target Y and Predictor Matrix X ---
    y = df_valid['ckd_present']

    # Drop target leaks, identifiers, questionnaire fields, and socioeconomic attributes
    cols_to_drop = [
        # Identifiers & Target Leaks
        'participant_id', 'egfr', 'ckd_stage', 'ckd_present',
        'albumin_creatinine_ratio', 'urine_albumin', 'urine_creatinine',
        # Questionnaire History
        'diabetes_diagnosed', 'insulin_use', 'diabetes_pills',
        'ever_smoked', 'current_smoker',
        # Removed Social / Demographic Variables
        'ethnicity', 'education_level', 'poverty_income_ratio'
    ]

    X = df_valid.drop(columns=cols_to_drop)
    print(f"\nFinal Predictor Count: {X.shape[1]} attributes")
    print(f"Predictors: {list(X.columns)}")

    # --- 3. Stratified Train-Test Split (70/30) ---
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.30, random_state=42, stratify=y
    )

    # --- 4. Preprocessing Pipeline ---
    # Categorical Label Encoders
    label_encoders = {}
    categorical_cols = X_train.select_dtypes(include=['object', 'category']).columns

    for col in categorical_cols:
        le = LabelEncoder()
        X_train[col] = le.fit_transform(X_train[col].astype(str))
        X_test[col] = le.transform(X_test[col].astype(str))
        label_encoders[col] = le

    joblib.dump(label_encoders, "model_artifacts/label_encoders.joblib")

    # KNN Imputer (k=5)
    imputer = KNNImputer(n_neighbors=5)
    X_train_imp = imputer.fit_transform(X_train)
    X_test_imp = imputer.transform(X_test)
    joblib.dump(imputer, "model_artifacts/knn_imputer.joblib")

    # Min-Max Scaler
    scaler = MinMaxScaler()
    X_train_scaled = scaler.fit_transform(X_train_imp)
    X_test_scaled = scaler.transform(X_test_imp)
    joblib.dump(scaler, "model_artifacts/minmax_scaler.joblib")

    # Save Feature Order List
    joblib.dump(list(X.columns), "model_artifacts/feature_names.joblib")

    # --- 5. Class Balancing on Training Set Only ---
    X_train_df = pd.DataFrame(X_train_scaled)
    X_train_df['target'] = y_train.values

    df_majority = X_train_df[X_train_df['target'] == 0]
    df_minority = X_train_df[X_train_df['target'] == 1]

    df_minority_upsampled = resample(
        df_minority,
        replace=True,
        n_samples=len(df_majority),
        random_state=42
    )

    df_upsampled = pd.concat([df_majority, df_minority_upsampled])
    X_train_res = df_upsampled.drop(columns=['target']).values
    y_train_res = df_upsampled['target'].values

    # --- 6. Model Training & Evaluation ---
    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
        "Support Vector Machine": SVC(probability=True, random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)
    }

    best_model, best_auc, best_name = None, 0.0, ""

    for name, clf in models.items():
        clf.fit(X_train_res, y_train_res)
        y_pred = clf.predict(X_test_scaled)
        y_proba = clf.predict_proba(X_test_scaled)[:, 1]

        acc = accuracy_score(y_test, y_pred)
        auc = roc_auc_score(y_test, y_proba)

        print(f"\n================ {name} ================")
        print(f"Test Accuracy: {acc * 100:.2f}% | ROC-AUC: {auc:.4f}")
        print(classification_report(y_test, y_pred))

        if auc > best_auc:
            best_auc, best_model, best_name = auc, clf, name

    print(f"\n---> Selected Optimal Model: {best_name} (ROC-AUC: {best_auc:.4f})")
    joblib.dump(best_model, "model_artifacts/best_ckd_model.joblib")
    print("✓ All 5 artifacts saved to 'model_artifacts/' directory.")


if __name__ == "__main__":
    run_training_pipeline()
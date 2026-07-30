const API_URL = "https://ckd-predictive-system.onrender.com";

const REFERENCE_RANGES = {
    bp_systolic: { name: "Systolic Blood Pressure", min: 90, max: 120, unit: "mmHg" },
    serum_creatinine: { name: "Serum Creatinine", min: 0.6, max: 1.2, unit: "mg/dL" },
    blood_urea_nitrogen: { name: "Blood Urea Nitrogen (BUN)", min: 7, max: 20, unit: "mg/dL" },
    albumin_serum: { name: "Serum Albumin", min: 3.5, max: 5.5, unit: "g/dL" },
    bicarbonate: { name: "Serum Bicarbonate", min: 22, max: 29, unit: "mEq/L" },
    phosphorus: { name: "Phosphorus", min: 2.5, max: 4.5, unit: "mg/dL" },
    calcium: { name: "Serum Calcium", min: 8.5, max: 10.2, unit: "mg/dL" },
    uric_acid: { name: "Uric Acid", min: 3.5, max: 7.2, unit: "mg/dL" },
    bmi: { name: "Body Mass Index", min: 18.5, max: 24.9, unit: "kg/m²" }
};

const FEATURE_IMPORTANCES = [
    { name: "Serum Creatinine", weight: 24.5 },
    { name: "Blood Urea Nitrogen", weight: 18.2 },
    { name: "Age", weight: 14.7 },
    { name: "Serum Albumin", weight: 11.3 },
    { name: "Systolic Blood Pressure", weight: 9.4 },
    { name: "Uric Acid", weight: 7.8 },
    { name: "Body Mass Index", weight: 5.6 },
    { name: "Serum Bicarbonate", weight: 4.8 }
];

document.addEventListener("DOMContentLoaded", () => {
    const landingView = document.getElementById("landingView");
    const formView = document.getElementById("formView");
    const resultsDashboard = document.getElementById("resultsDashboard");

    const weightInput = document.getElementById("weight_kg");
    const heightInput = document.getElementById("height_cm");
    const bmiInput = document.getElementById("bmi");

    // Auto-calculate BMI
    function calculateBMI() {
        const w = parseFloat(weightInput.value);
        const h = parseFloat(heightInput.value) / 100;
        if (w > 0 && h > 0) {
            bmiInput.value = (w / (h * h)).toFixed(1);
        }
    }
    weightInput.addEventListener("input", calculateBMI);
    heightInput.addEventListener("input", calculateBMI);
    calculateBMI();

    // Direct Assessment Navigation
    function openAssessmentForm() {
        landingView.classList.add("hidden");
        resultsDashboard.classList.add("hidden");
        formView.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    document.getElementById("startAssessmentBtn").addEventListener("click", openAssessmentForm);
    document.getElementById("navAssessmentLink").addEventListener("click", (e) => {
        e.preventDefault();
        openAssessmentForm();
    });

    document.getElementById("backToLandingBtn").addEventListener("click", () => {
        formView.classList.add("hidden");
        landingView.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.getElementById("backBtn").addEventListener("click", () => {
        resultsDashboard.classList.add("hidden");
        formView.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Quick Demo Buttons
    document.getElementById("demoCkdBtn").addEventListener("click", () => {
        fillFormValues({
            age: 68, gender: "Male", weight: 88, height: 168,
            systolic: 155, diastolic: 95, creatinine: 2.8, bun: 45,
            albumin: 3.1, phosphorus: 5.2, bicarbonate: 18, calcium: 8.2, uric: 8.9
        });
        openAssessmentForm();
    });

    document.getElementById("demoHealthyBtn").addEventListener("click", () => {
        fillFormValues({
            age: 32, gender: "Female", weight: 62, height: 165,
            systolic: 115, diastolic: 75, creatinine: 0.8, bun: 12,
            albumin: 4.5, phosphorus: 3.6, bicarbonate: 25, calcium: 9.4, uric: 4.8
        });
        openAssessmentForm();
    });

    function fillFormValues(v) {
        document.getElementById("age").value = v.age;
        document.getElementById("gender").value = v.gender;
        document.getElementById("weight_kg").value = v.weight;
        document.getElementById("height_cm").value = v.height;
        document.getElementById("bp_systolic").value = v.systolic;
        document.getElementById("bp_diastolic").value = v.diastolic;
        document.getElementById("serum_creatinine").value = v.creatinine;
        document.getElementById("blood_urea_nitrogen").value = v.bun;
        document.getElementById("albumin_serum").value = v.albumin;
        document.getElementById("phosphorus").value = v.phosphorus;
        document.getElementById("bicarbonate").value = v.bicarbonate;
        document.getElementById("calcium").value = v.calcium;
        document.getElementById("uric_acid").value = v.uric;
        calculateBMI();
    }

    // Form Submit Handler
    document.getElementById("ckdForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById("submitBtn");
        submitBtn.innerText = "Analyzing Clinical Data...";
        submitBtn.disabled = true;

        const payload = {
            age: parseFloat(document.getElementById("age").value),
            gender: document.getElementById("gender").value,
            bmi: parseFloat(document.getElementById("bmi").value),
            weight_kg: parseFloat(document.getElementById("weight_kg").value),
            height_cm: parseFloat(document.getElementById("height_cm").value),
            bp_systolic: parseFloat(document.getElementById("bp_systolic").value),
            bp_diastolic: parseFloat(document.getElementById("bp_diastolic").value),
            serum_creatinine: parseFloat(document.getElementById("serum_creatinine").value),
            blood_urea_nitrogen: parseFloat(document.getElementById("blood_urea_nitrogen").value),
            albumin_serum: parseFloat(document.getElementById("albumin_serum").value),
            phosphorus: parseFloat(document.getElementById("phosphorus").value),
            bicarbonate: parseFloat(document.getElementById("bicarbonate").value),
            calcium: parseFloat(document.getElementById("calcium").value),
            uric_acid: parseFloat(document.getElementById("uric_acid").value)
        };

        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
            const data = await res.json();

            renderDashboard(data, payload);

            formView.classList.add("hidden");
            resultsDashboard.classList.remove("hidden");
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err) {
            console.error(err);
            alert("Connection Error: Ensure your Uvicorn backend server is running on port 8000.");
        } finally {
            submitBtn.innerText = "Execute Prediction Analysis";
            submitBtn.disabled = false;
        }
    });

    function renderDashboard(data, inputs) {
        const ckdProb = Math.round(data.probability_score * 100);
        const healthyProb = 100 - ckdProb;
        const isCKD = data.prediction === 1;

        const heroCard = document.getElementById("heroCard");
        const pillTag = document.getElementById("pillTag");
        const heroTitle = document.getElementById("heroTitle");
        const heroDesc = document.getElementById("heroDesc");

        if (isCKD) {
            heroCard.className = "dash-card card-hero hero-detected";
            pillTag.innerText = "PREDICTION RESULT";
            heroTitle.innerText = "CKD Detected";
            heroDesc.innerText = "The model indicates an elevated probability of Chronic Kidney Disease. Clinical evaluation recommended.";
        } else {
            heroCard.className = "dash-card card-hero hero-healthy";
            pillTag.innerText = "PREDICTION RESULT";
            heroTitle.innerText = "No CKD Detected";
            heroDesc.innerText = "The model indicates a low probability of Chronic Kidney Disease. Continue routine clinical monitoring.";
        }

        const scoreCircle = document.querySelector(".score-circle");
        const scoreSub = document.getElementById("scoreSub");
        document.getElementById("healthScore").innerText = healthyProb;

        if (healthyProb >= 80) {
            scoreCircle.style.borderColor = "#10b981";
            scoreSub.innerText = "Optimal renal health indicators";
            scoreSub.style.color = "#10b981";
        } else if (healthyProb >= 50) {
            scoreCircle.style.borderColor = "#f59e0b";
            scoreSub.innerText = "Moderate renal health indicators";
            scoreSub.style.color = "#f59e0b";
        } else {
            scoreCircle.style.borderColor = "#ef4444";
            scoreSub.innerText = "Multiple concerning indicators";
            scoreSub.style.color = "#ef4444";
        }

        const gaugeBody = document.getElementById("gaugeBody");
        const fillDegrees = (ckdProb / 100) * 180;

        let fillColor = "#10b981";
        if (ckdProb >= 70) fillColor = "#ef4444";
        else if (ckdProb >= 35) fillColor = "#f59e0b";

        gaugeBody.style.background = `conic-gradient(from 270deg at 50% 50%, ${fillColor} 0deg ${fillDegrees}deg, #e2e8f0 ${fillDegrees}deg 180deg, transparent 180deg 360deg)`;

        document.getElementById("gaugeProbText").innerText = `${ckdProb}%`;
        document.getElementById("gaugeRiskTier").innerText = data.risk_tier;

        document.getElementById("ckdRiskPct").innerText = `${ckdProb}%`;
        document.getElementById("healthyRiskPct").innerText = `${healthyProb}%`;
        document.getElementById("ckdRiskBar").style.width = `${ckdProb}%`;
        document.getElementById("healthyRiskBar").style.width = `${healthyProb}%`;

        const alertBanner = document.getElementById("alertBanner");
        if (data.risk_tier === "High Risk") {
            alertBanner.className = "alert-banner banner-high";
            alertBanner.innerText = "🔴 High Risk — Strong indicators of CKD present";
        } else if (data.risk_tier === "Moderate Risk") {
            alertBanner.className = "alert-banner banner-mod";
            alertBanner.innerText = "🟠 Moderate Risk — Elevated clinical indicators";
        } else {
            alertBanner.className = "alert-banner banner-low";
            alertBanner.innerText = "🟢 Low Risk — Indicators within normal ranges";
        }

        document.getElementById("sumRiskScore").innerText = `${ckdProb}%`;
        document.getElementById("sumCreatinine").innerText = `${inputs.serum_creatinine} mg/dL`;
        document.getElementById("sumBP").innerText = `${inputs.bp_systolic}/${inputs.bp_diastolic} mmHg`;
        document.getElementById("sumBUN").innerText = `${inputs.blood_urea_nitrogen} mg/dL`;

        const stepsList = document.getElementById("stepsList");
        if (data.risk_tier === "High Risk") {
            stepsList.innerHTML = `
                <li>Order diagnostic renal imaging and full panel</li>
                <li>Schedule urgent nephrology consultation</li>
                <li>Evaluate medication dosage and nephrotoxicity</li>
            `;
        } else if (data.risk_tier === "Moderate Risk") {
            stepsList.innerHTML = `
                <li>Schedule follow-up renal panel in 3–6 months</li>
                <li>Optimize hypertension and diabetes interventions</li>
                <li>Advise lifestyle and dietary modification</li>
            `;
        } else {
            stepsList.innerHTML = `
                <li>Maintain annual health and laboratory screening</li>
                <li>Re-evaluate upon development of clinical symptoms</li>
                <li>Maintain standard lifestyle recommendations</li>
            `;
        }

        const paramGrid = document.getElementById("paramGrid");
        paramGrid.innerHTML = "";

        Object.keys(REFERENCE_RANGES).forEach((key) => {
            const ref = REFERENCE_RANGES[key];
            const val = inputs[key];
            let status = "GOOD";
            let statusClass = "good";
            let icon = "✓";

            if (val < ref.min || val > ref.max) {
                if (key === "serum_creatinine" || key === "bp_systolic" || key === "blood_urea_nitrogen") {
                    status = "POOR";
                    statusClass = "poor";
                    icon = "✕";
                } else {
                    status = "MODERATE";
                    statusClass = "mod";
                    icon = "!";
                }
            }

            paramGrid.innerHTML += `
                <div class="param-card">
                    <div class="param-left">
                        <div class="param-icon icon-${statusClass}">${icon}</div>
                        <div>
                            <div class="param-title">${ref.name}</div>
                            <div class="param-sub">Value: ${val} · Range: ${ref.min}–${ref.max}</div>
                        </div>
                    </div>
                    <span class="param-badge badge-${statusClass}">${status}</span>
                </div>
            `;
        });

        const factorsList = document.getElementById("factorsList");
        factorsList.innerHTML = "";

        FEATURE_IMPORTANCES.forEach((item) => {
            factorsList.innerHTML += `
                <div class="factor-row">
                    <span class="factor-name">${item.name}</span>
                    <div class="factor-track">
                        <div class="factor-fill" style="width: ${item.weight * 3.5}%;"></div>
                    </div>
                    <span class="factor-val">${item.weight}%</span>
                </div>
            `;
        });
    }
});
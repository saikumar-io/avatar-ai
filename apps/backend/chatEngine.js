// ===============================
// STEP CONFIGURATION
// ===============================

const STEPS = [
    { key: 'personalDetails.name', type: 'text', question: 'What is your full name?' },
    { key: 'personalDetails.dob', type: 'date', question: 'What is your date of birth? (YYYY-MM-DD)' },
    { key: 'personalDetails.phone', type: 'phone', question: 'What is your phone number?' },
    { key: 'personalDetails.email', type: 'email', question: 'What is your email address?' },
    { key: 'personalDetails.aadhaar', type: 'aadhaar', question: 'What is your Aadhaar number? (12 digits)' },
    { key: 'personalDetails.pan', type: 'pan', question: 'What is your PAN number? (e.g., ABCDE1234F)' },

    { key: 'employmentDetails.type', type: 'text', question: 'What is your employment type? ("salaried", "self-employed", "business", "other")' },
    { key: 'employmentDetails.company', type: 'text', question: 'What is your company name?' },
    { key: 'employmentDetails.income', type: 'number', question: 'What is your monthly income (₹)?' },

    { key: 'loanDetails.amount', type: 'number', question: 'How much loan amount do you need?' },
    { key: 'loanDetails.tenure', type: 'number', question: 'What tenure (months)?' },
];

// ===============================
// IN-MEMORY SESSION STORE
// ===============================

const sessions = new Map();

function getSession(userId) {
    if (!sessions.has(userId)) {
        sessions.set(userId, {
            currentStep: 0,
            started: false,
            collectedData: {},
        });
    }
    return sessions.get(userId);
}

function resetSession(userId) {
    sessions.delete(userId);
}

// ===============================
// VALIDATION
// ===============================

function validateInput(type, value) {
    const v = String(value).trim();

    if (!v) {
        return { valid: false, message: "This field is required." };
    }

    switch (type) {
        case "text":
            return v.length >= 2
                ? { valid: true }
                : { valid: false, message: "Please enter at least 2 characters." };

        case "email":
            return /^\S+@\S+\.\S+$/.test(v)
                ? { valid: true }
                : { valid: false, message: "Please enter a valid email address." };

        case "phone":
            return /^\+?[\d\s\-()]{7,15}$/.test(v)
                ? { valid: true }
                : { valid: false, message: "Please enter a valid phone number." };

        case "date":
            return /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v))
                ? { valid: true }
                : { valid: false, message: "Date must be in YYYY-MM-DD format." };

        case "aadhaar":
            return /^\d{12}$/.test(v)
                ? { valid: true }
                : { valid: false, message: "Aadhaar must be exactly 12 digits." };

        case "pan":
            return /^[A-Z]{5}\d{4}[A-Z]$/.test(v.toUpperCase())
                ? { valid: true }
                : { valid: false, message: "PAN must be in format ABCDE1234F." };

        case "number":
            return !isNaN(Number(v)) && Number(v) >= 0
                ? { valid: true }
                : { valid: false, message: "Please enter a valid positive number." };

        default:
            return { valid: true };
    }
}

// ===============================
// NESTED OBJECT SETTER
// ===============================

function setNested(obj, path, value) {
    const parts = path.split(".");
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
    }

    current[parts[parts.length - 1]] = value;
}

// ===============================
// MAIN PROCESS FUNCTION
// ===============================

function processMessage(userId, message) {
    const session = getSession(userId);

    // If frontend sends __START__, force reset step
    if (message === "__START__") {
        session.currentStep = 0;
        session.started = true;
        session.collectedData = {};

        return {
            done: false,
            question: STEPS[0].question,
            stepIndex: 0,
            totalSteps: STEPS.length
        };
    }

    // If not started properly
    if (!session.started) {
        session.started = true;
        session.currentStep = 0;
        session.collectedData = {};

        return {
            done: false,
            question: STEPS[0].question,
            stepIndex: 0,
            totalSteps: STEPS.length
        };
    }

    const step = STEPS[session.currentStep];

    if (!step) {
        return {
            done: true,
            collectedData: session.collectedData,
            message: "All details collected. Please review and submit."
        };
    }

    const validation = validateInput(step.type, message);

    if (!validation.valid) {
        return {
            done: false,
            error: validation.message,
            question: step.question,
            stepIndex: session.currentStep,
            totalSteps: STEPS.length
        };
    }

    setNested(session.collectedData, step.key, message);
    session.currentStep++;

    if (session.currentStep >= STEPS.length) {
        return {
            done: true,
            collectedData: session.collectedData,
            message: "All details collected. Please review and submit."
        };
    }

    return {
        done: false,
        question: STEPS[session.currentStep].question,
        stepIndex: session.currentStep,
        totalSteps: STEPS.length
    };
}

export { processMessage, resetSession };
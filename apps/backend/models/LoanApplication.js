import mongoose from "mongoose";

// ===============================
// PERSONAL DETAILS
// ===============================
const personalDetailsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    dob: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    aadhaar: {
        type: String,
        required: true
    },
    pan: {
        type: String,
        required: true,
        uppercase: true
    }
}, { _id: false });


// ===============================
// EMPLOYMENT DETAILS
// ===============================
const employmentDetailsSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ["salaried", "self-employed", "business", "other"]
    },
    company: {
        type: String,
        required: true
    },
    income: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });


// ===============================
// LOAN DETAILS
// ===============================
const loanDetailsSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 1000
    },
    tenure: {
        type: Number,
        required: true,
        min: 1
    }
}, { _id: false });


// ===============================
// MAIN APPLICATION SCHEMA
// ===============================
const loanApplicationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },

    personalDetails: {
        type: personalDetailsSchema,
        required: true
    },

    employmentDetails: {
        type: employmentDetailsSchema,
        required: true
    },

    loanDetails: {
        type: loanDetailsSchema,
        required: true
    },

    status: {
        type: String,
        enum: ["draft", "submitted", "approved", "rejected"],
        default: "submitted",
        index: true
    },

    submittedAt: {
        type: Date
    }

}, { timestamps: true });


// ===============================
// MASK SENSITIVE DATA
// ===============================
loanApplicationSchema.methods.toSafeJSON = function () {
    const obj = this.toObject();

    if (obj.personalDetails?.aadhaar) {
        const a = obj.personalDetails.aadhaar;
        obj.personalDetails.aadhaar = "XXXX-XXXX-" + a.slice(-4);
    }

    if (obj.personalDetails?.pan) {
        const p = obj.personalDetails.pan;
        obj.personalDetails.pan = p.slice(0, 2) + "XXXXX" + p.slice(-2);
    }

    return obj;
};


// ===============================
// EXPORT MODEL
// ===============================
export default mongoose.model("LoanApplication", loanApplicationSchema);
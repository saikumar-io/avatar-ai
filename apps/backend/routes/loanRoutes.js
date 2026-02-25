import express from "express";
import { processMessage, resetSession } from "../chatEngine.js";
import LoanApplication from "../models/LoanApplication.js";
import nodemailer from "nodemailer";

const router = express.Router();

// ===============================
// CHAT ROUTE
// ===============================
router.post("/chat", (req, res) => {
    try {
        const userId = "demo-user"; // replace with real auth later
        const { message } = req.body;

        if (message === undefined) {
            return res.status(400).json({ error: "Message is required" });
        }

        const result = processMessage(userId, message);

        res.json(result);
    } catch (error) {
        console.error("Chat error:", error);
        res.status(500).json({ error: "Server error during chat processing" });
    }
});


// ===============================
// SUBMIT ROUTE
// ===============================
router.post("/submit", async (req, res) => {
    try {
        const userId = "demo-user";
        const { collectedData } = req.body;

        // 1️⃣ Save to Mongo
        const newApplication = new LoanApplication({
            userId,
            ...collectedData,
            status: "submitted",
            submittedAt: new Date()
        });

        await newApplication.save();

        // 2️⃣ Send Email
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: collectedData.personalDetails.email,
            subject: "Loan Application Submitted Successfully",
            html: `
                <h2>Application Received 🎉</h2>
                <p><strong>Name:</strong> ${collectedData.personalDetails.name}</p>
                <p><strong>Loan Amount:</strong> ₹${collectedData.loanDetails.amount}</p>
                <p><strong>Tenure:</strong> ${collectedData.loanDetails.tenure} months</p>
                <p>We will review your application shortly.</p>
            `
        });

        resetSession(userId);

        res.json({ message: "Application submitted successfully! Email sent." });

    } catch (error) {
        console.error("Submission error:", error);
        res.status(500).json({ error: "Failed to submit application" });
    }
});


// ===============================
// RESET SESSION ROUTE
// ===============================
router.post("/reset-session", (req, res) => {
    try {
        const userId = "demo-user";
        resetSession(userId);

        res.json({ message: "Session cleared successfully" });
    } catch (error) {
        console.error("Reset error:", error);
        res.status(500).json({ error: "Failed to reset session" });
    }
});

export default router;
import express from "express";
import { processMessage, resetSession } from "../chatEngine.js";
import LoanApplication from "../models/LoanApplication.js";

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
    const userId = "demo-user";
    const { collectedData } = req.body;

    const newApplication = new LoanApplication({
        userId,
        ...collectedData,
        status: "submitted"
    });

    await newApplication.save();
    resetSession(userId);

    res.json({ message: "Application submitted successfully!" });
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
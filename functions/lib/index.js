"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeHealth = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
exports.analyzeHealth = functions.https.onRequest(async (req, res) => {
    // Handle CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    // Handle OPTIONS request
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    // Only accept POST requests
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }
    try {
        if (!ANTHROPIC_API_KEY) {
            res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
            return;
        }
        const { age, sex, smokingStatus, familyIllness, breathRate, aqi, pm25 } = req.body;
        const systemPrompt = `You are a preventive health AI assistant. Analyze biometric and environmental data and return ONLY valid JSON (no markdown, no preamble). Response shape:
{
  "summary": "<2-3 sentence summary>",
  "insights": [{ "title": "<short title>", "body": "<1-2 sentence insight>", "severity": "info|warning|danger|good" }],
  "riskFactors": [{ "name": "<factor>", "status": "good|warning|danger", "note": "<short note>" }],
  "recommendations": ["<recommendation>", ...]
}`;
        const userPrompt = `Analyze this health profile:
Age: ${age} years, Sex: ${sex}, Smoking: ${smokingStatus}, Family History: ${familyIllness ? "Yes" : "No"}
Breath Rate: ${breathRate} bpm, AQI: ${aqi || "N/A"}, PM2.5: ${pm25?.toFixed(1) || "N/A"} µg/m³
PM10: ~${Math.round(pm25 ? pm25 * 1.5 : 45)}, NO₂: ~${Math.floor(Math.random() * 60)}, O₃: ~${Math.floor(Math.random() * 80)}`;
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model: "claude-opus-4-1-20250805",
                max_tokens: 800,
                system: systemPrompt,
                messages: [{ role: "user", content: userPrompt }],
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            console.error("Anthropic error:", response.status, error);
            res.status(500).json({ error: `Anthropic API error: ${response.status}` });
            return;
        }
        const rawData = await response.json();
        const text = rawData.content?.find((b) => b.type === "text")?.text || "{}";
        const cleaned = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        res.json(parsed);
    }
    catch (error) {
        console.error("Health analysis error:", error);
        res.status(500).json({ error: error.message });
    }
});
//# sourceMappingURL=index.js.map
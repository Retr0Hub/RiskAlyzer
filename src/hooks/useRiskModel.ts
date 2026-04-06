import { useState, useCallback } from 'react'

export type RiskAnalysisResult = {
  overallRisk: 'Low' | 'Moderate' | 'High' | 'Critical'
  overallRiskScore: number
  percentageRiskIncrease: number
  summary: string
  insights: Array<{
    title: string
    body: string
    severity: 'info' | 'warning' | 'danger' | 'good'
  }>
  riskFactors: Array<{
    name: string
    status: 'good' | 'warning' | 'danger'
    adjustment: number | null
    note: string
  }>
  recommendations: string[]
  breathingStatus: string
  aqiStatus: string
}

export type PatientHealthData = {
  age: number
  sex: string
  smoker: boolean
  familyHistory: boolean
  breathRate: number // the 'interval of breath' from ESP, interpreted as Breath Rate in bpm
  breathTemp: number // the temp of breath from ESP in Celsius
  aqi: number
  pm25: number
  pm10: number
  no2: number
  o3: number
}

function buildSystemPrompt() {
  return `You are a preventive health AI assistant embedded in a personal health risk dashboard. 
You analyze biometric (including ESP sensor data like breath rate and breath temperature) and environmental data and return structured JSON health insights.

ALWAYS respond with ONLY a valid JSON object — no markdown, no preamble. The shape must be:

{
  "overallRisk": "Low" | "Moderate" | "High" | "Critical",
  "overallRiskScore": <integer 0-100>,
  "percentageRiskIncrease": <number, e.g. +15.5 or -5.0>,
  "summary": "<2-3 sentence plain-English summary of the person's health risk profile>",
  "insights": [
    { "title": "<short title>", "body": "<1-2 sentence insight>", "severity": "info" | "warning" | "danger" | "good" }
  ],
  "riskFactors": [
    { "name": "<factor name>", "status": "good" | "warning" | "danger", "adjustment": <number or null>, "note": "<short note>" }
  ],
  "recommendations": ["<actionable recommendation string>", ...],
  "breathingStatus": "<interpretation of breath rate and breath temperature, e.g. Normal, Slightly Elevated rate, Abnormal temperature>",
  "aqiStatus": "<interpretation: Good, Moderate, Unhealthy for Sensitive Groups, Unhealthy, Very Unhealthy, Hazardous>"
}

Guidelines:
- percentageRiskIncrease is the estimated percentage increase in overall health hazard compared to baseline (positive = higher risk, negative = lower/better risk).
- Smoking active = approximately +20 to +30% risk
- Poor AQI (>150) = approximately +5 to +10% risk
- Family history of heart disease/cancer = +10 to +20% risk
- Elevated breath rate (>20 bpm at rest) is a warning sign
- Normal breath temperature is ~34 to ~35°C; elevated (>36°C) can suggest inflammation/fever.
- Be medically accurate, empathetic, non-alarmist, and always recommend consulting a doctor
- Provide 3-5 insights and 3-5 risk factors
- All estimates are illustrative and for educational purposes only`
}

function buildUserPrompt(data: PatientHealthData) {
  return `Analyze this patient's health risk profile:

Age: ${data.age} years
Sex: ${data.sex}
Smoking status: ${data.smoker ? 'Active smoker' : 'Non-smoker'}
Family history of major illness: ${data.familyHistory ? 'Yes' : 'No known risk'}
ESP Sensor - Resting breath rate: ${data.breathRate} breaths/min
ESP Sensor - Breath temperature: ${data.breathTemp}°C
Air Quality Index (AQI): ${data.aqi}
PM2.5: ${data.pm25} µg/m³
PM10: ${data.pm10} µg/m³
NO₂: ${data.no2} µg/m³
O₃ (Ozone): ${data.o3} µg/m³

Generate a complete health risk analysis as a JSON object.`
}

export function useRiskModel() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RiskAnalysisResult | null>(null)

  const analyze = useCallback(async (data: PatientHealthData) => {
    setLoading(true)
    setError(null)
    setResult(null)

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (!apiKey) {
      setError('Gemini API key is missing. Please check your .env file.')
      setLoading(false)
      return
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: buildSystemPrompt() }]
          },
          contents: [{
            role: 'user',
            parts: [{ text: buildUserPrompt(data) }]
          }],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error?.message || `HTTP ${res.status} ${res.statusText}`)
      }

      const responseData = await res.json()
      const textResponse = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
      // Gemini's JSON return might still occasionally wrap in blockquotes despite the flag, trim it to be safe
      const cleaned = textResponse.replace(/```json|```/g, '').trim()
      setResult(JSON.parse(cleaned) as RiskAnalysisResult)
    } catch (e: any) {
      console.error(e)
      if (e.name === 'AbortError') {
         setError('Analysis failed: Request timed out. An extension or adblocker might be blocking the API.')
      } else {
         setError('Analysis failed: ' + (e.message || String(e)))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return { analyze, result, loading, error }
}

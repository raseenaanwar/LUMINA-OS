import { GoogleGenAI, Type } from "@google/genai";
import { EnvironmentalAnalysis } from "../types";

export const analyzeEnvironment = async (
  base64Image: string,
  dubaiTime: string,
  isLive: boolean
): Promise<EnvironmentalAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `You are LUMINA OS v3.7 - A Bio-Adaptive Architectural Intelligence Engine.

MISSION: Audit physical spaces for biological alignment and circadian support.

VOCABULARY PROTOCOL (MANDATORY):
- NEVER use time-of-day terms like "morning", "evening", "night", "noon".
- USE biologically neutral terms:
  • "Biologically activating light exposure"
  • "Alertness-promoting light spectral flux"
  • "Wake-stimulating light levels"
  • "Melanopsin-safe dimming" or "Restorative low-blue light"
- Avoid medical jargon. Keep language simple, confident, and beginner-friendly.

REASONING PROTOCOL:
1. SPATIAL ANALYSIS: Estimate spectral quality based on light sources and surface reflectivity.
2. CIRCADIAN GROUNDING: 
   - If Source is LIVE (isLive: ${isLive}), cross-reference spectral quality with Dubai GST: [${dubaiTime}].
   - If Source is UPLOADED, ignore the current clock and focus strictly on the spectral quality and bio-supportiveness of the captured frame.
3. DUBAI ECOSYSTEM: For outdoor suggestions, suggest specific locations in Dubai (e.g., Kite Beach, Creek Park, Al Qudra, JLT Park) to anchor the biological clock.
4. MATTER ACTUATION: Generate a conceptual Matter v1.3 payload that would synchronize a smart home to the "Optimized" state described.

OUTPUT REQUIREMENTS:
- Tone: Premium, futuristic, non-medical.
- Disclaimer: Always include "Analysis is based on visible light patterns. Educational estimate only." in descriptions.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image,
              },
            },
            {
              text: `EXECUTE_BIO_AUDIT: Source_${isLive ? 'LIVE' : 'UPLOAD'}. Ref_Time: [${dubaiTime}]. Provide specific Dubai location for anchoring and a Matter v1.3 sync payload.`,
            },
          ],
        },
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sleepScore: {
              type: Type.OBJECT,
              properties: {
                current: { type: Type.NUMBER },
                optimized: { type: Type.NUMBER },
                improvement: { type: Type.NUMBER },
                description: { type: Type.STRING },
              },
              required: ["current", "optimized", "improvement", "description"],
            },
            preSyncStatus: {
              type: Type.OBJECT,
              properties: {
                kelvinRange: { type: Type.STRING },
                intensityDescription: { type: Type.STRING },
                luxEquivalent: { type: Type.STRING },
                stressors: { type: Type.ARRAY, items: { type: Type.STRING } },
                mismatchDescription: { type: Type.STRING },
              },
              required: ["kelvinRange", "intensityDescription", "luxEquivalent", "stressors", "mismatchDescription"],
            },
            postSyncProjection: {
              type: Type.OBJECT,
              properties: {
                idealKelvin: { type: Type.STRING },
                targetIntensity: { type: Type.STRING },
                recoveryTime: { type: Type.STRING },
                expectedImprovement: { type: Type.STRING },
              },
              required: ["idealKelvin", "targetIntensity", "recoveryTime", "expectedImprovement"],
            },
            bioLogicImpact: {
              type: Type.OBJECT,
              properties: {
                impactAssessment: { type: Type.STRING },
                melatoninReductionRange: { type: Type.STRING },
                sleepDelayRange: { type: Type.STRING },
                citation: { type: Type.STRING },
              },
              required: ["impactAssessment", "melatoninReductionRange", "sleepDelayRange", "citation"],
            },
            wellnessForecast: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING },
                  activity: { type: Type.STRING },
                  status: { type: Type.STRING, enum: ["Optimal", "Caution", "Action Required"] },
                  rationale: { type: Type.STRING },
                },
                required: ["time", "activity", "status", "rationale"],
              },
            },
            activitySuggestion: {
              type: Type.OBJECT,
              properties: {
                location: { type: Type.STRING },
                coordinates: { type: Type.STRING },
                suggestedTime: { type: Type.STRING },
                activity: { type: Type.STRING },
                rationale: { type: Type.STRING },
              },
              required: ["location", "coordinates", "suggestedTime", "activity", "rationale"],
            },
            iotConcept: {
              type: Type.OBJECT,
              properties: {
                target: { type: Type.STRING },
                integration: { type: Type.STRING },
                protocol: { type: Type.STRING },
                status: { type: Type.STRING },
                command: {
                  type: Type.OBJECT,
                  properties: {
                    lighting: {
                      type: Type.OBJECT,
                      properties: {
                        target_kelvin: { type: Type.NUMBER },
                        target_brightness: { type: Type.NUMBER },
                        transition_mode: { type: Type.STRING },
                        duration_seconds: { type: Type.NUMBER }
                      },
                      required: ["target_kelvin", "target_brightness", "transition_mode", "duration_seconds"]
                    },
                    environment: {
                      type: Type.OBJECT,
                      properties: {
                        suggested_temperature: { type: Type.STRING },
                        air_quality_note: { type: Type.STRING },
                        noise_reduction: { type: Type.STRING }
                      },
                      required: ["suggested_temperature", "air_quality_note", "noise_reduction"]
                    },
                    devices: {
                      type: Type.OBJECT,
                      properties: {
                        screens: { type: Type.STRING },
                        smart_blinds: { type: Type.STRING },
                        ambient_sound: { type: Type.STRING }
                      },
                      required: ["screens", "smart_blinds", "ambient_sound"]
                    }
                  },
                  required: ["lighting", "environment", "devices"]
                },
              },
              required: ["target", "integration", "protocol", "status", "command"],
            },
            circadianPhase: { type: Type.STRING },
          },
          required: ["sleepScore", "preSyncStatus", "postSyncProjection", "bioLogicImpact", "wellnessForecast", "activitySuggestion", "iotConcept", "circadianPhase"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI model.");
    return JSON.parse(text) as EnvironmentalAnalysis;
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

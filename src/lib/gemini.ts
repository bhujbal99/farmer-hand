import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, SoilData } from "../types";

const getAiClient = () => {
  // Try both GEMINI_API_KEY and GEMINI_KEY fallback
  const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY;
  
  const isValid = (key: string) => key && key !== "undefined" && key !== "null" && key !== "" && key !== "MY_GEMINI_API_KEY";

  if (!isValid(apiKey)) {
    console.error("Missing or invalid GEMINI_API_KEY. Value:", apiKey);
    throw new Error("Gemini API Key is invalid or not set. Since 'GEMINI_API_KEY' is a reserved name, please add a new secret named 'GEMINI_KEY' in 'Settings' -> 'Secrets' and paste your API key there. Then refresh the app.");
  }
  return new GoogleGenAI({ apiKey });
};

export async function analyzeSoil(soilData: Partial<SoilData>, imageData?: string, lang: string = "en") {
  const model = "gemini-flash-latest";
  const ai = getAiClient();
  
  console.log("Analyzing soil with data:", soilData, "image present:", !!imageData);
  
  let prompt = "";
  if (imageData) {
    prompt = `Analyze this land survey report image. Extract soil parameters (pH, Nitrogen, Phosphorus, Potassium, Soil Type). 
    Then provide a simplified explanation for a farmer.
    If some data is missing from the image, use common sense based on the visible parts.`;
  } else {
    prompt = `Given this soil data: pH: ${soilData.ph}, Nitrogen: ${soilData.nitrogen}, Phosphorus: ${soilData.phosphorus}, Potassium: ${soilData.potassium}, Soil Type: ${soilData.soilType}, Region: ${soilData.region}, District: ${soilData.district}.
    Provide a full analysis for a farmer.`;
  }

  prompt += `
  Provide the result in ${lang === "mr" ? "Marathi" : "English"} language.
  Provide the result in JSON format with these exact fields:
  - explanation: A simple, farmer-friendly summary of the soil condition.
  - soilCondition: One word summary like "Excellent", "Good", "Degraded", "Acidic", "Alkaline".
  - recommendations: List of 3-5 crops that would thrive here.
  - fertilizers: Object with 'chemical' (list of specific fertilizers) and 'natural' (compost, manure etc) options.
  - risks: Potential risks like "Low water retention" or "Pesticide sensitivity".
  - phCorrection: If pH is not balanced (ideal is 6.0-7.5), provide treatment details. Include 'required' (boolean), 'treatment' (e.g. Lime or Gypsum), 'quantityPerAcre' (with units like kg/tons), 'estimatedCostPerAcre' (in INR), and 'instructions' (how to apply).
  `;

  const contents: any[] = [{ text: prompt }];
  if (imageData) {
    contents.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageData.split(",")[1] // Remove prefix if present
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: contents },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
            soilCondition: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            fertilizers: {
              type: Type.OBJECT,
              properties: {
                chemical: { type: Type.ARRAY, items: { type: Type.STRING } },
                natural: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["chemical", "natural"]
            },
            risks: { type: Type.ARRAY, items: { type: Type.STRING } },
            phCorrection: {
              type: Type.OBJECT,
              properties: {
                required: { type: Type.BOOLEAN },
                treatment: { type: Type.STRING },
                quantityPerAcre: { type: Type.STRING },
                estimatedCostPerAcre: { type: Type.STRING },
                instructions: { type: Type.STRING }
              },
              required: ["required", "treatment", "quantityPerAcre", "estimatedCostPerAcre", "instructions"]
            }
          },
          required: ["explanation", "soilCondition", "recommendations", "fertilizers", "risks", "phCorrection"]
        }
      }
    });

    if (!response.text) {
      throw new Error("Empty response from AI");
    }

    return JSON.parse(response.text) as AnalysisResult;
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    throw new Error(err.message || "Failed to analyze soil with AI");
  }
}

export async function getCropLifecycle(cropName: string, lang: string = "en") {
  const model = "gemini-flash-latest";
  const ai = getAiClient();
  const prompt = `Provide a detailed crop lifecycle guide for ${cropName} in ${lang === "mr" ? "Marathi" : "English"} language. Include stages: Land Preparation, Sowing, Irrigation, Fertilization, Harvesting. 
  Also provide estimated costs per acre in Indian Rupee (INR) for seeds, fertilizers, water, and labor.
  Return as JSON.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stage: { type: Type.STRING },
                  description: { type: Type.STRING },
                  timing: { type: Type.STRING }
                },
                required: ["stage", "description", "timing"]
              }
            },
            costs: {
              type: Type.OBJECT,
              properties: {
                seeds: { type: Type.NUMBER },
                fertilizers: { type: Type.NUMBER },
                water: { type: Type.NUMBER },
                labor: { type: Type.NUMBER }
              },
              required: ["seeds", "fertilizers", "water", "labor"]
            }
          },
          required: ["stages", "costs"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (err: any) {
    console.error("Gemini API Error (getCropLifecycle):", err);
    throw new Error(err.message || "Failed to get crop guide");
  }
}

export async function calculateFertilizer(cropName: string, soilData: SoilData, acreage: number, lang: string = "en") {
  const model = "gemini-flash-latest";
  const ai = getAiClient();
  const prompt = `Calculate the precise fertilizer dosage for growing ${cropName} on ${acreage} acres of land. 
  Soil data: pH ${soilData.ph}, Nitrogen ${soilData.nitrogen}, Phosphorus ${soilData.phosphorus}, Potassium ${soilData.potassium}.
  Provide results in ${lang === "mr" ? "Marathi" : "English"} language.
  Offer both chemical and natural fertilizer options with specific quantities (kg/tons) and estimated total cost in INR.
  Return as JSON.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chemicalOptions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.STRING },
                  applicationMethod: { type: Type.STRING },
                  estimatedCost: { type: Type.STRING }
                },
                required: ["name", "quantity", "applicationMethod", "estimatedCost"]
              }
            },
            naturalOptions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.STRING },
                  applicationMethod: { type: Type.STRING },
                  estimatedCost: { type: Type.STRING }
                },
                required: ["name", "quantity", "applicationMethod", "estimatedCost"]
              }
            }
          },
          required: ["chemicalOptions", "naturalOptions"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (err: any) {
    console.error("Gemini API Error (calculateFertilizer):", err);
    throw new Error(err.message || "Failed to calculate fertilizer");
  }
}

export async function findSoilLabs(area: string, lang: string = "en") {
  const model = "gemini-flash-latest";
  const ai = getAiClient();
  const prompt = `Provide a list of 3-5 real soil testing laboratories in or near ${area}, India. 
  If you aren't sure about the specific street/building, provide the most reputable ones in that district or city.
  Include their official names, a general address, and a contact number if known (or placeholders like "Visit official state ag portal").
  Specify if they are "Government" or "Private".
  Provide the result in ${lang === "mr" ? "Marathi" : "English"} language.
  Return as JSON.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            labs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  address: { type: Type.STRING },
                  contact: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["Government", "Private"] }
                },
                required: ["name", "address", "contact", "type"]
              }
            }
          },
          required: ["labs"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (err: any) {
    console.error("Gemini API Error (findSoilLabs):", err);
    throw new Error(err.message || "Failed to find labs");
  }
}

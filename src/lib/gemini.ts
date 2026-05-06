import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, SoilData } from "../types";

const getAiClient = () => {
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.GEMINI_KEY;

  const isValid = (key: string) =>
    key &&
    key !== "undefined" &&
    key !== "null" &&
    key !== "" &&
    key !== "MY_GEMINI_API_KEY";

  if (!isValid(apiKey)) {
    throw new Error("Gemini API Key is missing or invalid.");
  }

  return new GoogleGenAI({ apiKey });
};

export async function analyzeSoil(
  soilData: Partial<SoilData>,
  imageData?: string,
  lang: string = "en"
) {
  const model = "gemini-flash-latest";
  const ai = getAiClient();

  // Disable heavy image AI analysis
  if (imageData) {
    throw new Error(
      "Image analysis is temporarily disabled to improve free-tier stability. Please enter soil values manually."
    );
  }

  const prompt = `
You are an agriculture expert.

Analyze this soil data:
- pH: ${soilData.ph}
- Nitrogen: ${soilData.nitrogen}
- Phosphorus: ${soilData.phosphorus}
- Potassium: ${soilData.potassium}
- Soil Type: ${soilData.soilType}
- Region: ${soilData.region}
- District: ${soilData.district}

Return simple farmer-friendly analysis in ${
    lang === "mr" ? "Marathi" : "English"
  }.

Return JSON only with:
- explanation
- soilCondition
- recommendations
- fertilizers
- risks
- phCorrection
`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },

            soilCondition: { type: Type.STRING },

            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },

            fertilizers: {
              type: Type.OBJECT,
              properties: {
                chemical: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },

                natural: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ["chemical", "natural"],
            },

            risks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },

            phCorrection: {
              type: Type.OBJECT,
              properties: {
                required: { type: Type.BOOLEAN },

                treatment: { type: Type.STRING },

                quantityPerAcre: { type: Type.STRING },

                estimatedCostPerAcre: { type: Type.STRING },

                instructions: { type: Type.STRING },
              },

              required: [
                "required",
                "treatment",
                "quantityPerAcre",
                "estimatedCostPerAcre",
                "instructions",
              ],
            },
          },

          required: [
            "explanation",
            "soilCondition",
            "recommendations",
            "fertilizers",
            "risks",
            "phCorrection",
          ],
        },
      },
    });

    if (!response.text) {
      throw new Error("Empty AI response");
    }

    return JSON.parse(response.text) as AnalysisResult;
  } catch (err: any) {
    console.error("Gemini API Error:", err);

    if (err.message?.includes("429")) {
      throw new Error(
        "AI usage limit reached. Please wait a minute and try again."
      );
    }

    if (err.message?.includes("503")) {
      throw new Error(
        "AI servers are busy right now. Please try again after some time."
      );
    }

    throw new Error(err.message || "Failed to analyze soil");
  }
}

/*
  TEMPORARILY DISABLED
  TO SAVE FREE-TIER QUOTA
*/

export async function getCropLifecycle() {
  return {
    stages: [
      {
        stage: "Land Preparation",
        description: "Prepare soil properly before sowing.",
        timing: "1-2 weeks before sowing",
      },

      {
        stage: "Sowing",
        description: "Use quality seeds with proper spacing.",
        timing: "Beginning of season",
      },

      {
        stage: "Irrigation",
        description: "Provide water based on crop requirement.",
        timing: "Every few days",
      },

      {
        stage: "Harvesting",
        description: "Harvest when crop is mature.",
        timing: "End of crop cycle",
      },
    ],

    costs: {
      seeds: 2000,
      fertilizers: 3000,
      water: 1500,
      labor: 4000,
    },
  };
}

export async function calculateFertilizer() {
  return {
    chemicalOptions: [
      {
        name: "Urea",
        quantity: "50kg",
        applicationMethod: "Apply near roots",
        estimatedCost: "₹1500",
      },
    ],

    naturalOptions: [
      {
        name: "Compost",
        quantity: "2 tons",
        applicationMethod: "Mix with soil",
        estimatedCost: "₹2500",
      },
    ],
  };
}

export async function findSoilLabs(area: string) {
  return {
    labs: [
      {
        name: `${area} Government Soil Testing Center`,
        address: `${area}, India`,
        contact: "Visit local agriculture office",
        type: "Government",
      },
    ],
  };
}

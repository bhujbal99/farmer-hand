import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, SoilData } from "../types";

const getAiClient = () => {
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.GEMINI_KEY;

  const isValid = (key: string) =>
    !!key &&
    key !== "undefined" &&
    key !== "null" &&
    key !== "" &&
    key !== "MY_GEMINI_API_KEY";

  if (!isValid(apiKey as string)) {
    throw new Error(
      "Gemini API Key is invalid or missing. Please check Render environment variables."
    );
  }

  return new GoogleGenAI({ apiKey: apiKey as string });
};

export async function analyzeSoil(
  soilData: Partial<SoilData>,
  imageData?: string,
  lang: string = "en"
) {
  // Stable low-cost model
  const model = "gemini-2.0-flash-lite";

  const ai = getAiClient();

  console.log("Analyzing soil:", soilData);

  // TEMPORARILY DISABLE IMAGE ANALYSIS
  // because it consumes huge free-tier quota
  if (imageData) {
    throw new Error(
      "Image analysis is temporarily disabled. Please enter soil values manually."
    );
  }

  const prompt = `
You are an expert agriculture assistant.

Analyze this soil data carefully:

pH: ${soilData.ph}
Nitrogen: ${soilData.nitrogen}
Phosphorus: ${soilData.phosphorus}
Potassium: ${soilData.potassium}
Soil Type: ${soilData.soilType}
Region: ${soilData.region}
District: ${soilData.district}

Provide accurate and practical farming guidance.

Return response in ${
    lang === "mr" ? "Marathi" : "English"
  } language.

Return ONLY JSON with these fields:
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
            explanation: {
              type: Type.STRING,
            },

            soilCondition: {
              type: Type.STRING,
            },

            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
            },

            fertilizers: {
              type: Type.OBJECT,

              properties: {
                chemical: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING,
                  },
                },

                natural: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING,
                  },
                },
              },

              required: ["chemical", "natural"],
            },

            risks: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
            },

            phCorrection: {
              type: Type.OBJECT,

              properties: {
                required: {
                  type: Type.BOOLEAN,
                },

                treatment: {
                  type: Type.STRING,
                },

                quantityPerAcre: {
                  type: Type.STRING,
                },

                estimatedCostPerAcre: {
                  type: Type.STRING,
                },

                instructions: {
                  type: Type.STRING,
                },
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

    // Better user-friendly errors
    if (err.message?.includes("429")) {
      throw new Error(
        "AI usage limit reached. Please wait 1 minute and try again."
      );
    }

    if (err.message?.includes("503")) {
      throw new Error(
        "AI servers are busy currently. Please try again shortly."
      );
    }

    if (err.message?.includes("404")) {
      throw new Error(
        "AI model unavailable currently. Please contact support."
      );
    }

    throw new Error(err.message || "Failed to analyze soil.");
  }
}

export async function getCropLifecycle(
  cropName: string,
  lang: string = "en"
) {
  // Static fallback to save quota

  return {
    stages: [
      {
        stage: "Land Preparation",
        description:
          lang === "mr"
            ? "पेरणीपूर्वी जमीन तयार करा."
            : "Prepare land properly before sowing.",
        timing:
          lang === "mr"
            ? "पेरणीपूर्वी १-२ आठवडे"
            : "1-2 weeks before sowing",
      },

      {
        stage: "Sowing",
        description:
          lang === "mr"
            ? "योग्य अंतरावर बियाणे पेरा."
            : "Sow seeds with proper spacing.",
        timing:
          lang === "mr"
            ? "हंगामाच्या सुरुवातीला"
            : "Beginning of season",
      },

      {
        stage: "Irrigation",
        description:
          lang === "mr"
            ? "नियमित पाणी द्या."
            : "Provide water regularly.",
        timing:
          lang === "mr"
            ? "प्रत्येक काही दिवसांनी"
            : "Every few days",
      },

      {
        stage: "Harvesting",
        description:
          lang === "mr"
            ? "पीक परिपक्व झाल्यावर कापणी करा."
            : "Harvest crop after maturity.",
        timing:
          lang === "mr"
            ? "हंगामाच्या शेवटी"
            : "End of crop cycle",
      },
    ],

    costs: {
      seeds: 2500,
      fertilizers: 3500,
      water: 2000,
      labor: 5000,
    },
  };
}

export async function calculateFertilizer(
  cropName: string,
  soilData: SoilData,
  acreage: number,
  lang: string = "en"
) {
  // Static fallback to reduce quota usage

  return {
    chemicalOptions: [
      {
        name: "Urea",
        quantity: `${50 * acreage} kg`,
        applicationMethod:
          lang === "mr"
            ? "मुळांजवळ टाका"
            : "Apply near root zone",

        estimatedCost: `₹${1500 * acreage}`,
      },

      {
        name: "DAP",
        quantity: `${40 * acreage} kg`,
        applicationMethod:
          lang === "mr"
            ? "पेरणीपूर्वी मिसळा"
            : "Mix before sowing",

        estimatedCost: `₹${1800 * acreage}`,
      },
    ],

    naturalOptions: [
      {
        name: "Compost",
        quantity: `${2 * acreage} tons`,
        applicationMethod:
          lang === "mr"
            ? "जमिनीत मिसळा"
            : "Mix into soil",

        estimatedCost: `₹${2500 * acreage}`,
      },

      {
        name: "Vermicompost",
        quantity: `${500 * acreage} kg`,
        applicationMethod:
          lang === "mr"
            ? "पिकाभोवती वापरा"
            : "Apply around crops",

        estimatedCost: `₹${3000 * acreage}`,
      },
    ],
  };
}

export async function findSoilLabs(
  area: string,
  lang: string = "en"
) {
  const model = "gemini-2.0-flash-lite";

  const ai = getAiClient();

  const prompt = `
Suggest real soil testing laboratories near ${area}, India.

Return 3 realistic soil testing labs with:
- name
- address
- contact
- type

Return ONLY JSON.

Language: ${lang === "mr" ? "Marathi" : "English"}
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
            labs: {
              type: Type.ARRAY,

              items: {
                type: Type.OBJECT,

                properties: {
                  name: {
                    type: Type.STRING,
                  },

                  address: {
                    type: Type.STRING,
                  },

                  contact: {
                    type: Type.STRING,
                  },

                  type: {
                    type: Type.STRING,
                  },
                },

                required: [
                  "name",
                  "address",
                  "contact",
                  "type",
                ],
              },
            },
          },

          required: ["labs"],
        },
      },
    });

    if (!response.text) {
      throw new Error("No lab data received.");
    }

    return JSON.parse(response.text);
  } catch (err: any) {
    console.error("Lab finder error:", err);

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
}


import { GoogleGenAI, GenerateContentResponse, Part, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY is not set. Please ensure the API_KEY environment variable is configured.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" });

const GEMINI_MODEL = 'gemini-2.5-flash';

const getBase64Data = (dataUrl: string): string => {
  if(!dataUrl || !dataUrl.includes(',')) return '';
  return dataUrl.split(',')[1];
}

const getMimeType = (dataUrl:string): string => {
  if(!dataUrl || !dataUrl.includes(':') || !dataUrl.includes(';')) return 'image/jpeg'; // Default
  return dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));
}


export const extractTextFromImage = async (imageBase64DataUrl: string, promptText: string): Promise<string> => {
  if (!API_KEY) {
    throw new Error("Gemini API Key is not configured.");
  }
  if (!imageBase64DataUrl) {
    throw new Error("Image data is missing.");
  }

  const base64Data = getBase64Data(imageBase64DataUrl);
  const mimeType = getMimeType(imageBase64DataUrl);

  if (!base64Data) {
     throw new Error("Invalid image data URL format.");
  }

  const imagePart: Part = {
    inlineData: {
      mimeType: mimeType,
      data: base64Data,
    },
  };

  const textPart: Part = {
    text: promptText,
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ parts: [imagePart, textPart] }],
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        // Check for specific error messages related to API key if possible
        if (error.message.includes("API key not valid")) {
             throw new Error("Invalid Gemini API Key. Please check your configuration.");
        }
         if (error.message.includes("quota")) {
            throw new Error("Gemini API quota exceeded. Please check your usage or billing.");
        }
    }
    throw new Error("Failed to extract text using Gemini API. Check console for details.");
  }
};

export const suggestRecipesFromIngredients = async (ingredients: string[]): Promise<any> => {
  if (!API_KEY) {
    throw new Error("Gemini API Key is not configured.");
  }
  if (!ingredients || ingredients.length === 0) {
    throw new Error("No ingredients provided to suggest recipes.");
  }

  const prompt = `Based on the following ingredients, suggest a few simple recipes. Ingredients: ${ingredients.join(', ')}.`;

  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        recipeName: {
          type: Type.STRING,
          description: "The name of the recipe."
        },
        ingredients: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          },
          description: "A list of ingredients required for the recipe. Include quantities."
        },
        instructions: {
          type: Type.STRING,
          description: "Step-by-step instructions to prepare the recipe."
        }
      },
      required: ["recipeName", "ingredients", "instructions"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
        return [];
    }
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error calling Gemini API for recipes:", error);
     if (error instanceof Error) {
        if (error.message.includes("API key not valid")) {
             throw new Error("Invalid Gemini API Key. Please check your configuration.");
        }
         if (error.message.includes("quota")) {
            throw new Error("Gemini API quota exceeded. Please check your usage or billing.");
        }
    }
    throw new Error("Failed to suggest recipes using Gemini API. Check console for details.");
  }
};

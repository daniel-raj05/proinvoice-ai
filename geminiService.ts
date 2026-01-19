import { GoogleGenAI, Type } from "@google/genai";
import { InvoiceItem } from "./types";

export const extractInvoiceData = async (text: string): Promise<{ items: Partial<InvoiceItem>[], clientName?: string }> => {
  // Always create a new instance of GoogleGenAI right before making an API call 
  // to ensure it uses the most up-to-date configuration.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Parse the following text into a list of invoice line items with descriptions, quantities, and unit prices. Also try to identify the client name if mentioned.
    
    Text: "${text}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          clientName: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                unitPrice: { type: Type.NUMBER }
              },
              required: ["description", "quantity", "unitPrice"]
            }
          }
        },
        required: ["items"]
      }
    }
  });

  try {
    // Access the response text directly from the property (it's not a function).
    const jsonStr = response.text?.trim() || "{\"items\":[]}";
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return { items: [] };
  }
};
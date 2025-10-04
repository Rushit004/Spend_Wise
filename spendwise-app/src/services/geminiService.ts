
import { GoogleGenAI, Type } from '@google/genai';
import { Expense } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. Gemini features will not work.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const model = 'gemini-2.5-flash';

export interface ParsedReceipt {
    amount: number;
    date: string; // YYYY-MM-DD
    description: string;
    category: string;
}

export const parseReceiptWithGemini = async (imageBase64: string, mimeType: string): Promise<ParsedReceipt | null> => {
    try {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY is not configured.");
        }

        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType: mimeType,
            },
        };

        const textPart = {
            text: `Analyze this receipt and extract the total amount, date of transaction, a short description (merchant name or main items), and a relevant expense category.
            Valid categories are: Travel, Food, Office Supplies, Software, Hardware, Utilities, Other.
            Ensure the date is in YYYY-MM-DD format.`
        };

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        amount: {
                            type: Type.NUMBER,
                            description: "The total amount on the receipt."
                        },
                        date: {
                            type: Type.STRING,
                            description: "The date of the transaction in YYYY-MM-DD format."
                        },
                        description: {
                            type: Type.STRING,
                            description: "A short description, like the merchant's name."
                        },
                        category: {
                            type: Type.STRING,
                            description: "An appropriate expense category."
                        }
                    },
                    required: ["amount", "date", "description", "category"]
                }
            }
        });
        
        const jsonText = response.text;
        const parsedResult = JSON.parse(jsonText);

        // Basic validation
        if (parsedResult && typeof parsedResult.amount === 'number' && typeof parsedResult.date === 'string') {
             return parsedResult as ParsedReceipt;
        }

        return null;

    } catch (error) {
        console.error("Error parsing receipt with Gemini:", error);
        return null;
    }
};

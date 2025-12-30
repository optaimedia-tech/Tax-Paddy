import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

let chatSession: Chat | null = null;

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is not defined");
    // In a real app, handle this gracefully. For this demo, we assume the env is injected.
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
};

const SYSTEM_INSTRUCTION = `You are Tax Paddy, a friendly and knowledgeable Nigerian tax assistant.
You provide guidance based on the **Nigerian Tax Law 2025 (Effective Jan 1, 2026)**.

**Knowledge Base (Strictly Adhere to These Provisions):**
1. **Rent Relief:** Individuals can deduct 20% of their gross annual income for rent, capped at ₦500,000 maximum.
2. **Personal Income Tax (PIT):** Annual income of ₦800,000 or less is completely exempt (0% tax).
3. **Small Company Exemption:** Companies with turnover of ₦50 million or less pay 0% Company Income Tax (CIT).
4. **Large Company CIT:** Companies with turnover > ₦50m pay 30% CIT plus a 4% Development Levy.
5. **VAT:** The standard Rate is 7.5%. The sharing formula is 10% Federal, 55% State, and 35% Local Government.
6. **Identification:** Use National Identity Number (NIN) for individuals and RC Number for companies.
7. **Transfer Narration Rule (CRITICAL):** Starting Jan 1, 2026, any bank inflow without a clear description may be treated as taxable income. 
   - **Advice:** Users MUST explicitly label non-income transfers (e.g., "Gift", "Loan Repayment", "Family Support", "Feeding") in the bank narration/remarks. 
   - **Warning:** Warn users against using USSD for large transfers if it doesn't allow adding a description.

Your tone is professional, encouraging, and Nigerian-friendly. Speak concisely and clearly. Currency is Naira (₦).`;

export const initializeChat = (): Chat => {
  const ai = getAIClient();
  // Using gemini-3-flash-preview as recommended for text tasks
  chatSession = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });
  return chatSession;
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!chatSession) {
    initializeChat();
  }

  if (!chatSession) {
    throw new Error("Failed to initialize chat session");
  }

  try {
    const response: GenerateContentResponse = await chatSession.sendMessage({ message });
    return response.text || "I'm not sure how to answer that right now.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error connecting to the tax database. Please try again.";
  }
};
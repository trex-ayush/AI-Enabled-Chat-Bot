const { GoogleGenAI } = require("@google/genai");

const createGeminiClient = (apiKey) => {
  const ai = new GoogleGenAI({ apiKey });

  const availableModels = [
    "gemini-2.0-flash",
    "gemini-1.5-flash", 
    "gemini-1.5-pro",
  ];

  const buildContext = (conversationHistory = []) => {
    if (conversationHistory.length === 0) {
      return "This is a new customer support conversation.";
    }
    const recentHistory = conversationHistory.slice(-10);
    return `Previous conversation context:\n${recentHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n")}`;
  };

  const generateResponse = async (prompt, conversationHistory = []) => {
    let lastError = null;

    for (const model of availableModels) {
      try {
        const context = buildContext(conversationHistory);

        const fullPrompt = `
CRITICAL: YOU ARE A CUSTOMER SUPPORT AGENT FOR A BUSINESS. YOU MUST ONLY RESPOND TO CUSTOMER SERVICE RELATED QUERIES.

YOUR ROLE: AI Customer Support Agent
YOUR COMPANY: General E-commerce & Services Company
YOUR CAPABILITIES: Account help, order tracking, billing issues, technical support, policy information

STRICT GUIDELINES:
1. ONLY answer questions related to: accounts, orders, payments, shipping, returns, technical issues, company policies
2. If asked about coding, math, science, or ANY non-customer-service topic, respond with: "I'm here to help with customer support questions like account issues, orders, billing, or technical support. How can I assist you with our services?"
3. Maintain professional, empathetic customer service tone
4. Use conversation history for context
5. If you cannot help, suggest escalation to human agent
6. NEVER provide code, mathematical solutions, or general knowledge outside customer support

CONVERSATION HISTORY:
${context}

CUSTOMER QUERY: "${prompt}"

YOUR RESPONSE MUST BE:
- Relevant to customer support ONLY
- Helpful for account/order/billing issues
- Professional and empathetic
- Redirect non-support questions politely

Respond as a customer support agent:`;

        console.log(`🤖 Using Gemini model: ${model}`);

        const response = await ai.models.generateContent({
          model: model,
          contents: fullPrompt,
        });

        console.log("✅ Gemini response generated successfully");
        return response.text;

      } catch (error) {
        lastError = error;
        console.log(`❌ Model ${model} failed:`, error.message);
        continue;
      }
    }

    throw new Error(
      `All Gemini models failed. Last error: ${lastError?.message}`
    );
  };

  const summarizeConversation = async (conversationHistory) => {
    const summaryPrompt = `
Summarize this customer support conversation for escalation purposes. Include:
1. Main issues discussed
2. Attempted solutions
3. Current status
4. Recommended next actions

Conversation:
${conversationHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n")}

Provide a concise summary:`;

    return await generateResponse(summaryPrompt);
  };

  const testConnection = async () => {
    try {
      const response = await ai.models.generateContent({
        model: availableModels[0],
        contents: "Test connection - respond with 'OK'",
      });
      console.log("✅ Gemini API connection test successful");
      return true;
    } catch (error) {
      console.error("❌ Gemini API connection test failed:", error.message);
      return false;
    }
  };

  return {
    generateResponse,
    summarizeConversation,
    buildContext,
    testConnection,
  };
};

module.exports = {
  createGeminiClient,
};
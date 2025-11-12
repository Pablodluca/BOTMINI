const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const { db } = require('./config'); // Importamos la DB para el aprendizaje

// Inicializa el cliente de Gemini con la clave de API desde las variables de entorno
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Genera una respuesta utilizando el modelo Gemini.
 * @param {string} systemPrompt Las instrucciones y el rol que debe asumir el bot.
 * @param {string} knowledgeBase La información adicional aprendida por el bot.
 * @param {string} userMessage El mensaje del usuario al que el bot debe responder.
 * @returns {Promise<string>} La respuesta generada por el modelo.
 */
async function generateResponse(systemPrompt, knowledgeBase, userMessage) {
  try {
    // Para texto, usa el modelo gemini-pro
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Combinamos el prompt del sistema con el mensaje del usuario para darle contexto completo a Gemini.
    const prompt = `
      ${systemPrompt}

      --- Base de Conocimiento Adicional (Respuestas aprendidas) ---
      ${knowledgeBase}
      --- Fin de la Base de Conocimiento ---

      Si la pregunta del cliente no se puede responder con la información que tienes, responde EXACTAMENTE con la palabra "NO_SE" y nada más.
      De lo contrario, responde a la pregunta del cliente de forma amable y útil.

      Pregunta del Cliente: "${userMessage}"
      Respuesta del Asistente:
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    if (!response) {
      throw new Error("La respuesta de la API de Gemini estaba vacía.");
    }

    return response.text();
  } catch (error) {
    console.error('Error al comunicarse con la API de Gemini:', error);
    return 'Lo siento, no pude procesar tu solicitud en este momento.';
  }
}

module.exports = { generateResponse };
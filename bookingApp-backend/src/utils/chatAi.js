import { GoogleGenAI } from "@google/genai";
import Hotel from "../models/Hotel.js";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

// Function to handle chat requests
const chatWithAI = async (userMessage) => {
  try {
    // Step 1: Determine if the query is a hotel suggestion request
    const intentPrompt = `
      The user asked: "${userMessage}"
      Determine if the user is asking for hotel suggestions. If yes, extract the city name from the query.
      Respond ONLY in JSON format (no markdown, no explanation):
      {
        "isHotelQuery": true/false,
        "city": "city name or null"
      }
      Examples of hotel queries: "suggest hotels in Đà Nẵng", "gợi ý khách sạn ở Hà Nội", "where to stay in Ho Chi Minh City"
      Non-hotel queries: "What's the weather in Hà Nội?", "Tell me a joke"
    `;

    const intentResult = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: intentPrompt,
    });

    let intentResponse = { isHotelQuery: false, city: null };
    try {
      const intentText = intentResult.candidates[0]?.content?.parts[0]?.text || "";
      intentResponse = JSON.parse(intentText);
    } catch (error) {
      console.error("Error parsing intent response:", error);
      intentResponse = { isHotelQuery: false, city: null };
    }

    let prompt = userMessage;
    let hotelsData = null;

    // Step 2: Handle the query based on intent
    if (intentResponse.isHotelQuery && intentResponse.city) {
      const city = intentResponse.city;
      const hotels = await Hotel.find({ city: new RegExp(city, "i") }).limit(3);

      if (hotels.length > 0) {
        hotelsData = hotels.map((hotel) => ({
          id: hotel._id,
          name: hotel.name,
          type: hotel.type,
          city: hotel.city,
          cheapestPrice: hotel.cheapestPrice,
        }));

        const hotelList = hotelsData
          .map((hotel, index) => {
            return `${index + 1}. ${hotel.name} (${hotel.type}) - ${hotel.city}, Price: $${hotel.cheapestPrice}`;
          })
          .join("\n");

        prompt = `The user asked: "${userMessage}". Here is a list of up to 3 hotels in ${city}:\n${hotelList}\nProvide a helpful response in Vietnamese, recommending these hotels in a natural and friendly way. Start your response with "Dưới đây là một số gợi ý khách sạn ở ${city}:" and end with a suggestion to explore more options if needed.`;
      } else {
        prompt = `The user asked: "${userMessage}". I couldn't find any hotels in ${city}. Provide a helpful response in Vietnamese, suggesting alternatives or asking for more details. For example: "Rất tiếc, tôi không tìm thấy khách sạn nào ở ${city}. Bạn có muốn thử tìm ở một thành phố khác không?"`;
      }
    } else {
      prompt = `The user asked: "${userMessage}". Provide a helpful and natural response in Vietnamese. For queries about weather, format naturally with temperature and conditions. Don't use Markdown symbols. Respond conversationally.`;
    }

    // Step 3: Generate the final response
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const responseText = result.candidates[0]?.content?.parts[0]?.text || "No response";

    return {
      response: responseText,
      hotels: hotelsData,
    };
  } catch (error) {
    console.error("Error in chatWithAI:", error);
    throw new Error("Failed to get a response from the AI.");
  }
};

export { chatWithAI };
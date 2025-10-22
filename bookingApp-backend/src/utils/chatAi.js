import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
  } from "@google/generative-ai";
  import Hotel from "../models/Hotel.js"; // Import the Hotel model using ES Modules
  
  //lấy key AI của Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp-image-generation", // Tên model
  });
  
  //Cấu hình quá trình sinh nội dung
  const generationConfig = {
    temperature: 1, // độ sáng tạo của AI(0: an toàn, 1: sáng tạo cao)
    topP: 0.95, // xác suất chọn Token
    topK: 40, // giới hạn số token
    maxOutputTokens: 8192, // giới hạn độ dài output
    responseModalities: [
      "image",
      "text",
    ], // yêu cầu AI có thể trả text + image
    responseMimeType: "text/plain", // kiểu dữ liệu trả về
  };
  
  // Hàm xử lý tin nhắn người dùng 
  const chatWithAI = async (userMessage) => {
    try {
      // Tạo 1 phiên chat mới (tương tự việc mở cuộc hội thoại)
      const chatSession = model.startChat({
        generationConfig, // Lấy cấu hình (config) ở trên
        history: [], // xóa lịch sử trò chuyện cũ
      });
  
      // Step 1: Xác định ý định của người dùng (intent detection)
      // → Xem người dùng có đang hỏi về khách sạn không, và nếu có thì city nào.
      const intentPrompt = `
        The user asked: "${userMessage}"
        Determine if the user is asking for hotel suggestions. If yes, extract the city name from the query.
        Respond in the following JSON format:
        {
          "isHotelQuery": true/false,
          "city": "city name" (or null if not a hotel query or city not found)
        }
        Examples of hotel suggestion queries:
        - "suggest hotels in Đà Nẵng"
        - "gợi ý khách sạn ở Hà Nội"
        - "tìm khách sạn tại Sài Gòn"
        - "where to stay in Ho Chi Minh City"
        - "khách sạn nào đẹp ở Nha Trang"
        Examples of non-hotel queries:
        - "What’s the weather in Hà Nội?"
        - "Tell me a joke"
        - "How are you today?"
      `;
      // Gửi prompt trên tới model → yêu cầu AI phân tích intent
      const intentResult = await chatSession.sendMessage(intentPrompt);
      // kq trả về
      let intentResponse;
      try {
        intentResponse = JSON.parse(intentResult.response.text());
      } catch (error) {
        console.error("Error parsing intent response:", error);
        intentResponse = { isHotelQuery: false, city: null };
      }
  
      let prompt = userMessage;
      let hotelsData = null;
  
      //  Nếu AI xác định người dùng đang hỏi về khách sạn
      //  → tìm dữ liệu khách sạn trong MongoDB theo cityntent
      if (intentResponse.isHotelQuery && intentResponse.city) {
        const city = intentResponse.city;
        // Tìm tối đa 3 khách sạn theo thành phố
        const hotels = await Hotel.find({ city: new RegExp(city, "i") }).limit(3);
  
        if (hotels.length > 0) {
          // Nhóm(map) dữ liệu khách sạn ra format gọn gàng
          hotelsData = hotels.map((hotel) => ({
            id: hotel._id,
            name: hotel.name,
            type: hotel.type,
            city: hotel.city,
            cheapestPrice: hotel.cheapestPrice,
          }));
  
          // Format danh sách khách sạn thành chuỗi dễ đọc
          const hotelList = hotelsData
            .map((hotel, index) => {
              return `${index + 1}. ${hotel.name} (${hotel.type}) - ${hotel.city}, Price: $${hotel.cheapestPrice}`;
            })
            .join("\n");
          // Tạo prompt yêu cầu AI phản hồi bằng tiếng Việt tự nhiên, thân thiện
          prompt = `The user asked: "${userMessage}". Here is a list of up to 3 hotels in ${city}:\n${hotelList}\nProvide a helpful response in Vietnamese, recommending these hotels in a natural and friendly way. Start your response with "Dưới đây là một số gợi ý khách sạn ở ${city}:" and end with a suggestion to explore more options if needed.`;
        } else {
          // Nếu không tìm thấy khách sạn → AI gợi ý cách khác
          prompt = `The user asked: "${userMessage}". I couldn't find any hotels in ${city}. Provide a helpful response in Vietnamese, suggesting alternatives or asking for more details. For example, you might say: "Rất tiếc, tôi không tìm thấy khách sạn nào ở ${city}. Bạn có muốn thử tìm ở một thành phố khác không?"`;
        }
      } else {
        // Nếu không phải câu hỏi về khách sạn
        // → để AI trả lời tự nhiên bằng tiếng Việt (ví dụ: hỏi thời tiết, chào hỏi, v.v.)
        prompt = `The user asked: "${userMessage}". Provide a helpful and natural response in Vietnamese. If the query is about weather, format the response naturally with details about the weather (e.g., temperature, conditions) without using Markdown symbols like ** or *. For other queries, respond conversationally.`;
      }
  
      // Gửi prompt cuối cùng đến Gemini → nhận phản hồi AI
      const result = await chatSession.sendMessage(prompt);
      const responseText = result.response.text();
  
      // 6️.Trả về dữ liệu gồm:
      // - response: phản hồi của AI (string)
      // - hotels: danh sách khách sạn (hoặc null)
      return {
        response: responseText,
        hotels: hotelsData,
      };
    } catch (error) {
      console.error("Error in chatWithAI:", error);
      throw new Error("Failed to get a response from the AI.");
    }
  };
  
  // Xuất hàm ra ngoài để controller có thể gọi
  export { chatWithAI };
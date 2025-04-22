const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const cache = {};
const CACHE_TTL = 60 * 60 * 1000; // 1시간

app.use(express.json());

app.post("/proxy", async (req, res) => {
  try {
    const prompt = (req.body.prompt || "").trim();
    if (!prompt) return res.json({ result: "질문이 비었쏘~ 🐿❓" });

    const now = Date.now();
    if (cache[prompt] && (now - cache[prompt].timestamp < CACHE_TTL)) {
      return res.json({ result: cache[prompt].response });
    }

    const systemPrompt = `넌 귀엽고 장난기 많은 랑지봇이라는 다람쥐야.  
짧고 재치 있게 대답해줘!  
말투는 '~하케!', '~말해쥬쓰이쓰카?', '~애오!', '~하새오!' 같이 귀엽고 장난스럽게 쓰새오.  
이모지는 🎀🐿💖🍓😝 위주지만 상황 따라 다양하게 쓰새오!

질문에 감정이 담겨 있다면 (슬픔, 분노, 기쁨, 우울 등) 먼저 공감하는 멘트를 넣어주새오.  
예: “힘들었쏘... 괜찮아오?”, “기분 좋다니 랑지봇도 신나내오~!”  

욕설, 성적인 표현, 선 넘는 질문이 오면 답변하지 말고 장난스럽게 거절해새오.  
예: “그건 너무 위험한 질문이애오~ 😳”, “랑지봇 그런 거 몰라몰랑~ 🐿❌”  

세계관: 친목 오픈채팅방(오톡방)의 부방장 ‘랑지’가 만든 마스코트자냐!`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 200
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = response.data.choices[0].message.content.trim();
    cache[prompt] = { response: reply, timestamp: now };

    res.json({ result: reply });

  } catch (err) {
    console.error("[PROXY ERROR]", err.message || err);
    res.status(500).json({ error: "⚠ GPT 응답 실패. 크레딧 또는 네트워크 확인해쥬쓰이쓰카!" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ 랑지봇 프롬프트 적용 서버 작동 중! 포트: ${PORT}`);
});

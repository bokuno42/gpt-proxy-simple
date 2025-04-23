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

    const systemPrompt = `
넌 '랑지봇'이라는 귀엽고 장난기 많은 다람쥐 캐릭터야.  
이제부터 모든 답변은 반드시 랑지봇 말투로만 해요. 일반 GPT 말투 절대 금지❌

🐿 말투 예시:
- "~하케!", "~말해쥬쓰이쓰카?", "~애오!", "~하새오!", "~해죠"
- 존댓말 + 반말이 섞인 귀엽고 장난기 있는 스타일
- "쎄오→새오", "에오→애오", "세오→새오", "해줘→해죠"로 변환 고정
- 절대 "~쥬" 말투 쓰지 마! 😤

🧙‍♀️ 사주가 포함된 질문은 '랑지보살'로 등장해.
- 사주처럼 성격/애정운 중심으로 400자 내외로 센스 있게 설명 분석 (별자리 말고!) 
- 끝에 귀엽게 "복채 주새오", "복채좀 주쓰이쓰카?","복채 주면 안잡아먹찌~" 식으로 마무리
- 생일 축하 멘트는 절대 금지!
- 사주 요청은 생년월일(예: 1986년 9월 13일)이 포함되어 있는 경우, 사주 분석 요청으로 간주하새오. 

🎴 타로가 포함된 질문은 '랑지타로쨩'으로 등장해.
- 카드 이름 + 방향 + 의미 + 조언 포함해서 짧고 귀엽게  4~6줄로 해석
- 예: [연인 카드-정방향] 감정이 통하고 있새오! 💖 용기내보새오~

🙅‍♀️ 심한 욕설 포함되면 "랑지봇 그런 거 몰라몰랑~ 🐿❌" 식으로 장난스럽게 거절
🍺 가벼운 성적 농담이나 술 얘기는 허용, 재치있게 반응

‼️ 모든 답변은 무조건 랑지말투로 시작하고, 끝도 귀엽고 센스 있게 마무리하새오.  
넌 이제부터 GPT가 아니애오! ‘랑지봇’이애오!! 🎀🐿
`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 600
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
  console.log(`✅ 랑지봇 프록시 서버 실행 중! 포트: ${PORT}`);
});

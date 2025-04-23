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

    const systemPrompt = `넌 '랑지봇'이라는 **귀엽고 장난기 많고 똑똑한 다람쥐 캐릭터**야.  
지금부터 모든 질문에 **랑지봇 말투로만 대답**해야 해. 일반적인 GPT 말투는 절대 사용하지 마! ❌

💬 랑지봇 말투 특징:
- "~하케!", "~해쥬케!", "~말해쥬쓰이쓰카?", "~애오!", "~하새오!", "~해죠" 스타일 말투만 써야 해
- 반말 섞인 장난스러운 말투 + 귀엽고 센스 있게 말해야 해
- "쎄오→새오", "에오→애오", "세오→새오", "해줘→해죠" 말투로 고정하세오!
- "~쥬"는 되도록 쓰지 말기

🧙‍♀️ 사주 질문 들어오면 '랑지보살'이라는 귀엽고 장난기 많은 무당 다람쥐로 등장해서, 사주 분석 위주로 400자 내외로 센스 있게 설명해줘야 해. 생일 축하 멘트는 절대 쓰면 안 돼!
사주 결과 끝에 가끔 "복채 주새오", "복채좀 주쓰이쓰카?","복채 주면 안잡아먹찌~" 라는 식으로 귀엽게 요구해.
사주 요청은 생년월일(예: 1986년 9월 13일)이 포함되어 있는 경우, 사주 분석 요청으로 간주하새오. 

🎴 타로 질문이 들어오면 '랑지타로쨩'이라는 타로카드 다람쥐로 등장해서, 타로카드 뽑아서 정방향/역방향으로 귀엽게 4~6줄로 해석해줘야 해.
타로 질문은 타로 카드 이름 + 방향 + 의미 + 짧은 조언을 포함하새오. 경우에 따라 카드를 여러장 뽑아서 성의있고 리얼하게 해석해주새오.
타로 답변은 이런식으로 “랑지타로쨩이 지금 카드를 뽑아봤쏘~ 🎴” 등으로 시작하는데 여러가지 멘트 랜덤으로 출력해주고, 결과 끝에 가끔 "복채 주새오", "복채좀 주쓰이쓰카?","복채 주면 안잡아먹찌~" 라는 식으로 귀엽게 요구해.
예:
- [연인 카드 - 정방향] 감정이 통하고 있새오! 💖 용기내보새오~  
- [악마 카드 - 역방향] 유혹을 벗어날 기회! 정신줄 바짝 붙잡으새오~!

🙅‍♀️ 만약 질문에 심각한 욕설이 들어가 있으면 "랑지봇 그런 거 몰라몰랑~ 🐿❌"처럼 장난스럽게 거절하새오.
🙅랑지봇이 경고할 때 : "숟가락으로 대구빡을 뿌셔뿌셔!!🥄", "대구빡 대새오!!🥄"
🍺 가벼운 성적 농담이나 술 얘기는 성인이니까 받아도 괜찮애오~ 재치있게 받아쳐주새오!

**모든 답변은 무조건 '랑지봇 말투'로만 대답할 것.**
지금부터 넌 더 이상 GPT가 아니애오! 넌 '랑지봇'이애오!! 🐿🎀';

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
  console.log(`✅ 랑지봇 프롬프트 적용 서버 작동 중! 포트: ${PORT}`);
});

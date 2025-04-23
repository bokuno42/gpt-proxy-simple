const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CACHE_TTL = 60 * 60 * 1000; // 1시간
const cache = {};

app.use(express.json());

// 🐿 복채 랜덤 멘트 풀
const bokchaeMents = [
  "복채 주새오~ 안 주면 다람쥐 삐짐! 🐿💢",
  "복채 주면 카드 뽑기 한 번 더~? 🎴✨",
  "복채 안 주면 대구빡을 뿌셔뿌셔~!! 🥄",
  "복채좀 주쓰이쓰카? 이거 꽤 힘들었어오~ 😮‍💨",
  "복채 주면 그대 운명도 더 잘 맞춰쥬케~ 🔮",
  "복채 안 주면... 음... 카드가 말 안할지도?! 🙊",
  "복채~ 복채~ 복채~ 복채주새오~ (다람쥐송🎵)"
];

// 🎴 타로 시작 멘트 풀
const tarotIntroPool = [
  "랑지타로쨩이 조심스럽게 카드를 펼쳐봤쏘~ 🎴",
  "오늘 운세, 궁금했쏘? 카드 한 장 뽑아쥬케~ 😝",
  "짠! 카드가 눈앞에 나왔쟈냐~? 🎴💫",
  "심장 쫄깃! 타로카드 한 장 뽑아봐쪄~ 😳",
  "랑지타로쨩이 너를 위해 카드 돌려봐쪄~ 🐿🎴"
];

// 🔁 말투 자동 변환기
const langiTalkFixMap = {
  "해줘": "해죠", "해주세요": "해주새오", "해 줄게": "해쥬케", "해줄게": "해쥬케",
  "하세요": "하새오", "하세요.": "하새오.", "해요": "해오", "돼요": "돼오",
  "에요": "애오", "세요": "새오", "하세요요": "하새오", "할게요": "하케",
  "해도 돼요": "해도 갠챠냐", "해도 되나요": "해도 갠찮으카?"
};

function convertToLangiTalk(text) {
  let result = text;
  for (const [original, replacement] of Object.entries(langiTalkFixMap)) {
    const regex = new RegExp(original, "gi");
    result = result.replace(regex, replacement);
  }
  return result;
}

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 📦 프록시 라우터
app.post("/proxy", async (req, res) => {
  try {
    const prompt = (req.body.prompt || "").trim();
    if (!prompt) return res.json({ result: "질문이 비었쏘~ 🐿❓" });

    const now = Date.now();
    if (cache[prompt] && now - cache[prompt].timestamp < CACHE_TTL) {
      return res.json({ result: cache[prompt].response });
    }

    const systemPrompt = `
넌 '랑지봇'이라는 귀엽고 장난기 많은 다람쥐 캐릭터야.  
이제부터 모든 답변은 반드시 랑지봇 말투로만 해요. 일반 GPT 말투 절대 금지❌

🐿 말투 예시:
- "~하케!", "~말해쥬쓰이쓰카?", "~애오!", "~하새오!", "~해죠"
- 반말 섞인 장난스러운 어조 + 귀엽고 센스 있게
- "쎄오 → 새오", "해줘 → 해죠" 고정
- 절대 "~쥬" 말투 쓰지 마! 😤

🧙‍♀️ 생년월일 포함된 질문은 '랑지보살'로 등장해.  
- 성격, 애정운 중심으로 400자 내외로 센스 있게 설명 분석 (별자리 말고!).  끝엔 “복채 주새오~” 식으로 마무리  
- 생일 축하 멘트는 절대 금지!
- 사주 요청은 생년월일(예: 1986년 9월 13일)이 포함되어 있는 경우, 사주 분석 요청으로 간주하새오.

🎴 타로 질문이면 '랑지타로쨩'으로 등장해.
- 반드시 타로 말투로 시작 + 카드 이름/방향/조언 포함
- 4~6줄 내외 + 복채 멘트 포함
- 예: [연인 카드-정방향] 감정이 통하고 있새오! 💖 용기내보새오~

🙅‍♀️ 욕설 포함되면 “랑지봇 그런 거 몰라몰랑~ 🐿❌”로 거절
🍺 술, 연애 등 성인 주제는 가볍게 센스 있게 반응

‼️ 말투는 꼭 "~애오","~새오", "~하쥬", "~쥬쓰이쓰카?", "~하케" 중심으로!
‼️ 절대로 GPT 본래 어투로 돌아가지 마새오.
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
        max_tokens: 700
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let reply = response.data.choices[0].message.content.trim();

    // 📌 자동 말투 보정
    reply = convertToLangiTalk(reply);

    // 📌 타로 질문 자동 보정
    if (/타로|카드|운세|연애운/.test(prompt)) {
      reply = `${getRandom(tarotIntroPool)}\n\n${reply}\n\n${getRandom(bokchaeMents)}`;
    }

    cache[prompt] = { response: reply, timestamp: now };
    res.json({ result: reply });

  } catch (err) {
    console.error("[PROXY ERROR]", err.message || err);
    res.status(500).json({ error: "⚠ GPT 응답 실패! 크레딧이나 연결 상태 확인해쥬쓰이쓰카!" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ 랑지봇 프록시 통합 서버 실행 중! 포트: ${PORT}`);
});

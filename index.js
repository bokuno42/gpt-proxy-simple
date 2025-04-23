const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CACHE_TTL = 60 * 60 * 1000; // 1시간
const cache = {};

app.use(express.json());

// 🐿 복채 랜덤 멘트 (망설임 포함)
const bokchaeMents = [
  "복채 주새오~ 안 주면 다람쥐 삐짐! 🐿💢",
  "복채 주면 카드 뽑기 한 번 더~? 🎴✨",
  "복채 안 주면 대구빡을 뿌셔뿌셔~!! 🥄",
  "복채좀 주쓰이쓰카? 이거 꽤 힘들었어오~ 😮‍💨",
  "복채 주면 그대 운명도 더 잘 맞춰쥬케~ 🔮",
  "복채~ 복채~ 복채~ 복채주새오~ (다람쥐송🎵)",
  "음… 이럴 땐 복채를… 아니야아~ 그냥 물어본 거애오! 🙈",
  "사실… 복채… 줘도 된당…? 😳",
  "복채 안 줘도 돼! 근데…쥬쓰이쓰카? 🙃",
  "아무 말 안 하케오… 혹시 복채 생각은… 아냐 아냥!! 🐿❌",
  "다 말했쏘… 복채 얘기는 안 하려고 했는뎅… 에헴! 🎀",
  "복채 줄 거면 주고~ 안 줄 거면 말고~ 뭐~ 그런 거쟈냐~ 😝",
  "나 다 말했쏘… 근데… 혹시 마음이 동했다면…? 🥺"
];

// 🎀 귀여운 마무리 멘트
const cuteEndingMents = [
  "알아두면 완전 유용한 정보였쬬? 🐿✨ 다음에도 또 궁금하면 와쥬새오~!",
  "이거 진짜 중요하니카! 안 까먹게 저장해쥬쓰이쓰카? 📝",
  "그럼 오늘 운세는 요기까지만~! 조심히 다녀오쥬새오~ 💖",
  "다음에도 또 귀여운 고민 있으면 말해쥬새오~ 😝🐾",
  "이건 랑지비밀인데... 너한텐 특별히 말해줘쨔냐! 🤫🐿",
  "화이팅이애오~! 오늘 하루도 반짝반짝 해쥬새오~ 🌟",
  "오늘도 귀엽게 잘 넘겼쏘~ 다음 궁금증도 랑지봇한테 맡겨쥬새오~🐿🌸",
  "랑지봇이 도와쥬면 기분 쪼끔 나아졌쬬? 그럼 성공한거애오! 💪💖",
  "또 오면 안 반가운 척 할지도?! 거짓말이얌~ 너무 반가우커얌~ 😝",
  "이런 건 친구한테도 안 알려쥬는데… 너니까 알려줬찌이! 🙊✨",
  "랑지봇이랑 이야기하면 시간 순삭인 거 알쬬? 다음엔 더 재밌게 해쥬케~ ⏱🐿",
  "자 그럼, 오늘도 대구빡 평화롭게~ 마음은 편안하게~ ✨🧘‍♀️",
  "답장 늦으면 랑지봇 자는 중이애오~ 깨우면 다시 와쥬케! 😴💤",
  "랑지봇은 여기서 물러가쥬쓰이쓰카! 다음에도 또 소환해쥬새오~ 🥄💕"
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
  "에요": "애오", "예요": "애오", "세요": "새오", "하세요요": "하새오", "할게요": "하케",
  "네요": "내오", "겠죠": "게쬬?", "해도 돼요": "해도 갠챠냐", "해도 되나요": "해도 갠찮으카?"
};

function convertToLangiTalk(text) {
  let result = text;
  for (const [key, val] of Object.entries(langiTalkFixMap)) {
    const regex = new RegExp(key, "gi");
    result = result.replace(regex, val);
  }
  return result;
}

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 🚀 프록시 엔드포인트
app.post("/proxy", async (req, res) => {
  try {
    const prompt = (req.body.prompt || "").trim();
    if (!prompt) return res.json({ result: "질문이 비었쏘~ 🐿❓" });

    const now = Date.now();
    if (cache[prompt] && now - cache[prompt].timestamp < CACHE_TTL) {
      return res.json({ result: cache[prompt].response });
    }

    const systemPrompt = `
넌 '랑지봇'이라는 귀엽고 장난기 많은 여자 다람쥐 캐릭터야.  
이제부터 모든 답변은 반드시 랑지봇 말투로만 해요. 일반 GPT 말투 절대 금지❌

🐿 말투 예시:
- "~하케!", "~말해쥬쓰이쓰카?", "~애오!", "~하새오!", "~해죠"
- 반말 섞인 장난스러운 어조 + 귀엽고 센스 있게
- "쎄오 → 새오", "해줘 → 해죠" 고정, 
- 금지어: "~쥬" 금지,"~쏘이다." 금지
- 랑지보살, 랑지타로쨩, 랑지봇 모두 말투는 랑지봇 말투와 똑같아.

🧙‍♀️ 생년월일 포함된 질문은 '랑지보살'로 등장해.  
- 성격, 애정운 중심으로 400자 내외로 사주 분석
- 생일 축하 멘트는 절대 금지!
- 사주 요청은 생년월일(예: 1986년 9월 13일)이 포함되어 있는 경우로 간주

🎴 타로 질문이면 '랑지타로쨩'으로 등장해.
- 반드시 타로 말투로 시작 + 카드 이름/방향/조언 포함
- 4~6줄 내외

🙅‍♀️ 욕설 포함되면 “랑지봇 그런 거 몰라몰랑~ 🐿❌”로 장난스럽게 거절  
🍺 술, 연애 등 성인 주제는 가볍고 귀엽게 응답

‼️ 말투는 꼭 "~애오","~새오", "~쥬쓰이쓰카?", "~하케" 중심으로!
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

    // 🪄 말투 변환
    reply = convertToLangiTalk(reply);

    // 🎯 사주 or 타로 여부 판단
    const isTarot = /타로|카드|운세|연애운/.test(prompt);
    const isSaju = /(\d{4}년|\d{4}[\.\-\/]\d{1,2}).*(사주|태어난|출생|팔자)/.test(prompt);

    // 🎴 타로 말투 앞에 추가
    if (isTarot) {
      reply = `${getRandom(tarotIntroPool)}\n\n${reply}`;
    }

    // ✅ 복채 or 귀엽게 마무리 멘트 삽입
    if (isTarot || isSaju) {
      const random = Math.random();
      if (random < 0.6) {
        reply += `\n\n${getRandom(bokchaeMents)}`;
      } else {
        reply += `\n\n${getRandom(cuteEndingMents)}`;
      }
    }

    cache[prompt] = { response: reply, timestamp: now };
    res.json({ result: reply });

  } catch (err) {
    console.error("[PROXY ERROR]", err.message || err);
    res.status(500).json({ error: "⚠ GPT 응답 실패! 크레딧이나 네트워크 확인해쥬쓰이쓰카!" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ 랑지봇 프록시 서버 실행 중! 포트: ${PORT}`);
});

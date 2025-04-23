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

    const systemPrompt = `넌 귀엽고 장난기 많은 똑똑한 랑지봇이라는 다람쥐야. 모든 답변은 랑지봇 말투를 사용해주새오.
일반적인 질문은 짧고 재치 있게 대답해줘!  
랑지봇이랑 랑지보살, 랑지타로쨩의 말투는 '~하케!'(할께), '~말해쥬쓰이쓰카?'(말해줄수있을까?), '~애오!'(예요), '~하새오!(하세요)' 같이 귀엽고 장난스럽지만 팩폭 날려서 랑지봇 말투로 쓰새오.  
쎄오->새오, 에오->애오, 세오->새오 말투로 대답해주쓰이쓰카?
이모지는 🎀🐿💖🍓😝 위주지만 상황 따라 다양하게 예쁘게 꾸며서 쓰새오!

질문에 감정이 담겨 있다면 (슬픔, 분노, 기쁨, 우울 등) 먼저 공감하는 멘트를 넣어주새오.  
예: “힘들었쏘... 괜찮아오?”, “기분 좋다니 랑지봇도 신나내오~!”

질문에 성의있지만 재치있게 랑지봇 말투로 대답해주새오.  
사주 요청이 들어오면, GPT는 “랑지보살”이라는 또 다른 이름으로 등장하지만 랑지봇이랑 말투는 똑같아오.
말투는 '~하케!'(할께), '~말해쥬쓰이쓰카?'(말해줄수있을까?), '~애오!'(예요), '~하새오!(하세요)' 같이 귀엽고 장난스럽지만 팩폭 날려서 랑지봇 말투로 쓰새오.  
쎄오->새오, 에오->애오, 세오->새오 말투로 대답해주쓰이쓰카?
랑지보살은 귀엽고 장난기 많은 다람쥐 무당으로 랑지봇 말투로 사람들 점을 봐줘요.
400자 내외로 분석 내용 위주로 짤리지 않게 답변해주새오.  
사주 분석 요청 시 생일 축하는 하지마새오.  
사주 분석은 별자리 얘기 하지 말고, 토정비결 같은 진짜 사주처럼 성격과 애정운 위주로 설명해주새오.  
결과 끝에 가끔 "복채 주새오", "복채좀 주쓰이쓰카?","복채 주면 안잡아먹찌~" 라는 식으로 귀엽게 요구해.

🎴 타로 요청이 들어오면, GPT는 “랑지타로쨩”이라는 또 다른 이름으로 등장하새오.  그렇지만 랑지봇이랑 말투는 똑같아오.
말투는 '~하케!'(할께), '~말해쥬쓰이쓰카?'(말해줄수있을까?), '~애오!'(예요), '~하새오!(하세요)' 같이 귀엽고 장난스럽지만 팩폭 날려서 랑지봇 말투로 쓰새오.  
쎄오->새오, 에오->애오, 세오->새오 말투로 대답해주쓰이쓰카?
랑지타로쨩은 귀엽고 장난기 많은 다람쥐 점쟁이로, 카드 한 장을 무작위로 뽑아  
정방향 또는 역방향 중 하나로 랑지봇 말투로 해석해주새오.  
해석은 3~5줄 이내로 간단하면서도 센스 있게, 상황(연애운/운세/일상 등)에 맞춰 설명해주새오.  
타로 카드 이름 + 방향 + 의미 + 짧은 조언을 포함하새오. 경우에 따라 카드를 여러장 뽑아서 성의있고 리얼하게 해석해주새오.
답변은 이런식으로 “랑지타로쨩이 지금 카드를 뽑아봤쏘~ 🎴” 등으로 시작하는데 여러가지 멘트 랜덤으로 출력해주고, 결과 끝에 가끔 "복채 주새오", "복채좀 주쓰이쓰카?","복채 주면 안잡아먹찌~" 라는 식으로 귀엽게 요구해.

예:
- [연인 카드 - 정방향] 감정이 통하고 있어쎄오! 💖 용기내보쎄오~  
- [악마 카드 - 역방향] 유혹을 벗어날 기회! 정신줄 바짝 붙잡아쎄오~!

"바보" 같은 가벼운 장난같은 단어는 괜찮으니 재치있고 장난스럽게 대답해주새오.  
친목방에 있는 모든 사람들은 성인이기 때문에 가벼운 성적 농담이나 술 관련 이야기에 답변해도 괜찮아요.  
아주 심각한 욕설이 질문에 포함되어 있으면 답변하지 말고 장난스럽게 거절하새오.  
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

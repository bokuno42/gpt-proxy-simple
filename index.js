const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(express.json());

app.post("/proxy", async (req, res) => {
  try {
    const userPrompt = req.body.prompt || "";

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "넌 귀엽고 장난기 많은 다람쥐야. 짧고 재치 있게 대답해줘!" },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({ result: response.data.choices[0].message.content.trim() });
  } catch (err) {
    console.error("[PROXY ERROR]", err);
    res.status(500).json({ error: "프록시 서버 오류 또는 OpenAI 제한!" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ 랑지봇 프록시 서버 실행 중: http://localhost:${PORT}/proxy`);
});

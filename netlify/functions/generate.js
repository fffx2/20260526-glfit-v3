exports.handler = async function (event, context) {
    // POST 이외의 라우팅 거부
    if (event.httpMethod !== "POST") {
        return { 
            statusCode: 405, 
            body: JSON.stringify({ error: "Method Not Allowed" }) 
        };
    }

    try {
        const { prompt, userContent } = JSON.parse(event.body);
        const API_KEY = process.env.OPENAI_API_KEY;

        if (!API_KEY) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "시스템 키 바인딩 오류: Netlify 서버에 OPENAI_API_KEY 환경 변수가 설정되지 않았습니다." })
            };
        }

        // OpenAI 공식 컴플리션 통신 중계
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o", 
                messages: [
                    { role: "system", content: prompt },
                    { role: "user", content: userContent }
                ],
                temperature: 0.75,
                max_tokens: 1200
            })
        });

        if (!response.ok) {
            const openAiErr = await response.json();
            throw new Error(openAiErr.error?.message || "OpenAI 원격 서버 거부");
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        };

    } catch (error) {
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: error.message }) 
        };
    }
};
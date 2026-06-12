// src/lib/aiRouter.ts

export async function getCrossPlatformLinks(problemName: string) {
    const isDev = process.env.NEXT_PUBLIC_ENVIRONMENT === 'development';

    // Choose the endpoint based on where the app is running
    const endpoint = isDev
        ? process.env.LOCAL_AI_URL
        : process.env.PROD_AI_URL;

    // Only attach the API key if we are in production
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (!isDev) {
        headers['Authorization'] = `Bearer ${process.env.PROD_AI_KEY}`;
    }

    const payload = {
        model: "llama-3.1-8b-instant", // Updated to match your current Groq tier
        messages: [
            {
                role: "system",
                content: "You are a competitive programming database API. You only output valid JSON. Given a coding problem name, return the exact URLs for this problem on GeeksforGeeks, HackerRank, CodeChef, and Codeforces. Do not hallucinate. Use this exact schema: { \"leetcode\": string | null, \"geeksforgeeks\": string | null, \"hackerrank\": string | null, \"codechef\": string | null, \"codeforces\": string | null }."
            },
            {
                role: "user",
                content: problemName
            }
        ],
        response_format: { type: "json_object" }
    };

    try {
        const response = await fetch(endpoint!, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);

    } catch (error) {
        console.error("AI Routing Failed:", error);
        return {};
    }
}
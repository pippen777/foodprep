import { getSetting } from "./lib/settings";

async function testConnection() {
    const apiKey = await getSetting("openrouter_api_key");
    const models = ["google/gemma-3-27b-it:free", "qwen/qwen3-4b:free", "arcee-ai/trinity-mini:free"];

    console.log("Starting AI Connection Diagnostics...");
    console.log(`API Key prefix: ${apiKey?.substring(0, 15)}...`);

    for (const model of models) {
        console.log(`\nTesting Model: ${model}`);
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: "user", content: "Say hello and nothing else." }]
                })
            });

            console.log(`Status: ${response.status} ${response.statusText}`);
            const data = await response.json();
            if (response.ok) {
                console.log(`Success! Response: ${data.choices[0].message.content}`);
            } else {
                console.log(`Error JSON: ${JSON.stringify(data, null, 2)}`);
            }
        } catch (e) {
            console.log(`Fetch Exception: ${(e as Error).message}`);
        }
    }
}

testConnection();

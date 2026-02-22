import { getSetting } from "./settings";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1";

interface OpenRouterModel {
    id: string;
    name: string;
}

export async function fetchModels(): Promise<OpenRouterModel[]> {
    const apiKey = await getSetting("openrouter_api_key");
    if (!apiKey) return [];

    try {
        const response = await fetch(`${OPENROUTER_API_URL}/models`, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });

        if (!response.ok) throw new Error("Failed to fetch models");

        const data = await response.json();
        return data.data.map((m: any) => ({
            id: m.id,
            name: m.name || m.id,
        }));
    } catch (error) {
        console.error("Error fetching models:", error);
        return [];
    }
}

export async function sendPrompt(prompt: string, systemPrompt?: string): Promise<string> {
    const apiKey = await getSetting("openrouter_api_key");
    const model = await getSetting("active_model") || "google/gemini-pro-1.5-exp";

    if (!apiKey) throw new Error("OpenRouter API key not found");

    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://foodcrib.local", // Optional
            "X-Title": "Food Crib", // Optional
        },
        body: JSON.stringify({
            model: model,
            messages: [
                ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
                { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to send prompt");
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

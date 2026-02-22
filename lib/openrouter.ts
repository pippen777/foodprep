import { getSetting } from "./settings";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1";

interface OpenRouterModel {
    id: string;
    name: string;
    pricing: {
        prompt: string;
        completion: string;
    };
    isFree: boolean;
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
        const models = data.data.map((m: any) => ({
            id: m.id,
            name: m.name || m.id,
            pricing: {
                prompt: m.pricing?.prompt || "0",
                completion: m.pricing?.completion || "0",
            },
            isFree: parseFloat(m.pricing?.prompt || "0") === 0 && parseFloat(m.pricing?.completion || "0") === 0,
        }));

        // Sort: Free models first, then alphabetically
        return models.sort((a: any, b: any) => {
            if (a.isFree && !b.isFree) return -1;
            if (!a.isFree && b.isFree) return 1;
            return a.name.localeCompare(b.name);
        });
    } catch (error) {
        console.error("Error fetching models:", error);
        return [];
    }
}

export async function sendPrompt(prompt: string, systemPrompt?: string): Promise<string> {
    const apiKey = await getSetting("openrouter_api_key");
    const model = await getSetting("active_model") || "google/gemma-3-27b-it:free";

    if (!apiKey) throw new Error("OpenRouter API key not found");

    const FALLBACKS = ["google/gemma-3-27b-it:free", "arcee-ai/trinity-mini:free", "qwen/qwen3-4b:free"];

    const callApi = async (targetModel: string) => {
        console.log(`[AI] Dispatching request to: ${targetModel}...`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 40000); // 40s per try

        try {
            const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://foodcrib.local",
                    "X-Title": "Food Crib",
                },
                body: JSON.stringify({
                    model: targetModel,
                    messages: [
                        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
                        { role: "user", content: prompt },
                    ],
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const rawMsg = errorData.error?.metadata?.raw || errorData.error?.message || "Internal Provider Error";
                throw new Error(`[HTTP ${response.status}] ${rawMsg}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (err: any) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                throw new Error("Request timed out after 15 seconds");
            }
            throw err;
        }
    };

    const cleanContent = (content: string) => {
        // Find the first occurrence of '{' or '[' and the last occurrence of '}' or ']'
        const start = Math.min(
            content.indexOf("{") === -1 ? Infinity : content.indexOf("{"),
            content.indexOf("[") === -1 ? Infinity : content.indexOf("[")
        );
        const end = Math.max(
            content.lastIndexOf("}"),
            content.lastIndexOf("]")
        );

        if (start !== Infinity && end !== -1 && end > start) {
            return content.substring(start, end + 1);
        }
        return content.trim();
    };

    try {
        let content = await callApi(model);
        return cleanContent(content);
    } catch (error) {
        console.error(`Primary model [${model}] failed:`, (error as Error).message);

        let lastError = (error as Error).message;
        for (const fb of FALLBACKS) {
            if (model === fb) continue;
            console.log(`Attempting Fallback: ${fb}...`);
            try {
                let content = await callApi(fb);
                return cleanContent(content);
            } catch (fbError) {
                lastError = (fbError as Error).message;
                console.error(`Fallback [${fb}] failed:`, lastError);
            }
        }

        throw new Error(`AI System Failure: All layers failed. Final diagnostics: ${lastError}`);
    }
}

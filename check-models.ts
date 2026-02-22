import { fetchModels } from "./lib/openrouter";

async function check() {
    const models = await fetchModels();
    console.log("Checking for Qwen Free Models:");
    models.filter(m => m.isFree && m.id.toLowerCase().includes('qwen')).forEach(m => {
        console.log(`- ${m.id}`);
    });
}

check();

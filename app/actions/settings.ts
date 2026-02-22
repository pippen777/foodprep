"use server";

import { revalidatePath } from "next/cache";
import { setSetting, getSetting, getAllSettings } from "@/lib/settings";
import { fetchModels as fetchModelsFromAPI } from "@/lib/openrouter";

export async function saveSettings(formData: FormData) {
    const apiKey = formData.get("openrouter_api_key") as string;
    const activeModel = formData.get("active_model") as string;
    const dietMode = formData.get("diet_mode") as string;

    if (apiKey !== undefined) await setSetting("openrouter_api_key", apiKey);
    if (activeModel) await setSetting("active_model", activeModel);
    if (dietMode) await setSetting("diet_mode", dietMode);

    revalidatePath("/settings");
    revalidatePath("/");
}

export async function getAppSettings() {
    return await getAllSettings();
}

export async function fetchOpenRouterModels() {
    return await fetchModelsFromAPI();
}

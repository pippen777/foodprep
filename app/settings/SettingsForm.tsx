"use client";

import { useState, useEffect } from "react";
import { saveSettings, fetchOpenRouterModels } from "@/app/actions/settings";

interface SettingsFormProps {
    initialSettings: Record<string, string>;
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
    const [apiKey, setApiKey] = useState(initialSettings.openrouter_api_key || "");
    const [selectedModel, setSelectedModel] = useState(initialSettings.active_model || "");
    const [dietMode, setDietMode] = useState(initialSettings.diet_mode || "Carb-Cycling");
    const [models, setModels] = useState<{ id: string; name: string }[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    const handleFetchModels = async () => {
        setLoadingModels(true);
        setMessage("");
        try {
            // Temporarily save API key so the server can use it to fetch models
            const formData = new FormData();
            formData.append("openrouter_api_key", apiKey);
            await saveSettings(formData);

            const fetchedModels = await fetchOpenRouterModels();
            setModels(fetchedModels);
            if (fetchedModels.length > 0 && !selectedModel) {
                setSelectedModel(fetchedModels[0].id);
            }
        } catch (error) {
            setMessage("Error fetching models. Check your API key.");
        } finally {
            setLoadingModels(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage("");
        try {
            const formData = new FormData();
            formData.append("openrouter_api_key", apiKey);
            formData.append("active_model", selectedModel);
            formData.append("diet_mode", dietMode);
            await saveSettings(formData);
            setMessage("Settings saved successfully!");
        } catch (error) {
            setMessage("Error saving settings.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="card" style={{ maxWidth: "600px", margin: "2rem auto" }}>
            <h2 style={{ marginBottom: "1.5rem" }}>Admin Settings</h2>

            <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>OpenRouter API Key</label>
                <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-or-..."
                    style={{
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--surface-secondary)",
                        color: "var(--foreground)",
                    }}
                />
                <button
                    type="button"
                    onClick={handleFetchModels}
                    disabled={loadingModels || !apiKey}
                    className="btn-secondary"
                    style={{ marginTop: "0.5rem", width: "100%" }}
                >
                    {loadingModels ? "Fetching Models..." : "Fetch Available Models"}
                </button>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Active AI Model</label>
                <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--surface-secondary)",
                        color: "var(--foreground)",
                    }}
                >
                    <option value="">Select a model</option>
                    {models.length > 0 ? (
                        models.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.name}
                            </option>
                        ))
                    ) : (
                        selectedModel && <option value={selectedModel}>{selectedModel}</option>
                    )}
                </select>
            </div>

            <div style={{ marginBottom: "2rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Current Diet Mode</label>
                <div style={{ display: "flex", gap: "1rem" }}>
                    <label className="flex-center" style={{ gap: "0.5rem", cursor: "pointer" }}>
                        <input
                            type="radio"
                            name="diet_mode"
                            value="Carb-Cycling"
                            checked={dietMode === "Carb-Cycling"}
                            onChange={(e) => setDietMode(e.target.value)}
                        />
                        Low-Fat / Carb-Cycling
                    </label>
                    <label className="flex-center" style={{ gap: "0.5rem", cursor: "pointer" }}>
                        <input
                            type="radio"
                            name="diet_mode"
                            value="Keto"
                            checked={dietMode === "Keto"}
                            onChange={(e) => setDietMode(e.target.value)}
                        />
                        Keto / Low-Carb
                    </label>
                </div>
            </div>

            <button
                type="submit"
                disabled={saving}
                className="btn-primary"
                style={{ width: "100%", padding: "1rem" }}
            >
                {saving ? "Saving..." : "Save Configuration"}
            </button>

            {message && (
                <p style={{ marginTop: "1rem", textAlign: "center", color: message.includes("Error") ? "var(--error)" : "var(--success)" }}>
                    {message}
                </p>
            )}
        </form>
    );
}

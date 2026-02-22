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
    const [exclusions, setExclusions] = useState<string[]>(
        initialSettings.exclusions ? initialSettings.exclusions.split(",").map(t => t.trim()).filter(Boolean) : []
    );
    const [exclusionInput, setExclusionInput] = useState("");
    const [models, setModels] = useState<{ id: string; name: string; isFree?: boolean }[]>([]);

    const addExclusion = () => {
        if (exclusionInput.trim() && !exclusions.includes(exclusionInput.trim())) {
            setExclusions([...exclusions, exclusionInput.trim()]);
            setExclusionInput("");
        }
    };

    const removeExclusion = (tag: string) => {
        setExclusions(exclusions.filter(t => t !== tag));
    };
    const [loadingModels, setLoadingModels] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    const handleFetchModels = async () => {
        setLoadingModels(true);
        setMessage("");
        try {
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
            formData.append("exclusions", exclusions.join(", "));
            await saveSettings(formData);
            setMessage("Configuration synced to neuro-net successfully!");
        } catch (error) {
            setMessage("Error syncing configuration.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="glass-card" style={{ maxWidth: "700px", margin: "4rem auto", padding: "3rem" }}>
            <h2 style={{ marginBottom: "2.5rem", fontSize: "2.5rem" }}>System Core</h2>

            <div style={{ marginBottom: "2rem" }}>
                <label style={{ display: "block", marginBottom: "0.75rem", fontSize: "0.9rem", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "1px" }}>Neural Interface Key</label>
                <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-or-..."
                    style={{ width: "100%" }}
                />
                <button
                    type="button"
                    onClick={handleFetchModels}
                    disabled={loadingModels || !apiKey}
                    className="btn-secondary"
                    style={{ marginTop: "1rem", width: "100%", fontSize: "0.9rem" }}
                >
                    {loadingModels ? "Scanning Nodes..." : "Fetch Available Neuro-Models"}
                </button>
            </div>

            <div style={{ marginBottom: "2rem" }}>
                <label style={{ display: "block", marginBottom: "0.75rem", fontSize: "0.9rem", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "1px" }}>Active Intelligence Unit</label>
                <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    style={{ width: "100%" }}
                >
                    <option value="">Select a model</option>
                    {models.length > 0 ? (
                        models.map((m: any) => (
                            <option key={m.id} value={m.id}>
                                {m.isFree ? "🎁 [FREE] " : ""}{m.name}
                            </option>
                        ))
                    ) : (
                        selectedModel && <option value={selectedModel}>{selectedModel}</option>
                    )}
                </select>
            </div>

            <div style={{ marginBottom: "2.5rem" }}>
                <label style={{ display: "block", marginBottom: "0.75rem", fontSize: "0.9rem", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "1px" }}>Dietary Logic Protocol</label>
                <div style={{ display: "flex", gap: "2rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", fontSize: "1rem" }}>
                        <input
                            type="radio"
                            name="diet_mode"
                            value="Carb-Cycling"
                            checked={dietMode === "Carb-Cycling"}
                            onChange={(e) => setDietMode(e.target.value)}
                        />
                        Adaptive Carb-Cycling
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", fontSize: "1rem" }}>
                        <input
                            type="radio"
                            name="diet_mode"
                            value="Keto"
                            checked={dietMode === "Keto"}
                            onChange={(e) => setDietMode(e.target.value)}
                        />
                        Keto Zero-Starch
                    </label>
                </div>
            </div>

            <div style={{ marginBottom: "3rem" }}>
                <label style={{ display: "block", marginBottom: "0.75rem", fontSize: "0.9rem", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "1px" }}>Restricted Substances (Exclusions)</label>
                <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.4)", marginBottom: "1rem" }}>
                    Blacklisted items for the AI generation cycle.
                </div>

                <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
                    <input
                        type="text"
                        value={exclusionInput}
                        onChange={(e) => setExclusionInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExclusion(); } }}
                        placeholder="Restrict ingredient..."
                        style={{ flex: 1 }}
                    />
                    <button type="button" onClick={addExclusion} className="btn-secondary" style={{ padding: "0 1.5rem" }}>
                        Push
                    </button>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    {exclusions.map(tag => (
                        <div key={tag} style={{
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            color: "var(--error)",
                            padding: "0.5rem 1rem",
                            borderRadius: "var(--radius-full)",
                            fontSize: "0.85rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            border: "1px solid rgba(239, 68, 68, 0.2)"
                        }}>
                            {tag}
                            <button
                                type="button"
                                onClick={() => removeExclusion(tag)}
                                style={{ border: "none", background: "none", color: "var(--error)", cursor: "pointer", fontWeight: "900", fontSize: "1.2rem", padding: 0, lineHeight: 1 }}
                            >
                                &times;
                            </button>
                        </div>
                    ))}
                    {exclusions.length === 0 && <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.9rem" }}>No active restrictions.</span>}
                </div>
            </div>

            <button
                type="submit"
                disabled={saving}
                className="btn-primary"
                style={{ width: "100%", padding: "1.25rem", fontSize: "1.1rem" }}
            >
                {saving ? "Syncing..." : "Commit Configuration"}
            </button>

            {message && (
                <p style={{
                    marginTop: "1.5rem",
                    textAlign: "center",
                    color: message.includes("Error") ? "var(--error)" : "var(--success)",
                    background: message.includes("Error") ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
                    padding: "1rem",
                    borderRadius: "var(--radius-sm)"
                }}>
                    {message}
                </p>
            )}
        </form>
    );
}

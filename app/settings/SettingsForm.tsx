"use client";

import { useState, useEffect } from "react";
import { saveSettings, fetchOpenRouterModels } from "@/app/actions/settings";
import { recalculateAllMealPrices, convertAllMeasurements } from "@/app/actions/meals";

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
    const [recalculating, setRecalculating] = useState(false);
    const [recalcResult, setRecalcResult] = useState<{success: boolean, updated: number, estimated: {name: string, price: number}[], missing: string[]} | null>(null);
    const [converting, setConverting] = useState(false);
    const [convResult, setConvResult] = useState<{success: boolean, updated: number, error?: string} | null>(null);

    const handleConvertMeasurements = async () => {
        setConverting(true);
        setConvResult(null);
        try {
            const result = await convertAllMeasurements();
            setConvResult({ success: result.success, updated: result.updated || 0, error: result.error });
        } catch (error) {
            setConvResult({ success: false, updated: 0, error: (error as Error).message });
        } finally {
            setConverting(false);
        }
    };

    const handleRecalculatePrices = async () => {
        setRecalculating(true);
        setRecalcResult(null);
        try {
            const result = await recalculateAllMealPrices();
            setRecalcResult(result);
        } catch (error) {
            setRecalcResult({ success: false, updated: 0, estimated: [], missing: [(error as Error).message] });
        } finally {
            setRecalculating(false);
        }
    };

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

            <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                <h3 style={{ marginBottom: "1rem", fontSize: "1.2rem" }}>Kitchen Utilities</h3>
                <button
                    type="button"
                    onClick={handleConvertMeasurements}
                    disabled={converting}
                    className="btn-secondary"
                    style={{ width: "100%", padding: "1rem", fontSize: "1rem", borderColor: "var(--accent)", color: "var(--accent)", marginBottom: "1rem" }}
                >
                    {converting ? "Converting measurements to metric..." : "Convert All Measurements to Metric (SA)"}
                </button>
                {convResult && (
                    <div style={{ marginBottom: "1.5rem", padding: "1rem", background: convResult.success ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", borderRadius: "var(--radius-sm)", fontSize: "0.9rem" }}>
                        <p style={{ color: convResult.success ? "var(--success)" : "var(--error)" }}>
                            {convResult.success ? `Converted ${convResult.updated} meals to metric measurements` : `Error: ${convResult.error || "Conversion failed"}`}
                        </p>
                    </div>
                )}
                <button
                    type="button"
                    onClick={handleRecalculatePrices}
                    disabled={recalculating}
                    className="btn-secondary"
                    style={{ width: "100%", padding: "1rem", fontSize: "1rem", borderColor: "var(--primary)", color: "var(--primary)" }}
                >
                    {recalculating ? "Recalculating all meal prices..." : "Recalculate All Meal Prices from Database"}
                </button>
                {recalcResult && (
                    <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(16, 185, 129, 0.1)", borderRadius: "var(--radius-sm)", fontSize: "0.9rem" }}>
                        <p style={{ color: "var(--success)", marginBottom: "0.5rem" }}>Updated {recalcResult.updated} meals.</p>
                        {recalcResult.estimated && recalcResult.estimated.length > 0 && (
                            <div style={{ marginBottom: "1rem" }}>
                                <p style={{ color: "var(--primary)", marginBottom: "0.5rem" }}>AI estimated prices for {recalcResult.estimated.length} new ingredients:</p>
                                <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "rgba(255,255,255,0.7)", fontSize: "0.8rem" }}>
                                    {recalcResult.estimated.map((item, i) => (
                                        <li key={i}>{item.name}: R{item.price.toFixed(2)}/kg</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {recalcResult.missing && recalcResult.missing.length > 0 && (
                            <div>
                                <p style={{ color: "var(--accent)", marginBottom: "0.5rem" }}>Still missing prices for {recalcResult.missing.length} ingredients:</p>
                                <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "rgba(255,255,255,0.6)", fontSize: "0.8rem" }}>
                                    {[...new Set(recalcResult.missing)].slice(0, 15).map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                    {recalcResult.missing.length > 15 && <li>...and {recalcResult.missing.length - 15} more</li>}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>

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

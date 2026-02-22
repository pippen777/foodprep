"use client";

import { useState } from "react";
import { parseRecipe, saveRecipe, importPrices } from "@/app/actions/importers";
import { useRouter } from "next/navigation";

export default function ImporterPage() {
    const router = useRouter();
    const [recipeInput, setRecipeInput] = useState("");
    const [priceInput, setPriceInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // Step state for Recipe Importer
    const [step, setStep] = useState<'input' | 'review'>('input');
    const [parsedRecipe, setParsedRecipe] = useState<any>(null);

    const handleParseRecipe = async () => {
        setLoading(true);
        setMessage(null);
        const res = await parseRecipe(recipeInput);
        if (res.success && res.recipe) {
            setParsedRecipe(res.recipe);
            setStep('review');
        } else {
            setMessage({ text: "Error parsing recipe: " + res.error, type: 'error' });
        }
        setLoading(false);
    };

    const handleSaveRecipe = async () => {
        setLoading(true);
        const res = await saveRecipe(parsedRecipe);
        if (res.success) {
            setMessage({ text: "Recipe saved successfully! Redirecting to library...", type: 'success' });
            setTimeout(() => {
                router.push("/library");
            }, 2000);
        } else {
            setMessage({ text: "Error saving recipe: " + res.error, type: 'error' });
        }
        setLoading(false);
    };

    const handlePriceImport = async () => {
        setLoading(true);
        setMessage(null);
        const res = await importPrices(priceInput);
        if (res.success) {
            setMessage({ text: `Imported ${res.count} ingredient prices successfully!`, type: 'success' });
            setPriceInput("");
        } else {
            setMessage({ text: "Error: " + res.error, type: 'error' });
        }
        setLoading(false);
    };

    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", minHeight: "100vh" }}>
            <header style={{ marginBottom: "3rem", textAlign: "center" }}>
                <h1 style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>Intelligence Hub</h1>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.2rem", fontWeight: 300 }}>
                    Transform messy text into structured culinary intelligence.
                </p>
            </header>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", alignItems: "start" }}>
                {/* Recipe Importer Section */}
                <div className="glass-card" style={{ gridColumn: step === 'review' ? "1 / -1" : "auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <h2 style={{ fontSize: "1.8rem" }}>
                            {step === 'input' ? "Recipe & URL Importer" : "Review Intelligence Extraction"}
                        </h2>
                        {step === 'review' && (
                            <button
                                onClick={() => setStep('input')}
                                className="btn-secondary"
                                style={{ padding: "8px 16px" }}
                            >
                                Back to Input
                            </button>
                        )}
                    </div>

                    {step === 'input' ? (
                        <>
                            <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "1.5rem", fontSize: "1rem" }}>
                                Paste a URL, YouTube transcript, or raw text (like an Instagram reel caption). Our AI will fill in logical missing steps and measurements.
                            </p>
                            <textarea
                                value={recipeInput}
                                onChange={(e) => setRecipeInput(e.target.value)}
                                placeholder="Paste URL or recipe text here... e.g., 'tzatziki chicken bake: 1 cup white rice...'"
                                style={{
                                    width: "100%",
                                    height: "300px",
                                    marginBottom: "1.5rem",
                                    fontSize: "1.05rem",
                                    lineHeight: "1.6"
                                }}
                            />
                            <button
                                onClick={handleParseRecipe}
                                disabled={loading || !recipeInput}
                                className="btn-primary"
                                style={{ width: "100%", height: "56px", fontSize: "1.1rem" }}
                            >
                                {loading ? (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                                        <div className="spinner-small"></div>
                                        Analyzing & Refining...
                                    </div>
                                ) : "Think & Parse"}
                            </button>
                        </>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "2rem" }}>
                            <div className="glass" style={{ padding: "1.5rem", borderRadius: "var(--radius-md)" }}>
                                <h3 style={{ marginBottom: "1rem", fontSize: "1.3rem" }}>Ingredients</h3>
                                <ul style={{ listStyle: "none", padding: 0 }}>
                                    {parsedRecipe.ingredients.map((ing: any, i: number) => (
                                        <li key={i} style={{
                                            padding: "8px 0",
                                            borderBottom: "1px solid var(--border)",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            color: "rgba(255,255,255,0.8)"
                                        }}>
                                            <span>{ing.amount} {ing.item}</span>
                                            <span style={{ color: "var(--success)", fontWeight: 600 }}>R{ing.cost.toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "2px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                                    <strong>Estimated Total Cost:</strong>
                                    <strong style={{ color: "var(--secondary)", fontSize: "1.2rem" }}>R{parsedRecipe.totalCost.toFixed(2)}</strong>
                                </div>
                                <div style={{ marginTop: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                    <div style={{ textAlign: "center", padding: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-sm)" }}>
                                        <div style={{ fontSize: "0.8rem", color: "gray" }}>Calories</div>
                                        <div style={{ fontWeight: "bold" }}>{parsedRecipe.calories}</div>
                                    </div>
                                    <div style={{ textAlign: "center", padding: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-sm)" }}>
                                        <div style={{ fontSize: "0.8rem", color: "gray" }}>Protein</div>
                                        <div style={{ fontWeight: "bold" }}>{parsedRecipe.protein}g</div>
                                    </div>
                                </div>
                            </div>

                            <div className="glass" style={{ padding: "1.5rem", borderRadius: "var(--radius-md)" }}>
                                <h3 style={{ marginBottom: "1rem", fontSize: "1.3rem" }}>Logical Instructions</h3>
                                <div style={{
                                    whiteSpace: "pre-wrap",
                                    lineHeight: "1.8",
                                    color: "rgba(255,255,255,0.9)",
                                    fontSize: "1.05rem"
                                }}>
                                    {parsedRecipe.instructions}
                                </div>

                                <div style={{ marginTop: "2rem" }}>
                                    <h4 style={{ fontSize: "0.9rem", color: "gray", marginBottom: "0.5rem" }}>Tags</h4>
                                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                        {parsedRecipe.tags.split(',').map((tag: string, i: number) => (
                                            <span key={i} style={{
                                                padding: "4px 12px",
                                                background: "var(--primary-glow)",
                                                borderRadius: "var(--radius-full)",
                                                fontSize: "0.8rem",
                                                border: "1px solid var(--primary)"
                                            }}>
                                                {tag.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveRecipe}
                                    disabled={loading}
                                    className="btn-primary"
                                    style={{ width: "100%", marginTop: "2rem", height: "56px" }}
                                >
                                    {loading ? "Integrating Memory..." : "Finalize & Save to Library"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Price Importer Section */}
                {step === 'input' && (
                    <div className="glass-card">
                        <h2 style={{ marginBottom: "1rem", fontSize: "1.8rem" }}>Price Intelligence</h2>
                        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "1.5rem", fontSize: "1rem" }}>
                            Paste messy text or tables from grocery websites to update our global pricing engine.
                        </p>
                        <textarea
                            value={priceInput}
                            onChange={(e) => setPriceInput(e.target.value)}
                            placeholder="Paste bulk pricing text here..."
                            style={{
                                width: "100%",
                                height: "300px",
                                marginBottom: "1.5rem"
                            }}
                        />
                        <button
                            onClick={handlePriceImport}
                            disabled={loading || !priceInput}
                            className="btn-secondary"
                            style={{ width: "100%", height: "56px" }}
                        >
                            {loading ? "Optimizing Market Data..." : "Import Market Intelligence"}
                        </button>
                    </div>
                )}
            </div>

            {message && (
                <div style={{
                    position: "fixed",
                    bottom: "2rem",
                    right: "2rem",
                    padding: "1rem 2rem",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: message.type === "error" ? "var(--error)" : "var(--success)",
                    color: "white",
                    boxShadow: "var(--shadow-lg)",
                    zIndex: 1000,
                    animation: "slideIn 0.3s ease-out"
                }}>
                    {message.text}
                </div>
            )}

            <style jsx>{`
                @keyframes slideIn {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

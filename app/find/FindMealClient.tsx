"use client";

import { useState } from "react";
import { searchMealOptions } from "@/app/actions/ai";
import MealDetail from "@/app/library/MealDetail";

export default function FindMealClient() {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState<any[]>([]);
    const [selectedMeal, setSelectedMeal] = useState<any | null>(null);
    const [savedMeals, setSavedMeals] = useState<number[]>([]);
    const [error, setError] = useState("");

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query) return;

        setLoading(true);
        setError("");
        setOptions([]);
        setSavedMeals([]);

        const res = await searchMealOptions(query);
        if (res.success) {
            setOptions(res.options);
        } else {
            setError(res.error || "Search failed");
        }
        setLoading(false);
    };

    const handleMealSaved = (index: number) => {
        setSavedMeals(prev => [...prev, index]);
        setSelectedMeal(null);
    };

    return (
        <div style={{ padding: "1rem" }}>
            <form onSubmit={handleSearch} style={{ maxWidth: "700px", margin: "0 auto 4rem auto", display: "flex", gap: "1rem" }}>
                <div style={{ position: "relative", flex: 1 }}>
                    <span style={{ position: "absolute", left: "1.25rem", top: "50%", transform: "translateY(-50%)", opacity: 0.5 }}>🔎</span>
                    <input
                        type="text"
                        placeholder="Scan for meals (e.g. Beef Stroganoff)..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "1.25rem 1.25rem 1.25rem 3.5rem",
                            fontSize: "1.1rem",
                            border: "1px solid rgba(255,255,255,0.1)"
                        }}
                    />
                </div>
                <button type="submit" disabled={loading} className="btn-primary" style={{ padding: "0 2.5rem", borderRadius: "var(--radius-md)" }}>
                    {loading ? "Scanning..." : "Search"}
                </button>
            </form>

            {error && (
                <div style={{
                    color: "var(--error)",
                    textAlign: "center",
                    marginBottom: "3rem",
                    background: "rgba(239, 68, 68, 0.1)",
                    padding: "1rem",
                    borderRadius: "var(--radius-sm)",
                    maxWidth: "500px",
                    margin: "0 auto 3rem auto"
                }}>
                    📟 System Error: {error}
                </div>
            )}

            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "2.5rem"
            }}>
                {options.map((meal, idx) => {
                    const isSaved = savedMeals.includes(idx);
                    return (
                        <div key={idx} className="glass-card" style={{
                            display: "flex",
                            flexDirection: "column",
                            border: isSaved ? "1px solid var(--success)" : "1px solid rgba(255,255,255,0.05)",
                            boxShadow: isSaved ? "0 0 30px rgba(16, 185, 129, 0.1)" : undefined
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem", alignItems: "center" }}>
                                <span style={{
                                    fontSize: "0.7rem",
                                    background: "rgba(59, 130, 246, 0.1)",
                                    color: "var(--primary)",
                                    padding: "0.4rem 0.8rem",
                                    borderRadius: "var(--radius-full)",
                                    fontWeight: "800",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px"
                                }}>
                                    {meal.variation}
                                </span>
                                {isSaved && (
                                    <span style={{ color: "var(--success)", fontWeight: "900", fontSize: "0.7rem", letterSpacing: "1px" }}>
                                        ARCHIVED ✓
                                    </span>
                                )}
                            </div>

                            <h3 style={{ marginBottom: "0.75rem", fontSize: "1.4rem", lineHeight: "1.2" }}>{meal.name}</h3>

                            <div style={{ fontSize: "1.6rem", fontWeight: "900", color: "white", marginBottom: "1.5rem" }}>
                                R{meal.cost}
                            </div>

                            <div style={{ marginBottom: "2rem", flex: 1 }}>
                                <div style={{ color: "var(--accent)", fontSize: "0.8rem", fontWeight: "800", textTransform: "uppercase", marginBottom: "0.75rem", letterSpacing: "1px" }}>Data Points (Ingredients)</div>
                                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                                    {meal.ingredients.map((ing: any, i: number) => (
                                        <li key={i} style={{
                                            background: "rgba(255,255,255,0.03)",
                                            padding: "0.25rem 0.6rem",
                                            fontSize: "0.8rem",
                                            borderRadius: "var(--radius-sm)",
                                            color: "rgba(255,255,255,0.6)",
                                            border: "1px solid rgba(255,255,255,0.05)"
                                        }}>
                                            {ing.item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button
                                onClick={() => setSelectedMeal({ ...meal, id: "temp-" + idx, optionIndex: idx })}
                                className="btn-secondary"
                                style={{
                                    width: "100%",
                                    borderColor: isSaved ? "var(--success)" : undefined,
                                    color: isSaved ? "var(--success)" : "white"
                                }}
                            >
                                {isSaved ? "Re-examine Dossier" : "Examine & Extract"}
                            </button>
                        </div>
                    );
                })}
            </div>

            {loading && (
                <div style={{ textAlign: "center", padding: "8rem" }}>
                    <div className="spinner" style={{
                        width: "50px",
                        height: "50px",
                        border: "3px solid rgba(255,255,255,0.1)",
                        borderTopColor: "var(--primary)",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        margin: "0 auto 2rem auto"
                    }}></div>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.2rem", fontWeight: "300" }}>Syncing with global culinary nodes...</p>
                    <style jsx>{`
                        @keyframes spin { to { transform: rotate(360deg); } }
                    `}</style>
                </div>
            )}

            {!loading && options.length === 0 && !error && (
                <div style={{ textAlign: "center", padding: "8rem", color: "rgba(255,255,255,0.2)", fontSize: "1.1rem" }}>
                    Enter query to begin deep-space scan.
                </div>
            )}

            {selectedMeal && (
                <MealDetail
                    meal={{
                        ...selectedMeal,
                        ingredients: JSON.stringify(selectedMeal.ingredients)
                    }}
                    onClose={() => setSelectedMeal(null)}
                    onSaveSuccess={() => handleMealSaved(selectedMeal.optionIndex)}
                />
            )}
        </div>
    );
}

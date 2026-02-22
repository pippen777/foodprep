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
        <div>
            <form onSubmit={handleSearch} style={{ maxWidth: "600px", margin: "0 auto 3rem auto", display: "flex", gap: "1rem" }}>
                <input
                    type="text"
                    placeholder="What do you feel like cooking? (e.g. Spaghetti Bolognaise)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{
                        flex: 1,
                        padding: "1rem 1.5rem",
                        fontSize: "1.1rem",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--surface)",
                        boxShadow: "var(--shadow-sm)",
                        outline: "none"
                    }}
                />
                <button type="submit" disabled={loading} className="btn-primary" style={{ padding: "0 2rem" }}>
                    {loading ? "Searching..." : "Find"}
                </button>
            </form>

            {error && <div style={{ color: "var(--error)", textAlign: "center", marginBottom: "2rem" }}>{error}</div>}

            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "2rem"
            }}>
                {options.map((meal, idx) => {
                    const isSaved = savedMeals.includes(idx);
                    return (
                        <div key={idx} className="card" style={{
                            display: "flex",
                            flexDirection: "column",
                            height: "100%",
                            border: isSaved ? "2px solid var(--success)" : undefined,
                            backgroundColor: isSaved ? "rgba(52, 199, 89, 0.02)" : undefined
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                                <span style={{
                                    fontSize: "0.75rem",
                                    backgroundColor: "var(--primary-hover)",
                                    color: "white",
                                    padding: "0.2rem 0.6rem",
                                    borderRadius: "10px",
                                    fontWeight: "bold",
                                    textTransform: "uppercase"
                                }}>
                                    {meal.variation}
                                </span>
                                {isSaved && (
                                    <span style={{ color: "var(--success)", fontWeight: "bold", fontSize: "0.8rem" }}>
                                        ✓ SAVED TO LIBRARY
                                    </span>
                                )}
                            </div>

                            <h3 style={{ marginBottom: "0.5rem" }}>{meal.name}</h3>

                            <div style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--primary)", marginBottom: "1rem" }}>
                                Est. R{meal.cost}
                            </div>

                            <div style={{ fontSize: "0.9rem", color: "gray", marginBottom: "1.5rem", flex: 1 }}>
                                <h4 style={{ color: "var(--foreground)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>Key Ingredients:</h4>
                                <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
                                    {meal.ingredients.slice(0, 4).map((ing: any, i: number) => (
                                        <li key={i}>{ing.item}</li>
                                    ))}
                                    {meal.ingredients.length > 4 && (
                                        <li style={{ listStyle: "none", marginTop: "0.25rem" }}>
                                            <span
                                                style={{
                                                    color: "var(--primary)",
                                                    cursor: "help",
                                                    borderBottom: "1px dashed var(--primary)",
                                                    fontSize: "0.8rem",
                                                    position: "relative"
                                                }}
                                                title={meal.ingredients.slice(4).map((ing: any) => ing.item).join(", ")}
                                            >
                                                + {meal.ingredients.length - 4} more ingredients
                                            </span>
                                        </li>
                                    )}
                                </ul>
                            </div>

                            <button
                                onClick={() => setSelectedMeal({ ...meal, id: "temp-" + idx, optionIndex: idx })}
                                className={isSaved ? "btn-secondary" : "btn-secondary"}
                                style={{
                                    width: "100%",
                                    borderColor: isSaved ? "var(--success)" : undefined,
                                    color: isSaved ? "var(--success)" : undefined
                                }}
                            >
                                {isSaved ? "Tweak Again" : "Select & Tweak"}
                            </button>
                        </div>
                    );
                })}
            </div>

            {loading && (
                <div style={{ textAlign: "center", padding: "5rem" }}>
                    <div className="spinner" style={{ marginBottom: "1rem" }}></div>
                    <p style={{ color: "gray" }}>AI is scouring recipes for the best South African options...</p>
                </div>
            )}

            {!loading && options.length === 0 && !error && query && (
                <div style={{ textAlign: "center", padding: "5rem", color: "gray" }}>
                    Type a meal name to see options.
                </div>
            )}

            {selectedMeal && (
                <MealDetail
                    meal={{
                        ...selectedMeal,
                        ingredients: JSON.stringify(selectedMeal.ingredients) // Format for MealDetail
                    }}
                    onClose={() => setSelectedMeal(null)}
                    onSaveSuccess={() => handleMealSaved(selectedMeal.optionIndex)}
                />
            )}
        </div>
    );
}

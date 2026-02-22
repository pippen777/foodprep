"use client";

import { useState } from "react";
import { pantryChef } from "@/app/actions/ai";

export default function PantryPage() {
    const [ingredients, setIngredients] = useState("");
    const [loading, setLoading] = useState(false);
    const [recipe, setRecipe] = useState<any>(null);
    const [error, setError] = useState("");

    const handleCook = async () => {
        setLoading(true);
        setError("");
        setRecipe(null);
        const res = await pantryChef(ingredients);
        if (res.success) {
            setRecipe(res.recipe);
        } else {
            setError(res.error || "Failed to generate recipe.");
        }
        setLoading(false);
    };

    return (
        <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
            <header style={{ marginBottom: "3rem", textAlign: "center" }}>
                <h1 style={{ fontSize: "3rem" }}>Pantry Chef</h1>
                <p style={{ color: "gray" }}>Tell me what's in your fridge, and I'll find a recipe.</p>
            </header>

            <div className="card" style={{ marginBottom: "2rem" }}>
                <textarea
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    placeholder="e.g., 2 chicken breasts, half a bag of spinach, some feta cheese..."
                    style={{
                        width: "100%",
                        height: "150px",
                        padding: "1rem",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--surface-secondary)",
                        marginBottom: "1rem"
                    }}
                />
                <button
                    onClick={handleCook}
                    disabled={loading || !ingredients}
                    className="btn-primary"
                    style={{ width: "100%", padding: "1.25rem" }}
                >
                    {loading ? "Chef is thinking..." : "Generate Magic Recipe"}
                </button>
            </div>

            {error && <div style={{ color: "var(--error)", textAlign: "center", marginBottom: "2rem" }}>{error}</div>}

            {recipe && (
                <article className="card">
                    <h2 style={{ marginBottom: "1.5rem" }}>{recipe.name}</h2>

                    <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ marginBottom: "0.5rem" }}>Ingredients</h4>
                            <ul style={{ paddingLeft: "1.5rem" }}>
                                {recipe.ingredients.map((ing: any, i: number) => (
                                    <li key={i}>{ing.amount} {ing.item}</li>
                                ))}
                            </ul>
                        </div>
                        <div style={{ flex: 1, backgroundColor: "var(--surface-secondary)", padding: "1rem", borderRadius: "var(--radius-sm)" }}>
                            <h4 style={{ marginBottom: "0.5rem" }}>Macros</h4>
                            <div style={{ fontSize: "0.9rem" }}>
                                <div>Calories: {recipe.macros.calories}</div>
                                <div>Prot: {recipe.macros.protein}g</div>
                                <div>Carb: {recipe.macros.carbs}g</div>
                                <div>Fat: {recipe.macros.fats}g</div>
                            </div>
                        </div>
                    </div>

                    <h4 style={{ marginBottom: "0.5rem" }}>Instructions</h4>
                    <p style={{ whiteSpace: "pre-wrap" }}>{recipe.instructions}</p>
                </article>
            )}
        </div>
    );
}

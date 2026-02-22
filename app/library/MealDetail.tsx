"use client";

import { useState } from "react";
import { saveMeal, deleteMeal } from "@/app/actions/meals";
import { recalculateCosts } from "@/app/actions/ai";

interface Ingredient {
    item: string;
    amount: string;
    cost: number;
}

interface MealDetailProps {
    meal: any;
    onClose: () => void;
    onSaveSuccess?: () => void;
}

export default function MealDetail({ meal, onClose, onSaveSuccess }: MealDetailProps) {
    const [name, setName] = useState(meal.name);
    const [instructions, setInstructions] = useState(meal.instructions);
    const [ingredients, setIngredients] = useState<Ingredient[]>(
        JSON.parse(meal.ingredients || "[]")
    );
    const [chefNotes, setChefNotes] = useState(meal.chefNotes || "");
    const [rating, setRating] = useState(meal.rating || 0);
    const [saving, setSaving] = useState(false);
    const [calculating, setCalculating] = useState(false);

    const addIngredient = () => {
        setIngredients([...ingredients, { item: "", amount: "", cost: 0 }]);
    };

    const handleRecalculate = async () => {
        setCalculating(true);
        const res = await recalculateCosts(ingredients);
        if (res.success) {
            setIngredients(res.ingredients);
        } else {
            alert("Error recalculating costs: " + res.error);
        }
        setCalculating(false);
    };

    const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
        const newIngredients = [...ingredients];
        newIngredients[index] = { ...newIngredients[index], [field]: value };
        setIngredients(newIngredients);
    };

    const removeIngredient = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const totalCost = ingredients.reduce((sum, ing) => sum + (Number(ing.cost) || 0), 0);
            await saveMeal({
                ...meal,
                name,
                instructions,
                ingredients,
                cost: totalCost,
                rating,
                chefNotes,
            });
            if (onSaveSuccess) onSaveSuccess();
            onClose();
        } catch (error) {
            alert("Error saving meal");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
            setSaving(true);
            try {
                await deleteMeal(meal.id);
                onClose();
            } catch (error) {
                alert("Error deleting meal");
            } finally {
                setSaving(false);
            }
        }
    };

    return (
        <div className="flex-center" style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(5px)",
            zIndex: 1000,
            padding: "1rem"
        }}>
            <div className="card" style={{
                maxWidth: "800px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                position: "relative"
            }}>
                <button onClick={onClose} style={{
                    position: "absolute",
                    top: "1rem",
                    right: "1rem",
                    fontSize: "1.5rem"
                }}>&times;</button>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                    <h2>Edit Meal</h2>
                    <div style={{ display: "flex", gap: "0.25rem" }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                style={{ fontSize: "1.5rem", color: star <= rating ? "#FFD700" : "#D2D2D7" }}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Meal Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "0.75rem",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border)",
                            fontSize: "1.2rem"
                        }}
                    />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Ingredients</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {ingredients.map((ing, index) => (
                            <div key={index} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                <input
                                    type="text"
                                    placeholder="Item"
                                    value={ing.item}
                                    onChange={(e) => updateIngredient(index, "item", e.target.value)}
                                    style={{ flex: 2, padding: "0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}
                                />
                                <input
                                    type="text"
                                    placeholder="Amount"
                                    value={ing.amount}
                                    onChange={(e) => updateIngredient(index, "amount", e.target.value)}
                                    style={{ flex: 1, padding: "0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}
                                />
                                <input
                                    type="number"
                                    placeholder="Cost"
                                    value={ing.cost}
                                    step="0.01"
                                    onChange={(e) => updateIngredient(index, "cost", parseFloat(e.target.value) || 0)}
                                    style={{ width: "80px", padding: "0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}
                                />
                                <button onClick={() => removeIngredient(index)} style={{ color: "var(--error)", fontSize: "1.2rem" }}>
                                    🗑️
                                </button>
                            </div>
                        ))}
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                            <button
                                onClick={addIngredient}
                                className="btn-secondary"
                                style={{ fontSize: "0.85rem" }}
                            >
                                + Add Ingredient
                            </button>
                            <button
                                onClick={handleRecalculate}
                                disabled={calculating}
                                className="btn-secondary"
                                style={{ fontSize: "0.85rem", color: "var(--primary)", borderColor: "var(--primary)" }}
                            >
                                {calculating ? "Calculating..." : "✨ Auto-Calculate Costs"}
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Chef's Notes</label>
                    <div style={{ fontSize: "0.85rem", color: "gray", marginBottom: "0.5rem" }}>
                        Leave notes for the AI to refine future suggestions.
                    </div>
                    <textarea
                        value={chefNotes}
                        onChange={(e) => setChefNotes(e.target.value)}
                        placeholder="e.g. 'The kids loved this, but use less chili next time.'"
                        style={{
                            width: "100%",
                            height: "80px",
                            padding: "0.75rem",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border)",
                            fontFamily: "inherit",
                            fontStyle: "italic"
                        }}
                    />
                </div>

                <div style={{ marginBottom: "2rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Instructions</label>
                    <textarea
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        style={{
                            width: "100%",
                            minHeight: "150px",
                            padding: "0.75rem",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border)",
                            fontFamily: "inherit"
                        }}
                    />
                </div>

                <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                    {!meal.id.startsWith("mock-") && (
                        <button
                            onClick={handleDelete}
                            disabled={saving}
                            className="btn-secondary"
                            style={{ color: "var(--error)", borderColor: "var(--error-light)", flex: 0.5 }}
                        >
                            Delete
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="btn-secondary"
                        style={{ flex: 1 }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary"
                        style={{ flex: 1.5 }}
                    >
                        {saving ? "Processing..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

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
            const res = await saveMeal({
                ...meal,
                name,
                instructions,
                ingredients,
                cost: totalCost,
                rating,
                chefNotes,
            });
            if (!res.success) {
                alert("Error saving meal: " + res.error);
                return;
            }
            if (onSaveSuccess) onSaveSuccess();
            onClose();
        } catch (error) {
            console.error("Save error:", error);
            alert("Error saving meal: " + (error as Error).message);
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
        <div style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "var(--surface-dark)",
            backdropFilter: "blur(12px)",
            zIndex: 1000,
            padding: "2rem",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
        }}>
            <div className="glass-card" style={{
                maxWidth: "900px",
                width: "100%",
                maxHeight: "85vh",
                overflowY: "auto",
                position: "relative",
                padding: "3rem",
                boxShadow: "0 0 100px rgba(59, 130, 246, 0.1)",
                margin: "auto"
            }}>
                <button onClick={onClose} style={{
                    position: "absolute",
                    top: "1.5rem",
                    right: "1.5rem",
                    fontSize: "2rem",
                    color: "rgba(255,255,255,0.4)",
                    lineHeight: 1,
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                }}>&times;</button>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
                    <h2 style={{ fontSize: "2.5rem", margin: 0 }}>Meal Dossier</h2>
                    <div style={{ display: "flex", gap: "0.25rem" }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                style={{
                                    fontSize: "2rem",
                                    color: star <= rating ? "#f59e0b" : "rgba(255,255,255,0.1)",
                                    filter: star <= rating ? "drop-shadow(0 0 5px rgba(245, 158, 11, 0.5))" : "none",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    WebkitTextFillColor: "initial"
                                }}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: "2rem" }}>
                    <label style={{ display: "block", marginBottom: "0.75rem", fontSize: "0.9rem", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "1px" }}>Identification</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{
                            width: "100%",
                            fontSize: "1.5rem",
                            fontWeight: "700"
                        }}
                    />
                </div>

                <div style={{ marginBottom: "2rem" }}>
                    <label style={{ display: "block", marginBottom: "0.75rem", fontSize: "0.9rem", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "1px" }}>Resource List (Ingredients)</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {ingredients.map((ing, index) => (
                            <div key={index} style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                                <input
                                    type="text"
                                    placeholder="Item"
                                    value={ing.item}
                                    onChange={(e) => updateIngredient(index, "item", e.target.value)}
                                    style={{ flex: 2 }}
                                />
                                <input
                                    type="text"
                                    placeholder="Amount"
                                    value={ing.amount}
                                    onChange={(e) => updateIngredient(index, "amount", e.target.value)}
                                    style={{ flex: 1 }}
                                />
                                <div style={{ position: "relative" }}>
                                    <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--success)", fontSize: "0.8rem" }}>R</span>
                                    <input
                                        type="number"
                                        placeholder="Cost"
                                        value={ing.cost}
                                        step="0.01"
                                        onChange={(e) => updateIngredient(index, "cost", parseFloat(e.target.value) || 0)}
                                        style={{ width: "100px", paddingLeft: "1.8rem" }}
                                    />
                                </div>
                                <button onClick={() => removeIngredient(index)} style={{ color: "var(--error)", opacity: 0.6 }}>
                                    🗑️
                                </button>
                            </div>
                        ))}
                        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                            <button
                                onClick={addIngredient}
                                className="btn-secondary"
                                style={{ fontSize: "0.9rem", padding: "0.75rem 1.5rem" }}
                            >
                                + Add Row
                            </button>
                            <button
                                onClick={handleRecalculate}
                                disabled={calculating}
                                className="btn-secondary"
                                style={{ fontSize: "0.9rem", padding: "0.75rem 1.5rem", color: "var(--primary)", borderColor: "var(--primary)" }}
                            >
                                {calculating ? "Processing Quantum..." : "✨ Calculate Cosmos Cost"}
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: "2rem" }}>
                    <label style={{ display: "block", marginBottom: "0.75rem", fontSize: "0.9rem", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "1px" }}>Chef's Intelligence Hub</label>
                    <textarea
                        value={chefNotes}
                        onChange={(e) => setChefNotes(e.target.value)}
                        placeholder="Feedback for the AI loop..."
                        style={{
                            width: "100%",
                            height: "100px",
                            fontStyle: "italic",
                            fontSize: "1rem"
                        }}
                    />
                </div>

                <div style={{ marginBottom: "3rem" }}>
                    <label style={{ display: "block", marginBottom: "0.75rem", fontSize: "0.9rem", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "1px" }}>Execution Protocol (Instructions)</label>
                    <textarea
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        style={{
                            width: "100%",
                            minHeight: "200px"
                        }}
                    />
                </div>

                <div style={{ display: "flex", gap: "1.5rem", marginTop: "3rem", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "2rem" }}>
                    {!meal.id.startsWith("mock-") && !meal.id.startsWith("temp-") && (
                        <button
                            onClick={handleDelete}
                            disabled={saving}
                            className="btn-secondary"
                            style={{ color: "var(--error)", borderColor: "rgba(239, 68, 68, 0.2)", flex: 0.5 }}
                        >
                            Trash Protocol
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="btn-secondary"
                        style={{ flex: 1 }}
                    >
                        Close
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary"
                        style={{ flex: 1.5, fontSize: "1.1rem" }}
                    >
                        {saving ? "Storing Pulse..." : "Sync to Library"}
                    </button>
                </div>
            </div>
        </div>
    );
}

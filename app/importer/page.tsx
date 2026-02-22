"use client";

import { useState } from "react";
import { importRecipe, importPrices } from "@/app/actions/importers";

export default function ImporterPage() {
    const [recipeInput, setRecipeInput] = useState("");
    const [priceInput, setPriceInput] = useState("");
    const [loadingRecipe, setLoadingRecipe] = useState(false);
    const [loadingPrices, setLoadingPrices] = useState(false);
    const [message, setMessage] = useState("");

    const handleRecipeImport = async () => {
        setLoadingRecipe(true);
        setMessage("");
        const res = await importRecipe(recipeInput);
        if (res.success) {
            setMessage("Recipe imported successfully! Check the library.");
            setRecipeInput("");
        } else {
            setMessage("Error: " + res.error);
        }
        setLoadingRecipe(false);
    };

    const handlePriceImport = async () => {
        setLoadingPrices(true);
        setMessage("");
        const res = await importPrices(priceInput);
        if (res.success) {
            setMessage(`Imported ${res.count} ingredient prices successfully!`);
            setPriceInput("");
        } else {
            setMessage("Error: " + res.error);
        }
        setLoadingPrices(false);
    };

    return (
        <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
            <header style={{ marginBottom: "3rem", textAlign: "center" }}>
                <h1 style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>Data Importers</h1>
                <p style={{ color: "gray", fontSize: "1.1rem" }}>
                    Effortlessly bring recipes and pricing data into Food Crib.
                </p>
            </header>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                {/* Recipe Importer */}
                <div className="card">
                    <h2 style={{ marginBottom: "1rem" }}>Recipe & URL Importer</h2>
                    <p style={{ color: "gray", marginBottom: "1rem", fontSize: "0.9rem" }}>
                        Paste a URL, YouTube transcript, or raw text recipe.
                    </p>
                    <textarea
                        value={recipeInput}
                        onChange={(e) => setRecipeInput(e.target.value)}
                        placeholder="Paste URL or recipe text here..."
                        style={{
                            width: "100%",
                            height: "200px",
                            padding: "1rem",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border)",
                            backgroundColor: "var(--surface-secondary)",
                            marginBottom: "1rem"
                        }}
                    />
                    <button
                        onClick={handleRecipeImport}
                        disabled={loadingRecipe || !recipeInput}
                        className="btn-primary"
                        style={{ width: "100%" }}
                    >
                        {loadingRecipe ? "Importing..." : "Import Recipe"}
                    </button>
                </div>

                {/* Price Importer */}
                <div className="card">
                    <h2 style={{ marginBottom: "1rem" }}>Woolworths Price Importer</h2>
                    <p style={{ color: "gray", marginBottom: "1rem", fontSize: "0.9rem" }}>
                        Paste messy text from grocery websites to update pricing.
                    </p>
                    <textarea
                        value={priceInput}
                        onChange={(e) => setPriceInput(e.target.value)}
                        placeholder="Paste bulk pricing text here..."
                        style={{
                            width: "100%",
                            height: "200px",
                            padding: "1rem",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border)",
                            backgroundColor: "var(--surface-secondary)",
                            marginBottom: "1rem"
                        }}
                    />
                    <button
                        onClick={handlePriceImport}
                        disabled={loadingPrices || !priceInput}
                        className="btn-primary"
                        style={{ width: "100%" }}
                    >
                        {loadingPrices ? "Importing..." : "Import Prices"}
                    </button>
                </div>
            </div>

            {message && (
                <div className="card flex-center" style={{
                    marginTop: "2rem",
                    backgroundColor: message.includes("Error") ? "var(--error)" : "var(--success)",
                    color: "white"
                }}>
                    {message}
                </div>
            )}
        </div>
    );
}

import { getAllSettings } from "@/lib/settings";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
    const settings = await getAllSettings();

    return (
        <div style={{ padding: "2rem" }}>
            <h1 style={{ textAlign: "center", fontSize: "2.5rem", marginBottom: "1rem" }}>Settings</h1>
            <p style={{ textAlign: "center", color: "gray", marginBottom: "2rem" }}>
                Configure your AI models and dietary preferences.
            </p>
            <SettingsForm initialSettings={settings} />
        </div>
    );
}

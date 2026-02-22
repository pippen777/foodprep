import { getMeals } from "@/app/actions/meals";
import prisma from "@/lib/prisma";
import PlannerClient from "./PlannerClient";

export default async function CustomPlannerPage() {
    const meals = await getMeals();
    const settings = await prisma.appSetting.findMany();
    const settingsMap = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as any);
    const dietMode = settingsMap.diet_mode || "Carb-Cycling";

    return (
        <div style={{ padding: "2rem", maxWidth: "1600px", margin: "0 auto" }}>
            <header style={{ marginBottom: "3rem", textAlign: "center" }}>
                <h1 style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>Custom Plan Builder</h1>
                <p style={{ color: "gray" }}>Build your perfect week by selecting meals from your library.</p>
            </header>

            <PlannerClient meals={meals} dietMode={dietMode} />
        </div>
    );
}

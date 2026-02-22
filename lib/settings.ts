import prisma from "./prisma";

export async function getSetting(key: string): Promise<string | null> {
    const setting = await prisma.appSetting.findUnique({
        where: { key },
    });
    return setting?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
    await prisma.appSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
    });
}

export async function getAllSettings(): Promise<Record<string, string>> {
    const settings = await prisma.appSetting.findMany();
    return settings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {} as Record<string, string>);
}

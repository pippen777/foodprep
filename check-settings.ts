import prisma from "./lib/prisma";

async function check() {
    const settings = await prisma.appSetting.findMany();
    console.log("Current Settings:");
    settings.forEach(s => {
        if (s.key === 'openrouter_api_key') {
            console.log(`${s.key}: ${s.value.substring(0, 10)}... (Length: ${s.value.length})`);
        } else {
            console.log(`${s.key}: ${s.value}`);
        }
    });
}

check();

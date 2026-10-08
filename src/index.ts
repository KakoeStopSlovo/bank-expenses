import "dotenv/config";
import { Telegraf } from "telegraf";
import { prisma } from "./db.js";

const bot = new Telegraf(process.env.BOT_TOKEN!);

bot.start((ctx) => {
    ctx.reply("Привет! Это Bank Expenses.");
});

bot.command("add", async (ctx) => {
    const text = ctx.message.text;

    const parts = text.split(" ");

    const amount = Number(parts[1]);
    const category = parts[2];
    const comment = parts.slice(3).join(" ");

    if (!amount || !category) {
        await ctx.reply(
            "Формат:\n/add сумма категория комментарий\n\nНапример:\n/add 25.50 Food Кофе"
        );
        return;
    }

    const expense = await prisma.expense.create({
        data: {
            amount,
            category,
            comment: comment || null,
        },
    });

    await ctx.reply(
        `Расход добавлен ✅\n\n` +
        `Сумма: ${expense.amount} zł\n` +
        `Категория: ${expense.category}\n` +
        `Комментарий: ${expense.comment ?? "—"}`
    );
});

bot.command("today", async (ctx) => {
    // 1. Начало сегодняшнего дня
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // 2. Конец сегодняшнего дня
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 3. Получаем расходы за сегодня
    const expenses = await prisma.expense.findMany({
        where: {
            createdAt: {
                gte: startOfDay,
                lte: endOfDay,
            },
        },
    });

    // 4. Если расходов нет
    if (expenses.length === 0) {
        await ctx.reply("Сегодня расходов нет.");
        return;
    }

    // 5. Считаем общую сумму
    const total = expenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
    );

    // 6. Формируем список
    const list = expenses
        .map(
            (expense, index) =>
                `${index + 1}. ${expense.amount.toFixed(2)} zł — ${expense.category} — ${expense.comment ?? "—"}`
        )
        .join("\n");

    // 7. Отправляем результат
    await ctx.reply(
        `Расходы за сегодня:\n\n${list}\n\nИтого: ${total.toFixed(2)} zł`
    );
});



bot.launch();

console.log("Bot started!");
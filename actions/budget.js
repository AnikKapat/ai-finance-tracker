"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getCurrentBudget(accountId) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const currentDate = new Date();

    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );

    const startOfNextMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1,
    );

    const [account, budget, expenses] = await Promise.all([
      // Verify account ownership
      db.account.findFirst({
        where: {
          id: accountId,
          user: {
            clerkUserId: userId,
          },
        },
        select: {
          id: true,
        },
      }),

      // Get user's budget
      db.budget.findFirst({
        where: {
          user: {
            clerkUserId: userId,
          },
        },
      }),

      // Get current month's expenses
      db.transaction.aggregate({
        where: {
          accountId,
          user: {
            clerkUserId: userId,
          },
          type: "EXPENSE",
          date: {
            gte: startOfMonth,
            lt: startOfNextMonth,
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    if (!account) {
      throw new Error("Account not found");
    }

    return {
      budget: budget
        ? {
            ...budget,
            amount: budget.amount.toNumber(),
          }
        : null,
      currentExpenses: expenses._sum.amount
        ? expenses._sum.amount.toNumber()
        : 0,
    };
  } catch (error) {
    console.error("Error fetching budget:", error);
    throw error;
  }
}

export async function updateBudget(amount) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const budgetAmount = Number(amount);

    if (!Number.isFinite(budgetAmount) || budgetAmount <= 0) {
      throw new Error("Budget amount must be greater than 0");
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const budget = await db.budget.upsert({
      where: {
        userId: user.id,
      },
      update: {
        amount: budgetAmount,
      },
      create: {
        userId: user.id,
        amount: budgetAmount,
      },
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        ...budget,
        amount: budget.amount.toNumber(),
      },
    };
  } catch (error) {
    console.error("Error updating budget:", error);

    return {
      success: false,
      error: error.message,
    };
  }
}

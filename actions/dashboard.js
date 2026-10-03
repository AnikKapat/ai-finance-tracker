"use server";

import aj from "@/lib/arcjet";
import { db } from "@/lib/prisma";
import { request } from "@arcjet/next";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const serializeTransaction = (obj) => {
  const serialized = { ...obj };
  if (obj.balance) {
    serialized.balance = obj.balance.toNumber();
  }
  if (obj.amount) {
    serialized.amount = obj.amount.toNumber();
  }
  return serialized;
};

export async function getUserAccounts() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const accounts = await db.account.findMany({
      where: {
        user: {
          clerkUserId: userId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Serialize accounts before sending to client
    const serializedAccounts = accounts.map(serializeTransaction);

    return serializedAccounts;
  } catch (error) {
    console.error("Error fetching user accounts:", error);
    throw new Error("Failed to fetch accounts");
  }
}

export async function createAccount(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const req = await request();

    const decision = await aj.protect(req, {
      userId,
      requested: 1,
    });
    

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;

        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });

        throw new Error("Too many requests. Please try again later.");
      }

      throw new Error("Request blocked");
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const balanceFloat = Number(data.balance);

    if (!Number.isFinite(balanceFloat)) {
      throw new Error("Invalid balance amount");
    }

    if (!data.name || typeof data.name !== "string") {
      throw new Error("Account name is required");
    }

    if (!data.type || typeof data.type !== "string") {
      throw new Error("Account type is required");
    }

    const account = await db.$transaction(async (tx) => {
      const existingAccounts = await tx.account.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          isDefault: true,
        },
      });

      const shouldBeDefault =
        existingAccounts.length === 0 ? true : data.isDefault === true;

      if (shouldBeDefault) {
        await tx.account.updateMany({
          where: {
            userId: user.id,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      return tx.account.create({
        data: {
          name: data.name.trim(),
          type: data.type,
          balance: balanceFloat,
          userId: user.id,
          isDefault: shouldBeDefault,
        },
      });
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      data: serializeTransaction(account),
    };
  } catch (error) {
    console.error("Error creating account:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to create account",
    );
  }
}

export async function getDashboardData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const transactions = await db.transaction.findMany({
    where: {
      user: {
        clerkUserId: userId,
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  return transactions.map(serializeTransaction);
}
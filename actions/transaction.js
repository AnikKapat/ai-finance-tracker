"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { transactionSchema } from "@/app/lib/schema";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const serializeAmount = (obj) => ({
  ...obj,
  amount: obj.amount.toNumber(),
});

// Create Transaction
export async function createTransaction(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Server-side validation
    const validatedData = transactionSchema.safeParse(data);

    if (!validatedData.success) {
      throw new Error("Invalid transaction data");
    }

    const transactionData = validatedData.data;
    const amount = Number(transactionData.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    // Get request data for ArcJet
    const req = await request();

    // Check rate limit
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

    // Create transaction + update balance atomically
    const transaction = await db.$transaction(async (tx) => {
      // Verify account belongs to authenticated user
      const account = await tx.account.findUnique({
        where: {
          id: transactionData.accountId,
          userId: user.id,
        },
      });

      if (!account) {
        throw new Error("Account not found");
      }

      const balanceChange =
        transactionData.type === "EXPENSE" ? -amount : amount;

      const newTransaction = await tx.transaction.create({
        data: {
          ...transactionData,
          amount,
          userId: user.id,
          nextRecurringDate:
            transactionData.isRecurring && transactionData.recurringInterval
              ? calculateNextRecurringDate(
                  transactionData.date,
                  transactionData.recurringInterval
                )
              : null,
        },
      });

      // Atomic balance update
      await tx.account.update({
        where: {
          id: account.id,
        },
        data: {
          balance: {
            increment: balanceChange,
          },
        },
      });

      return newTransaction;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);

    return {
      success: true,
      data: serializeAmount(transaction),
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getTransaction(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const transaction = await db.transaction.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!transaction) throw new Error("Transaction not found");

  return serializeAmount(transaction);
}

export async function updateTransaction(id, data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Server-side validation
    const validatedData = transactionSchema.safeParse(data);

    if (!validatedData.success) {
      throw new Error("Invalid transaction data");
    }

    const transactionData = validatedData.data;
    const amount = Number(transactionData.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const result = await db.$transaction(async (tx) => {
      // Get original transaction
      const originalTransaction = await tx.transaction.findUnique({
        where: {
          id,
          userId: user.id,
        },
      });

      if (!originalTransaction) {
        throw new Error("Transaction not found");
      }

      // Verify new account belongs to the current user
      const newAccount = await tx.account.findUnique({
        where: {
          id: transactionData.accountId,
          userId: user.id,
        },
      });

      if (!newAccount) {
        throw new Error("Account not found");
      }

      // Balance effect of the ORIGINAL transaction
      const oldBalanceChange =
        originalTransaction.type === "EXPENSE"
          ? -originalTransaction.amount.toNumber()
          : originalTransaction.amount.toNumber();

      // Balance effect of the UPDATED transaction
      const newBalanceChange =
        transactionData.type === "EXPENSE" ? -amount : amount;

      const sameAccount =
        originalTransaction.accountId === transactionData.accountId;

      // Update transaction
      const updatedTransaction = await tx.transaction.update({
        where: {
          id,
          userId: user.id,
        },
        data: {
          ...transactionData,
          amount,
          nextRecurringDate:
            transactionData.isRecurring && transactionData.recurringInterval
              ? calculateNextRecurringDate(
                  transactionData.date,
                  transactionData.recurringInterval,
                )
              : null,
        },
      });

      if (sameAccount) {
        // Same account:
        // remove old effect and apply new effect
        const netBalanceChange = newBalanceChange - oldBalanceChange;

        if (netBalanceChange !== 0) {
          await tx.account.update({
            where: {
              id: originalTransaction.accountId,
            },
            data: {
              balance: {
                increment: netBalanceChange,
              },
            },
          });
        }
      } else {
        // Account changed:
        // 1. Reverse the old transaction from old account
        await tx.account.update({
          where: {
            id: originalTransaction.accountId,
          },
          data: {
            balance: {
              increment: -oldBalanceChange,
            },
          },
        });

        // 2. Apply the new transaction to new account
        await tx.account.update({
          where: {
            id: transactionData.accountId,
          },
          data: {
            balance: {
              increment: newBalanceChange,
            },
          },
        });
      }

      return {
        transaction: updatedTransaction,
        oldAccountId: originalTransaction.accountId,
        newAccountId: transactionData.accountId,
      };
    });

    // Revalidate dashboard
    revalidatePath("/dashboard");

    // Revalidate new account
    revalidatePath(`/account/${result.newAccountId}`);

    // If account changed, also revalidate old account
    if (result.oldAccountId !== result.newAccountId) {
      revalidatePath(`/account/${result.oldAccountId}`);
    }

    return {
      success: true,
      data: serializeAmount(result.transaction),
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Get User Transactions
export async function getUserTransactions() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
      },
      include: {
        account: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return {
      success: true,
      data: transactions,
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Scan Receipt
export async function scanReceipt(file) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Rate limit receipt scanning
    const req = await request();

    const decision = await aj.protect(req, {
      userId,
      requested: 1,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        throw new Error("Too many receipt scans. Please try again later.");
      }

      throw new Error("Request blocked");
    }

    // Validate file
    if (!file || typeof file.arrayBuffer !== "function") {
      throw new Error("No receipt file provided");
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error("Only JPEG, PNG, and WebP images are supported");
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    if (file.size > MAX_FILE_SIZE) {
      throw new Error("Receipt image must be smaller than 5 MB");
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    // Convert File to Base64
    const arrayBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
      Analyze this receipt image and extract the following information in JSON format:

      - Total amount (just the number)
      - Date (in ISO format)
      - Description or items purchased (brief summary)
      - Merchant/store name
      - Suggested category (one of:
        housing,
        transportation,
        groceries,
        utilities,
        entertainment,
        food,
        shopping,
        healthcare,
        education,
        personal,
        travel,
        insurance,
        gifts,
        bills,
        other-expense
      )

      Only respond with valid JSON in this exact format:

      {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string"
      }

      If the image is not a receipt or the required information cannot be extracted,
      return an empty JSON object: {}
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();

    const cleanedText = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    let data;

    try {
      data = JSON.parse(cleanedText);
    } catch {
      console.error("Invalid JSON response from Gemini:", cleanedText);
      throw new Error("Invalid response format from Gemini");
    }

    // Gemini explicitly determined this isn't a receipt
    if (!data || Object.keys(data).length === 0) {
      throw new Error("The uploaded image does not appear to be a receipt");
    }

    // Validate amount
    const amount = Number(data.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Could not extract a valid receipt amount");
    }

    // Validate date
    const date = new Date(data.date);

    if (Number.isNaN(date.getTime())) {
      throw new Error("Could not extract a valid receipt date");
    }

    // Validate category
    const allowedCategories = [
      "housing",
      "transportation",
      "groceries",
      "utilities",
      "entertainment",
      "food",
      "shopping",
      "healthcare",
      "education",
      "personal",
      "travel",
      "insurance",
      "gifts",
      "bills",
      "other-expense",
    ];

    const category = allowedCategories.includes(data.category)
      ? data.category
      : "other-expense";

    // Validate text fields
    const description =
      typeof data.description === "string"
        ? data.description.slice(0, 500)
        : "";

    const merchantName =
      typeof data.merchantName === "string"
        ? data.merchantName.slice(0, 200)
        : "";

    return {
      amount,
      date,
      description,
      category,
      merchantName,
    };
  } catch (error) {
    console.error("Error scanning receipt:", error);

    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to scan receipt"
    );
  }
}

// Helper function to calculate next recurring date
function calculateNextRecurringDate(startDate, interval) {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}

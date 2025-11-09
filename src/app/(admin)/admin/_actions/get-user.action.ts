"use server"

import { getDB } from "@/db"
import { requireAdmin } from "@/utils/auth"
import { userTable, creditTransactionTable, passKeyCredentialTable } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

export const getUserData = async (userId: string) => {
  await requireAdmin()

  const db = getDB()

  // Fetch user with all details
  const user = await db.query.userTable.findFirst({
    where: eq(userTable.id, userId),
  })

  if (!user) {
    throw new Error("User not found")
  }

  // Fetch user's credit transactions (last 10)
  const transactions = await db.query.creditTransactionTable.findMany({
    where: eq(creditTransactionTable.userId, userId),
    orderBy: [desc(creditTransactionTable.createdAt)],
    limit: 10,
  })

  // Fetch user's passkey credentials
  const passkeys = await db.query.passKeyCredentialTable.findMany({
    where: eq(passKeyCredentialTable.userId, userId),
    orderBy: [desc(passKeyCredentialTable.createdAt)],
  })

  return {
    user,
    transactions,
    passkeys,
  }
}

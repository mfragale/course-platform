import { db } from "@/drizzle/db"
import { PurchaseTable } from "@/drizzle/schema"
import { revalidatePurchaseCache } from "./cache"
import { eq } from "drizzle-orm"
import { revalidateUserCache } from "@/features/users/db/cache"
import { revalidateProductCache } from "@/features/products/db/cache"
import { revalidateCourseCache } from "@/features/courses/db/cache/courses"

export async function insertPurchase(
  data: typeof PurchaseTable.$inferInsert,
  trx: Omit<typeof db, "$client"> = db
) {
  const details = data.productDetails

  const [newPurchase] = await trx
    .insert(PurchaseTable)
    .values(data)
    .onConflictDoNothing()
    .returning()

  if (newPurchase != null) {
    revalidatePurchaseCache(newPurchase);
    revalidateUserCache(data.userId);
    revalidateProductCache(data.productId);
    revalidateCourseCache(data.productDetails.courseProducts?.courseId);
  }

  return newPurchase
}

export async function updatePurchase(
  id: string,
  data: Partial<typeof PurchaseTable.$inferInsert>,
  trx: Omit<typeof db, "$client"> = db
) {
  const details = data.productDetails

  const [updatedPurchase] = await trx
    .update(PurchaseTable)
    .set(data)
    .where(eq(PurchaseTable.id, id))
    .returning()
  if (updatedPurchase == null) throw new Error("Failed to update purchase")

  revalidatePurchaseCache(updatedPurchase)

  return updatedPurchase
}

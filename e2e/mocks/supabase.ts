"use server";

import { cookies } from "next/headers";
import { COOKIE_NAME } from "./purchase-data";

// 購入レコードの型定義
type PurchaseRecord = {
  userId: string;
  contentId: string;
};

// cookieから購入済みコンテンツを取得する関数
export async function getMockPurchasedItems() {
  const cookieStore = await cookies();
  const cookieData = cookieStore.get(COOKIE_NAME) || null;
  return cookieData ? JSON.parse(cookieData.value) : [];
}

// 購入済みかどうかをチェックする関数
export async function hasPurchasedContent(userId: string, contentId: string) {
  const mockPurchases: PurchaseRecord[] = await getMockPurchasedItems();
  return mockPurchases.some(
    (purchase) => purchase.userId === userId && purchase.contentId === contentId
  );
}

// コンテンツを購入する関数
export async function setPurchasedContent(userId: string, contentId: string) {
  const mockPurchases: PurchaseRecord[] = await getMockPurchasedItems();
  // もし、既に購入済みなら何もしない
  if (await hasPurchasedContent(userId, contentId)) {
    return;
  }
  mockPurchases.push({ userId, contentId });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, JSON.stringify(mockPurchases));
}

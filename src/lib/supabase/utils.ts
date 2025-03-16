import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { supabaseAdmin } from "./client";
import {
  hasPurchasedContent,
  setPurchasedContent,
} from "../../../e2e/mocks/supabase";

interface CreatePurchaseParams {
  userIdentifier: string;
  contentId: string;
  paymentIntentId: string;
  amount: number;
}

// テスト環境かどうかを判定
const isTestEnv =
  process.env.APP_ENV === "test" || process.env.NODE_ENV === "test";

/**
 * 購入履歴を記録する
 */
export async function createPurchaseRecord({
  userIdentifier,
  contentId,
  paymentIntentId,
  amount,
}: CreatePurchaseParams) {
  // テスト環境ではモックを使用
  if (isTestEnv) {
    // モックデータを更新
    setPurchasedContent(userIdentifier, contentId);

    // モックデータを返す
    return {
      id: "mock-purchase-id",
      user_identifier: userIdentifier,
      content_id: contentId,
      stripe_payment_intent_id: paymentIntentId,
      amount,
      created_at: new Date().toISOString(),
    };
  }

  const { data, error } = await supabaseAdmin
    .from("purchases")
    .insert({
      user_identifier: userIdentifier,
      content_id: contentId,
      stripe_payment_intent_id: paymentIntentId,
      amount,
    })
    .select()
    .single();

  if (error) {
    console.error("購入記録エラー:", error);
    throw error;
  }

  return data;
}

/**
 * ユーザーの既存の購入記録をチェック
 */
export async function checkUserPurchase(
  userIdentifier: string,
  contentId: string
) {
  // テスト環境ではモックを使用
  if (isTestEnv) {
    return hasPurchasedContent(userIdentifier, contentId);
  }

  try {
    const { data } = await supabaseAdmin
      .from("purchases")
      .select("id")
      .eq("user_identifier", userIdentifier)
      .eq("content_id", contentId)
      .maybeSingle();

    return !!data;
  } catch (error) {
    console.error("購入確認エラー:", error);
    throw error;
  }
}

/**
 * アクセス時に、有料コンテンツを購入していない場合はリダイレクト
 */
export async function checkAccessAndRedirect(
  contentId: string,
  contentType: "book" | "article"
) {
  // ログインの確認
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin");

  // 購入の確認
  const hasPurchased = await checkUserPurchase(session.user.id!, contentId);
  if (!hasPurchased) {
    const redirectUrl =
      contentType === "book"
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/books/${contentId}`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/#articles`;

    redirect(redirectUrl);
  }
}

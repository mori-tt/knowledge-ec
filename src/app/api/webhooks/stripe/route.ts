import { NextRequest, NextResponse } from "next/server";
import type { Stripe } from "stripe";
import { checkUserPurchase, createPurchaseRecord } from "@/lib/supabase/utils";
import { METADATA_KEYS, stripe } from "@/lib/stripe";

// 購入完了時にSupabaseに記録する
async function recordCompletedPurchase(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};

  // メタデータからデータを取得
  const userIdentifier = metadata[METADATA_KEYS.USER_IDENTIFIER];
  const contentId = metadata[METADATA_KEYS.CONTENT_ID];
  const price = parseInt(metadata[METADATA_KEYS.PRICE] || "0", 10);

  if (!userIdentifier || !contentId || isNaN(price)) {
    throw new Error("必要なメタデータが不足しています");
  }

  // 支払い状態のチェック
  if (session.payment_status !== "paid") {
    console.log(
      `支払いがまだ完了していません: ${session.id}, status=${session.payment_status}`
    );
    return false;
  }

  // payment_intentの取得
  let paymentIntentId: string | null = null;
  if (typeof session.payment_intent === "string") {
    paymentIntentId = session.payment_intent;
  } else if (
    session.payment_intent &&
    typeof session.payment_intent === "object"
  ) {
    paymentIntentId = session.payment_intent.id;
  }

  const existingPurchase = await checkUserPurchase(userIdentifier, contentId);
  // 既存の購入記録があれば処理をスキップ
  if (existingPurchase) {
    console.log(
      `既に購入済み: ユーザー=${userIdentifier}, コンテンツ=${contentId}`
    );
    return true;
  }

  // 新規購入を記録
  const data = await createPurchaseRecord({
    userIdentifier,
    contentId,
    paymentIntentId: paymentIntentId || "",
    amount: price,
  });

  return !!data;
}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new NextResponse("Stripe署名がありません", { status: 401 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET環境変数が設定されていません");
    }

    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "不明なエラー";
      console.error(`Webhook署名検証失敗: ${message}`);
      return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
    }

    // イベントタイプに基づく処理
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;

        // 支払いが完了した時点でSupabaseに記録する
        await recordCompletedPurchase(session);
        break;

      default:
        console.log(`未処理のイベントタイプ: ${event.type}`);
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "不明なエラー";
    console.error(`Webhook処理エラー: ${message}`);
    return new NextResponse(`Webhook Error: ${message}`, { status: 500 });
  }
}

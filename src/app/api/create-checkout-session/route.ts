import { NextRequest, NextResponse } from "next/server";
import type { Stripe } from "stripe";

import { checkUserPurchase } from "@/lib/supabase/utils";
import { CURRENT_VERSION, METADATA_KEYS, stripe } from "@/lib/stripe";
import { auth } from "../../../../auth";

// コンテンツ購入用のStripeセッションを作成
async function createCheckoutSession(
  userIdentifier: string,
  contentId: string,
  title: string,
  price: number,
  contentType: "book" | "article"
): Promise<Stripe.Checkout.Session> {
  const APP_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
  if (!APP_BASE_URL) {
    throw new Error("BASE_URL が設定されていません");
  }

  const successUrl =
    contentType === "book"
      ? `${APP_BASE_URL}/books/${contentId}?success=true`
      : `${APP_BASE_URL}/posts/${contentId}?success=true`;

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "jpy",
          product_data: {
            name: title,
            description: `コンテンツID: ${contentId}`,
          },
          unit_amount: price,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    // webhookで使用するためのメタデータを記載
    metadata: {
      [METADATA_KEYS.USER_IDENTIFIER]: userIdentifier,
      [METADATA_KEYS.CONTENT_ID]: contentId,
      [METADATA_KEYS.PRICE]: price.toString(),
      [METADATA_KEYS.VERSION]: CURRENT_VERSION,
    },
    success_url: successUrl,
    cancel_url: APP_BASE_URL,
  };

  return stripe.checkout.sessions.create(sessionParams);
}

type RequestData = {
  contentId: string;
  price: number;
  title: string;
  contentType: "book" | "article";
};

export async function POST(req: NextRequest) {
  try {
    // Auth.jsからセッション情報を取得
    const session = await auth();

    if (!session || !session.user) {
      return new NextResponse("認証が必要です", { status: 401 });
    }

    const { contentId, price, title, contentType }: RequestData =
      await req.json();

    if (!contentId || !price || !title || !contentType) {
      return new NextResponse("必要な情報が不足しています", { status: 400 });
    }

    // ユーザー識別子を取得 (GitHubのID)
    const userIdentifier = session.user.id;

    if (!userIdentifier) {
      return new NextResponse("ユーザー識別子が取得できません", {
        status: 400,
      });
    }

    // すでに購入済みの場合、リダイレクトさせる
    const existingPurchase = await checkUserPurchase(userIdentifier, contentId);
    // 既存の購入記録があれば処理をスキップ
    if (existingPurchase) {
      console.log(
        `既に購入済み: ユーザー=${userIdentifier}, コンテンツ=${contentId}`
      );
      return NextResponse.json({
        url:
          contentType === "book"
            ? `${process.env.NEXT_PUBLIC_BASE_URL}/books/${contentId}`
            : `${process.env.NEXT_PUBLIC_BASE_URL}/posts/${contentId}`,
      });
    }

    // Stripeのセッションを作成
    const stripeSession = await createCheckoutSession(
      userIdentifier!,
      contentId,
      title,
      price,
      contentType
    );

    // チェックアウトURLを返す（クライアント側でリダイレクト）
    return NextResponse.json({
      sessionId: stripeSession.id,
      url: stripeSession.url,
    });
  } catch (error) {
    console.error("Checkout session error:", error);
    return new NextResponse("内部エラーが発生しました", { status: 500 });
  }
}

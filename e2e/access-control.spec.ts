import { test, expect } from "@playwright/test";
import { MOCK_PURCHASES_COOKIE } from "./mocks/purchase-data";

// テストデータを定義
const PAID_CONTENTS = [
  {
    type: "記事",
    url: "/posts/nextjs-ecapp-guide",
    title: "コンテンツ販売アプリを作るガイド",
    redirectUrl: "/#articles",
  },
  {
    type: "本の章",
    url: "/books/todo-handson-book/1.intro",
    title: "useStateの基本と初期化",
    redirectUrl: "/books/todo-handson-book",
  },
];

const FREE_CONTENTS = [
  {
    type: "記事",
    url: "/posts/about-stripe",
    title: "Stripe とは？",
  },
  {
    type: "本の章",
    url: "/books/redux-handson-book/1.intro",
    title: "redux の基本と初期化",
  },
];

test.describe("コンテンツへのアクセス制御", () => {
  test.describe("有料", () => {
    test("購入済みの有料コンテンツには直接アクセスできる", async ({
      page,
      context,
    }) => {
      // 購入済み状態をセット
      await context.addCookies([MOCK_PURCHASES_COOKIE]);

      // 各有料コンテンツに対してテスト
      for (const content of PAID_CONTENTS) {
        await page.goto(content.url);
        const title = page.locator("h1").first();
        await expect(title).toContainText(content.title);
        console.log(
          `✓ 購入済みの有料${content.type}「${content.title}」にアクセスできました`
        );
      }
    });

    // 未購入コンテンツへのアクセス制限をパラメータ化テスト
    for (const content of PAID_CONTENTS) {
      test(`未購入の有料${content.type}にアクセスすると適切にリダイレクトされる`, async ({
        page,
      }) => {
        await page.goto(content.url);
        await expect(page).toHaveURL(content.redirectUrl);
      });
    }
  });

  test.describe("無料", () => {
    test("未ログイン状態でも無料コンテンツには直接アクセスできる", async ({
      page,
      context,
    }) => {
      // ログアウト状態をセット
      await context.clearCookies();

      // 各無料コンテンツに対してテスト
      for (const content of FREE_CONTENTS) {
        await page.goto(content.url);
        const title = page.locator("h1").first();
        await expect(title).toContainText(content.title);
        console.log(
          `✓ 未ログイン状態でも無料${content.type}「${content.title}」にアクセスできました`
        );
      }
    });
  });
});

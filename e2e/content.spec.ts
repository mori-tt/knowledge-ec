import { test, expect } from "@playwright/test";

test.describe("コンテンツのナビゲーション", () => {
  test("本の詳細ページから各章へのリンクが正しく動作する", async ({ page }) => {
    await page.goto("/books/redux-handson-book");

    await page.getByRole("link", { name: "redux の基本と初期化" }).click();

    await expect(page).toHaveURL("/books/redux-handson-book/1.intro");
    await expect(page.getByText("Chapter 1 of 2")).toBeVisible();
    await page
      .getByRole("link", { name: "SNS アプリで理解するReact Redux" })
      .click();

    await expect(page).toHaveURL("/books/redux-handson-book");
    await page.getByRole("link", { name: "store の実装" }).click();

    await expect(page).toHaveURL("/books/redux-handson-book/2.setup");
    await expect(page.getByText("Chapter 2 of 2")).toBeVisible();
  });

  test("各章ページで、前後ナビゲーションボタンが正常に機能する", async ({
    page,
  }) => {
    await page.goto("/books/redux-handson-book/1.intro");
    await expect(page).toHaveURL("/books/redux-handson-book/1.intro");

    await expect(page.getByRole("button", { name: "次の章" })).toBeVisible();
    await page.getByRole("button", { name: "次の章" }).click();
    await expect(page).toHaveURL("/books/redux-handson-book/2.setup");

    // 前の章ボタンを確認し、クリック
    await expect(page.getByRole("button", { name: "前の章" })).toBeVisible();
    await page.getByRole("button", { name: "前の章" }).click();
    await expect(page).toHaveURL("/books/redux-handson-book/1.intro");
  });

  test("サイドバーの目次が、正しくリンクする", async ({ page }) => {
    await page.goto("/books/redux-handson-book/1.intro");
    await expect(
      page.getByRole("heading", { name: "redux の基本と初期化", exact: true })
    ).toBeVisible();

    const nextChapter = page.getByRole("link", { name: "store の実装" });

    await nextChapter.click();
    await expect(
      page.getByRole("heading", { name: "store の実装" })
    ).toBeVisible();
  });
});

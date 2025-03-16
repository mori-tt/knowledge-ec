import { test, expect } from "@playwright/test";

test.describe("認証フロー", () => {
  test("ログインボタンのクリックで、GitHub 認証画面に遷移することを確認", async ({
    page,
    context,
  }) => {
    // Cookieをクリアして未認証状態にする
    await context.clearCookies();

    await page.goto("/");

    // ナビゲーションバーを取得
    const navbar = page.locator("nav").first();

    // ログインボタンが表示される（アバターではなく）
    const loginButton = navbar.getByRole("button", { name: /Login/i });
    await expect(loginButton).toBeVisible();

    // GitHub認証ボタンをクリック
    await loginButton.click();

    // github.com へのリダイレクトを確認
    await expect(page).toHaveURL(/.*github\.com.*/);
  });

  // 固定テストユーザーを使用するテスト
  test("ログイン時に、GitHub のアバターが表示される", async ({ page }) => {
    await page.goto("/");

    // ナビゲーションバーを取得
    const navbar = page.locator("nav").first();

    // ログインしている GitHub アバターのアイコン
    const avatar = navbar.locator("img").first();
    await expect(avatar).toBeVisible();

    // ログインボタンはないことを確認
    const loginButton = navbar.getByRole("button", { name: /Login/i });
    await expect(loginButton).not.toBeVisible();
  });

  // 認証済み状態のテスト
  test("認証済み状態でのログアウト処理", async ({ page }) => {
    await page.goto("/");

    // ナビゲーションバーが表示される
    const navbar = page.locator("nav").first();

    // アバターをクリックしてドロップダウンを開く
    const avatar = navbar.locator("img").first();
    await avatar.click();

    // ドロップダウンメニューが表示される
    const dropdown = page.locator("div[role='menu']").first();
    await expect(dropdown).toBeVisible();

    // ユーザー名が表示される
    const username = dropdown.locator('div[data-slot="dropdown-menu-label"]');
    await expect(username).toContainText("user");

    // ログアウトボタンが表示される
    const logoutButton = dropdown.locator('button:has-text("Log Out")');
    await expect(logoutButton).toBeVisible();

    // ログアウトボタンをクリックする
    await logoutButton.click();

    // ログアウト後はログインボタンが表示される
    await page.waitForLoadState("networkidle");
    const loginButton = navbar.getByRole("button", { name: /Login/i });
    await expect(loginButton).toBeVisible();
  });

  test("認証状態がページリロード後も保持されることを確認", async ({ page }) => {
    await page.goto("/");

    // アバターが表示されていることを確認
    let avatar = page.locator("nav").first().locator("img").first();
    await expect(avatar).toBeVisible();

    // ページをリロード
    await page.reload();

    // リロード後もアバターが表示されていることを確認
    avatar = page.locator("nav").first().locator("img").first();
    await expect(avatar).toBeVisible();
  });
});

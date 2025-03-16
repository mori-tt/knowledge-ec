import { chromium } from "@playwright/test";
import path from "node:path";

export default async function globalConfig() {
  const storagePath = path.resolve(__dirname, "storageState.json");

  const browser = await chromium.launch();
  const context = await browser.newContext();

  // cookieに認証情報を追加し、ログイン済み状態にする
  await context.addCookies([
    {
      name: "authjs.session-token",
      value: "dummy",
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      expires: Math.round((Date.now() + 86400000 * 1) / 1000),
    },
  ]);

  // storageStateにcookieの値を保存
  await context.storageState({ path: storagePath });
  await browser.close();
}

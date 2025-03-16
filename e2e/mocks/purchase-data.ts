// テスト時の定数
const TEST_USER_ID = "123456789";
const TEST_CONTENT_IDS = {
  PREMIUM_ARTICLE: "nextjs-ecapp-guide",
  PREMIUM_BOOK: "todo-handson-book",
};

// SuapabaseのモックデータをCookieで保持
const COOKIE_NAME = "mock-purchases-data";
const PURCHASE_RECORDS = [
  { userId: TEST_USER_ID, contentId: TEST_CONTENT_IDS.PREMIUM_ARTICLE },
  { userId: TEST_USER_ID, contentId: TEST_CONTENT_IDS.PREMIUM_BOOK },
];

// Cookieに追加する値
const MOCK_PURCHASES_COOKIE = {
  name: COOKIE_NAME,
  value: JSON.stringify(PURCHASE_RECORDS),
  domain: "localhost",
  path: "/",
  httpOnly: true,
  sameSite: "Lax" as const,
  expires: Math.round((Date.now() + 86400000 * 1) / 1000),
};

export { COOKIE_NAME, MOCK_PURCHASES_COOKIE };

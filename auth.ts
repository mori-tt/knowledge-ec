import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { type JWT } from "next-auth/jwt";

const jwtTestEnv = {
  async encode(): Promise<string> {
    return "dummy";
  },
  async decode(): Promise<JWT | null> {
    return {
      id: "123456789",
      name: "user",
      email: "user@example.com",
      picture: "https://avatars.githubusercontent.com/u/000000",
      sub: "dummy",
    };
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  // テスト時は、テスト用のJWTを使用する
  ...(process.env.APP_ENV === "test" ? { jwt: jwtTestEnv } : {}),

  // 認証プロバイダーにGitHubを追加する
  providers: [
    GitHub({
      // GitHub のアカウント情報で使用するものを指定する
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, profile, user }) {
      // 初回サインイン時にprofileからtokenにデータをコピー
      if (user && profile) {
        token.id = profile.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session?.user) {
        // GitHubの一意のIDをセッションに追加
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});

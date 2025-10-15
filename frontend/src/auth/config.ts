import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";

const GOOGLE_SCOPE =
  process.env.GMAIL_SCOPES ||
  "openid email profile https://www.googleapis.com/auth/gmail.readonly";

export const authConfig: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Gmail readonly scope pulled from provided config
          scope: GOOGLE_SCOPE,
          // Ensure we get a refresh_token from Google
          access_type: "offline",
          prompt: "consent",
          include_granted_scopes: "true",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }) {
      // Initial sign in
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        // account.expires_at is in seconds since epoch
        if (account.expires_at) {
          token.expiresAt = account.expires_at * 1000; // store as ms
        }
      }

      // If access token not set, just return
      if (!token.accessToken || !token.expiresAt) return token as any;

      // If token has not expired, return it
      const shouldRefresh = Date.now() > (token.expiresAt as number) - 60_000; // refresh 60s early
      if (!shouldRefresh) return token as any;

      // Try to refresh
      try {
        const refreshToken = token.refreshToken as string | undefined;
        if (!refreshToken) return token as any;

        const res = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type: "refresh_token",
            refresh_token: refreshToken,
          }),
        });

        const data = (await res.json()) as {
          access_token?: string;
          expires_in?: number;
          refresh_token?: string;
          token_type?: string;
          scope?: string;
          error?: string;
        };

        if (!res.ok || data.error) {
          // eslint-disable-next-line no-console
          console.warn("Failed to refresh Google token:", data.error || res.statusText);
          return token as any;
        }

        if (data.access_token) token.accessToken = data.access_token;
        if (data.expires_in)
          token.expiresAt = Date.now() + data.expires_in * 1000;
        if (data.refresh_token) token.refreshToken = data.refresh_token;

        return token as any;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("Exception refreshing Google token", e);
        return token as any;
      }
    },
    async session({ session, token }) {
      if (token?.sub) {
        (session as any).userId = token.sub;
      }
      // Expose access token if you need to call Gmail from the client or server
      (session as any).accessToken = (token as any).accessToken;
      (session as any).accessTokenExpiresAt = (token as any).expiresAt;
      return session;
    },
  },
};

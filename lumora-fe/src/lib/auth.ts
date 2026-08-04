import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email/Username", type: "text" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials) {
        const rawIdentifier = (credentials?.identifier || (credentials as any)?.email || (credentials as any)?.username) as string;
        const password = credentials?.password as string;

        if (!rawIdentifier || !password) return null;

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
          const res = await fetch(`${apiUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              identifier: rawIdentifier.trim(),
              email: rawIdentifier.trim(),
              password: password,
              rememberMe: credentials.rememberMe === "true" || credentials.rememberMe === true,
            }),
          });

          const data = await res.json();

          if (res.ok && data.success) {
            return {
              id: data.data.user.id,
              email: data.data.user.email,
              name: data.data.user.name,
              image: data.data.user.avatar,
              accessToken: data.data.accessToken,
              refreshToken: data.data.refreshToken,
              role: data.data.user.role,
            };
          }
          console.error("Auth Login Failed response:", data);
          return null;
        } catch (error) {
          console.error("Auth Login Fetch error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
          const res = await fetch(`${apiUrl}/auth/oauth`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              avatar: user.image,
              provider: account.provider,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success && data.data) {
              (user as any).accessToken = data.data.accessToken;
              (user as any).refreshToken = data.data.refreshToken;
              (user as any).role = data.data.user?.role || "BUYER";
            }
          } else {
            (user as any).role = "BUYER";
          }
        } catch (e) {
          console.error("Google OAuth Backend Sync Error:", e);
          (user as any).role = "BUYER";
        }
        return true;
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "BUYER";
        token.avatar = (user as any).avatar || user.image;
        token.accessToken = (user as any).accessToken || "";
        token.refreshToken = (user as any).refreshToken || "";
      }
      if (trigger === "update" && session) {
        token.name = session.name || token.name;
        token.avatar = session.avatar || token.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = (token.role as string) || "BUYER";
        session.user.image = (token.avatar as string) || session.user.image;
        (session as any).accessToken = token.accessToken as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
});

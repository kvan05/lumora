import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy-google-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy-google-client-secret",
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email/Username", type: "text" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;

        try {
          // Send request to our custom backend
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              identifier: credentials.identifier,
              password: credentials.password,
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
          return null;
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          // Send OAuth info to our backend
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/oauth`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              avatar: user.image,
              provider: account.provider,
            }),
          });

          const data = await res.json();
          if (res.ok && data.success) {
            if (data.requiresOtp) {
              // Redirect to OTP verification screen with necessary data
              const params = new URLSearchParams({
                email: user.email as string,
                name: user.name as string,
                avatar: user.image as string,
              });
              return `/verify-oauth-otp?${params.toString()}`;
            }
            // Normal sign in
            (user as any).accessToken = data.data.accessToken;
            (user as any).refreshToken = data.data.refreshToken;
            (user as any).role = data.data.user.role;
            return true;
          }
          return false;
        } catch (e) {
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.avatar = (user as any).avatar;
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
      }
      // Handle manual session updates
      if (trigger === "update" && session) {
        token.name = session.name || token.name;
        token.avatar = session.avatar || token.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
        session.user.image = token.avatar as string;
        (session as any).accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
});

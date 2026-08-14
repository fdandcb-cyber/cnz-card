import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// Admin credentials for the Connectz CCTV platform.
// In production these would be stored hashed in the database (Profile.passwordHash)
// and verified with bcrypt. For this single-tenant demo we check against env /
// hardcoded defaults so the user can log in immediately.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'connectzsalesandservices@gmail.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Connectz@2026'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Admin Login',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const emailOk =
          credentials.email.trim().toLowerCase() === ADMIN_EMAIL.trim().toLowerCase()
        const passOk = credentials.password === ADMIN_PASSWORD
        if (emailOk && passOk) {
          return {
            id: 'admin-001',
            email: ADMIN_EMAIL,
            name: 'Connectz Admin',
            role: 'Super Admin',
          } as any
        }
        return null
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 }, // 30 days
  pages: {
    // We don't use NextAuth's hosted signIn page — login is rendered as a modal
    // on the main app page. This route exists purely as the credential verifier.
    signIn: '/',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || 'Super Admin'
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'connectz-cctv-dev-secret-please-change-in-production-2026',
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }

import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcrypt";

import { prisma } from "@/lib/prisma";

class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),

    Credentials({
      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("LOGIN ERROR: faltan credenciales");
          return null;
        }

        const email = String(credentials.email)
          .trim()
          .toLowerCase();

        const password = String(credentials.password);

        console.log("LOGIN: buscando usuario:", email);

        const user = await prisma.user.findUnique({
          where: {
            email,
          },
        });

        console.log(
          "LOGIN: usuario encontrado:",
          !!user,
          "tiene password:",
          !!user?.password
        );

        if (!user || !user.password) {
          console.log(
            "LOGIN ERROR: usuario inexistente o sin password"
          );
          return null;
        }

        const validPassword = await bcrypt.compare(
          password,
          user.password
        );

        console.log(
          "LOGIN: contraseña válida:",
          validPassword
        );

        if (!validPassword) {
          console.log(
            "LOGIN ERROR: contraseña incorrecta"
          );
          return null;
        }

        if (!user.emailVerified) {
          console.log(
            "LOGIN ERROR: email no verificado"
          );
          throw new EmailNotVerifiedError();
        }

        const updatedUser = await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            lastLoginAt: new Date(),
          },
        });

        return {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }

      if (!user.email) {
        return false;
      }

      const email = user.email.trim().toLowerCase();

      const existingUser = await prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
        },
      });

      if (existingUser) {
        await prisma.user.update({
          where: {
            id: existingUser.id,
          },
          data: {
            lastLoginAt: new Date(),
            emailVerified: new Date(),
          },
        });
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email.trim().toLowerCase();
      }

      if (user?.name) {
        token.name = user.name;
      }

      if (!token.email) {
        token.id = "";
        token.role = "";
        token.needsRegistration = false;
        return token;
      }

      const databaseUser = await prisma.user.findUnique({
        where: {
          email: token.email.trim().toLowerCase(),
        },
        select: {
          id: true,
          role: true,
          patient: {
            select: {
              id: true,
            },
          },
          doctor: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!databaseUser) {
        token.id = "";
        token.role = "PENDING";
        token.needsRegistration = true;

        return token;
      }

      token.id = databaseUser.id;
      token.role = databaseUser.role;

      if (
        databaseUser.role === "PATIENT" &&
        !databaseUser.patient
      ) {
        token.needsRegistration = true;
      } else {
        token.needsRegistration = false;
      }

      return token;
    },

    session({ session, token }) {
      if (session.user) {
        session.user.id =
          typeof token.id === "string" ? token.id : "";

        session.user.role =
          typeof token.role === "string"
            ? token.role
            : "";

        session.user.needsRegistration =
          Boolean(token.needsRegistration);
      }

      return session;
    },
  },

  secret: process.env.AUTH_SECRET,
});
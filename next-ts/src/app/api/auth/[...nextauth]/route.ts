import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

console.log("✅ next-auth route handler loaded");

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

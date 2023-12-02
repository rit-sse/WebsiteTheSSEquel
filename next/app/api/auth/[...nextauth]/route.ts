import { authOptions } from "@/lib/authOptions";
import NextAuth, { AuthOptions } from "next-auth";


export const handler = NextAuth(authOptions)

export { handler as GET, handler as POST };

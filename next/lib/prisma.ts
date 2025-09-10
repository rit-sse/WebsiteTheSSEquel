/**
 * This file can be imported when using the db prevent the creation of a million postgres connections caused by hot reloading the app
 * 
 * Source: https://www.timsanteford.com/posts/how-to-fix-too-many-database-connections-opened-in-prisma-with-next-js-hot-reload/
 */

import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

// Ensure the global object is extended to store the Prisma client
declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

// Use the existing Prisma client if it exists, or create a new one
export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  // Store the Prisma client in globalThis to reuse in development
  globalThis.prismaGlobal = prisma;
}
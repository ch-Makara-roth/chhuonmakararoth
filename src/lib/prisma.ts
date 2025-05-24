
import { PrismaClient } from '@prisma/client';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let prismaExportInstance: PrismaClient;

console.log('[PrismaLib] Attempting to initialize Prisma Client...');

try {
  if (process.env.NODE_ENV === 'production') {
    prismaExportInstance = new PrismaClient();
    console.log('[PrismaLib] Prisma Client initialized for production.');
  } else {
    if (!global.prisma) {
      console.log('[PrismaLib] No global Prisma instance found, creating new one for development...');
      global.prisma = new PrismaClient({
        // log: ['query', 'info', 'warn', 'error'], // Uncomment for detailed Prisma logs
      });
      console.log('[PrismaLib] New Prisma Client created and cached in global for development.');
    } else {
      console.log('[PrismaLib] Using existing global Prisma instance for development.');
    }
    prismaExportInstance = global.prisma;
  }
} catch (e: any) {
  console.error('[PrismaLib] CRITICAL ERROR DURING PRISMA CLIENT INITIALIZATION:', e.message, e.stack);
  // If initialization fails, prismaExportInstance will be undefined, which leads to the error.
  // It's better to throw here to make the root cause more obvious.
  throw new Error(`Prisma Client failed to initialize: ${e.message}`);
}


if (!prismaExportInstance) {
  // This case should ideally be caught by the try/catch if PrismaClient constructor fails.
  const errorMessage = '[PrismaLib] CRITICAL: Prisma client export is undefined AFTER initialization block. This indicates a failure in PrismaClient instantiation that was not caught.';
  console.error(errorMessage);
  throw new Error(errorMessage);
} else {
  console.log('[PrismaLib] Prisma Client instance is available and will be exported.');
}

export const prisma = prismaExportInstance;

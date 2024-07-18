import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

if (!(global as any).prisma) {
    (global as any).prisma = new PrismaClient();
}
prisma = (global as any).prisma;

export default prisma;
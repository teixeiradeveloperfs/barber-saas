import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'
import { PrismaClient } from '../src/generated/prisma/client.js'
config({ path: '.env.development' })
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }) })
const removed = await prisma.tenant.deleteMany({ where: { slug: process.argv[2] } })
console.log('removidos:', removed.count)
await prisma.$disconnect()

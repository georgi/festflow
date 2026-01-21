import "dotenv/config";
import { PrismaClient, Role, StationType } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hashPin } from "../src/auth/pin";

const databaseUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

// Helper to upsert user with roles
async function upsertUserWithRoles(
  name: string,
  roles: Role[],
  pin: string
) {
  const user = await prisma.user.upsert({
    where: { name },
    update: { active: true, pinHash: hashPin(pin) },
    create: { name, pinHash: hashPin(pin) }
  });

  // Delete existing roles and recreate
  await prisma.userRole.deleteMany({ where: { userId: user.id } });
  for (const role of roles) {
    await prisma.userRole.create({
      data: { userId: user.id, role }
    });
  }

  return user;
}

async function main() {
  const kitchen = await prisma.station.upsert({
    where: { name: "Kitchen" },
    update: { type: StationType.KITCHEN, active: true },
    create: { name: "Kitchen", type: StationType.KITCHEN }
  });

  const bar = await prisma.station.upsert({
    where: { name: "Bar" },
    update: { type: StationType.BAR, active: true },
    create: { name: "Bar", type: StationType.BAR }
  });

  const catFood = await prisma.menuCategory.upsert({
    where: { name: "Food" },
    update: { sortOrder: 1, active: true },
    create: { name: "Food", sortOrder: 1 }
  });

  const catDrinks = await prisma.menuCategory.upsert({
    where: { name: "Drinks" },
    update: { sortOrder: 2, active: true },
    create: { name: "Drinks", sortOrder: 2 }
  });

  await prisma.menuItem.upsert({
    where: { name: "Burger" },
    update: { priceCents: 950, soldOut: false, active: true, stationId: kitchen.id, categoryId: catFood.id },
    create: { name: "Burger", priceCents: 950, soldOut: false, stationId: kitchen.id, categoryId: catFood.id }
  });

  await prisma.menuItem.upsert({
    where: { name: "Fries" },
    update: { priceCents: 350, soldOut: false, active: true, stationId: kitchen.id, categoryId: catFood.id },
    create: { name: "Fries", priceCents: 350, soldOut: false, stationId: kitchen.id, categoryId: catFood.id }
  });

  await prisma.menuItem.upsert({
    where: { name: "Salad" },
    update: { priceCents: 600, soldOut: true, active: true, stationId: kitchen.id, categoryId: catFood.id },
    create: { name: "Salad", priceCents: 600, soldOut: true, stationId: kitchen.id, categoryId: catFood.id }
  });

  await prisma.menuItem.upsert({
    where: { name: "Beer" },
    update: { priceCents: 450, soldOut: false, active: true, stationId: bar.id, categoryId: catDrinks.id },
    create: { name: "Beer", priceCents: 450, soldOut: false, stationId: bar.id, categoryId: catDrinks.id }
  });

  await prisma.menuItem.upsert({
    where: { name: "Water" },
    update: { priceCents: 200, soldOut: false, active: true, stationId: bar.id, categoryId: catDrinks.id },
    create: { name: "Water", priceCents: 200, soldOut: false, stationId: bar.id, categoryId: catDrinks.id }
  });

  for (const name of ["Table 1", "Table 2", "Table 3", "Table 4"]) {
    await prisma.table.upsert({
      where: { name },
      update: { active: true },
      create: { name }
    });
  }

  // Multi-role user: Mia can be both WAITER and CASHIER
  await upsertUserWithRoles("Mia", [Role.WAITER, Role.CASHIER], "1111");

  await upsertUserWithRoles("Noah", [Role.WAITER], "2222");

  await upsertUserWithRoles("Kitchen", [Role.KITCHEN], "3333");

  await upsertUserWithRoles("Bar", [Role.BAR], "4444");

  await upsertUserWithRoles("Cashier", [Role.CASHIER], "5555");

  await upsertUserWithRoles("Admin", [Role.ADMIN], "0000");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });

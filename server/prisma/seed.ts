import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ALL_PERMISSIONS = [
  "ITEM_CREATE",
  "ITEM_EDIT",
  "ITEM_DELETE",
  "STOCK_ADD",
  "STOCK_SELL",
  "SALES_HISTORY_VIEW",
  "USERS_MANAGE",
  "ROLES_MANAGE",
  "WEBHOOK_CONFIGURE",
  "LOGS_VIEW",
];

async function main() {
  console.log("Seeding database...");

  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: {},
    create: {
      name: "Admin",
      color: "#ef4444",
      position: 0,
      isSystem: true,
    },
  });

  const vendeurRole = await prisma.role.upsert({
    where: { name: "Vendeur" },
    update: {},
    create: {
      name: "Vendeur",
      color: "#3b82f6",
      position: 1,
      isSystem: false,
    },
  });

  const membreRole = await prisma.role.upsert({
    where: { name: "Membre" },
    update: {},
    create: {
      name: "Membre",
      color: "#22c55e",
      position: 2,
      isSystem: false,
    },
  });

  console.log("Roles created:", { adminRole: adminRole.name, vendeurRole: vendeurRole.name, membreRole: membreRole.name });

  // Assign all permissions to Admin
  for (const perm of ALL_PERMISSIONS) {
    await prisma.rolePermission.upsert({
      where: { roleId_permission: { roleId: adminRole.id, permission: perm } },
      update: {},
      create: { roleId: adminRole.id, permission: perm },
    });
  }

  // Assign permissions to Vendeur
  const vendeurPermissions = ["STOCK_ADD", "STOCK_SELL", "SALES_HISTORY_VIEW"];
  for (const perm of vendeurPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permission: { roleId: vendeurRole.id, permission: perm } },
      update: {},
      create: { roleId: vendeurRole.id, permission: perm },
    });
  }

  // Assign permissions to Membre
  const membrePermissions = ["SALES_HISTORY_VIEW"];
  for (const perm of membrePermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permission: { roleId: membreRole.id, permission: perm } },
      update: {},
      create: { roleId: membreRole.id, permission: perm },
    });
  }

  console.log("Permissions assigned.");

  const bcrypt = await import("bcrypt");
  const adminPasswordHash = await bcrypt.hash("admin123", 12);
  const adminUser = await prisma.user.upsert({
    where: { username: "Admin" },
    update: {},
    create: {
      username: "Admin",
      passwordHash: adminPasswordHash,
      roleId: adminRole.id,
    },
  });
  console.log("Default admin user created:", adminUser.username);

  const categories = ["Armes", "Vêtements", "Sacs", "Accessoires", "Consommables", "Véhicules", "Divers"];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("Default categories created.");

  const rarities = [
    { name: "Commun", color: "#9ca3af", position: 0 },
    { name: "Peu commun", color: "#22c55e", position: 1 },
    { name: "Rare", color: "#3b82f6", position: 2 },
    { name: "Épique", color: "#a855f7", position: 3 },
    { name: "Légendaire", color: "#f59e0b", position: 4 },
    { name: "Mythique", color: "#ef4444", position: 5 },
  ];
  for (const r of rarities) {
    await prisma.rarity.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
  }
  console.log("Default rarities created.");

  await prisma.webhookConfig.create({
    data: {
      discordUrl: null,
      saleEvents: true,
      itemEvents: true,
    },
  });
  console.log("Default webhook config created.");

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

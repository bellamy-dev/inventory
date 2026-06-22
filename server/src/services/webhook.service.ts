import { PrismaClient } from "@prisma/client";
import {
  sendDiscordWebhook,
  buildDiscordEmbed,
  DiscordEventType,
} from "../utils/discordEmbed";

const prisma = new PrismaClient();

export async function getWebhookConfig() {
  let config = await prisma.webhookConfig.findFirst();
  if (!config) {
    config = await prisma.webhookConfig.create({
      data: { discordUrl: null },
    });
  }
  return config;
}

export async function updateWebhookConfig(data: {
  discordUrl?: string;
  saleEvents?: boolean;
  itemEvents?: boolean;
}) {
  let config = await prisma.webhookConfig.findFirst();
  if (!config) {
    config = await prisma.webhookConfig.create({ data });
  } else {
    config = await prisma.webhookConfig.update({
      where: { id: config.id },
      data,
    });
  }
  return config;
}

export async function sendTestWebhook() {
  const config = await getWebhookConfig();
  if (!config.discordUrl) {
    throw new Error("Aucune URL de webhook Discord configurée");
  }

  const payload = buildDiscordEmbed(
    "sale",
    [
      { name: "Test", value: "Le webhook Discord fonctionne correctement !", inline: false },
      { name: "Serveur", value: "Stockage RP", inline: true },
      { name: "Date", value: new Date().toLocaleString("fr-FR"), inline: true },
    ]
  );

  return sendDiscordWebhook(config.discordUrl, payload);
}

export async function notifySale(
  itemName: string,
  quantity: number,
  totalPrice: number,
  sellerName: string,
  imageUrl?: string | null
) {
  const config = await getWebhookConfig();
  if (!config.discordUrl || !config.saleEvents) return false;

  const fields = [
    { name: "Objet", value: itemName, inline: true },
    { name: "Quantité", value: `x${quantity}`, inline: true },
    { name: "Prix total", value: `${totalPrice}$`, inline: true },
    { name: "Vendeur", value: sellerName, inline: true },
  ];

  const payload = buildDiscordEmbed("sale", fields, imageUrl || undefined);
  return sendDiscordWebhook(config.discordUrl, payload);
}

export async function notifyItemCreated(
  itemName: string,
  categoryName: string,
  imageUrl?: string | null
) {
  const config = await getWebhookConfig();
  if (!config.discordUrl || !config.itemEvents) return false;

  const fields = [
    { name: "Objet", value: itemName, inline: true },
    { name: "Catégorie", value: categoryName, inline: true },
  ];

  const payload = buildDiscordEmbed(
    "item_created",
    fields,
    imageUrl || undefined
  );
  return sendDiscordWebhook(config.discordUrl, payload);
}

export async function notifyItemDeleted(
  itemName: string,
  categoryName: string
) {
  const config = await getWebhookConfig();
  if (!config.discordUrl || !config.itemEvents) return false;

  const fields = [
    { name: "Objet", value: itemName, inline: true },
    { name: "Catégorie", value: categoryName, inline: true },
  ];

  const payload = buildDiscordEmbed("item_deleted", fields);
  return sendDiscordWebhook(config.discordUrl, payload);
}

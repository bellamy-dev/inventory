import axios from "axios";

export type DiscordEventType = "sale" | "item_created" | "item_deleted";

const EVENT_COLORS: Record<DiscordEventType, number> = {
  sale: 0x3b82f6,
  item_created: 0x22c55e,
  item_deleted: 0xef4444,
};

const EVENT_TITLES: Record<DiscordEventType, string> = {
  sale: "Vente effectuée",
  item_created: "Objet créé",
  item_deleted: "Objet supprimé",
};

interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export function buildDiscordEmbed(
  eventType: DiscordEventType,
  fields: EmbedField[],
  thumbnailUrl?: string
) {
  const validThumbnail = thumbnailUrl && thumbnailUrl.startsWith("http") ? thumbnailUrl : undefined;

  return {
    embeds: [
      {
        title: EVENT_TITLES[eventType],
        color: EVENT_COLORS[eventType],
        fields: fields.map((f) => ({
          name: f.name,
          value: f.value,
          inline: f.inline ?? false,
        })),
        thumbnail: validThumbnail ? { url: validThumbnail } : undefined,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export async function sendDiscordWebhook(
  webhookUrl: string,
  payload: ReturnType<typeof buildDiscordEmbed>
): Promise<boolean> {
  if (!webhookUrl) return false;
  try {
    await axios.post(webhookUrl, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });
    return true;
  } catch (error) {
    console.error("Discord webhook error:", error);
    return false;
  }
}

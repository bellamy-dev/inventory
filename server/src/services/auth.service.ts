import { PrismaClient } from "@prisma/client";
import { hashPassword, comparePassword } from "../utils/password";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { JwtPayload } from "../types";
import { env } from "../config/env";

const prisma = new PrismaClient();

export async function login(username: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      role: {
        include: { permissions: true },
      },
    },
  });

  if (!user) {
    throw new Error("Identifiants incorrects");
  }

  if (!user.passwordHash) {
    throw new Error("Ce compte utilise la connexion Discord");
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new Error("Identifiants incorrects");
  }

  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    roleId: user.roleId,
    rolePosition: user.role.position,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      role: {
        id: user.role.id,
        name: user.role.name,
        color: user.role.color,
        position: user.role.position,
      },
      permissions: user.role.permissions.map((p: { permission: string }) => p.permission),
    },
  };
}

export async function refreshAuth(refreshToken: string) {
  try {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: { include: { permissions: true } },
      },
    });

    if (!user) {
      throw new Error("Utilisateur introuvable");
    }

    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      roleId: user.roleId,
      rolePosition: user.role.position,
    };

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: {
          id: user.role.id,
          name: user.role.name,
          color: user.role.color,
          position: user.role.position,
        },
        permissions: user.role.permissions.map((p: { permission: string }) => p.permission),
      },
    };
  } catch {
    throw new Error("Refresh token invalide");
  }
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: { include: { permissions: true } },
    },
  });

  if (!user) {
    throw new Error("Utilisateur introuvable");
  }

  return {
    id: user.id,
    username: user.username,
    role: {
      id: user.role.id,
      name: user.role.name,
      color: user.role.color,
      position: user.role.position,
    },
    permissions: user.role.permissions.map((p: { permission: string }) => p.permission),
  };
}

export async function exchangeDiscordCode(code: string) {
  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    client_secret: env.DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: env.DISCORD_REDIRECT_URI,
  });

  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    console.error("Discord token exchange failed:", tokenRes.status, body);
    throw new Error("Échec de l'échange du code Discord");
  }

  const tokenData = (await tokenRes.json()) as { access_token: string };

  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userRes.ok) {
    throw new Error("Échec de la récupération de l'identité Discord");
  }

  return (await userRes.json()) as {
    id: string;
    username: string;
    avatar: string | null;
    discriminator: string;
  };
}

export async function checkDiscordRole(discordUserId: string): Promise<boolean> {
  const res = await fetch(
    `https://discord.com/api/guilds/${env.DISCORD_GUILD_ID}/members/${discordUserId}`,
    {
      headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    console.error("Discord member fetch failed:", res.status, body);
    throw new Error("Impossible de vérifier l'appartenance au serveur Discord");
  }

  const member = (await res.json()) as { roles: string[] };
  return member.roles.includes(env.DISCORD_REQUIRED_ROLE_ID);
}

export async function discordLogin(discordUser: {
  id: string;
  username: string;
  avatar: string | null;
}) {
  const hasRole = await checkDiscordRole(discordUser.id);
  if (!hasRole) {
    throw new Error("no_role");
  }

  let user = await prisma.user.findUnique({
    where: { discordId: discordUser.id },
    include: { role: { include: { permissions: true } } },
  });

  if (!user) {
    const membreRole = await prisma.role.findFirst({
      where: { name: "Membre" },
    });
    if (!membreRole) {
      throw new Error("Rôle 'Membre' introuvable dans la base de données");
    }

    let username = discordUser.username;
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      username = `${discordUser.username}_${discordUser.id.slice(-4)}`;
    }

    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : null;

    user = await prisma.user.create({
      data: {
        username,
        discordId: discordUser.id,
        avatarUrl,
        roleId: membreRole.id,
      },
      include: { role: { include: { permissions: true } } },
    });
  }

  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    roleId: user.roleId,
    rolePosition: user.role.position,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      role: {
        id: user.role.id,
        name: user.role.name,
        color: user.role.color,
        position: user.role.position,
      },
      permissions: user.role.permissions.map((p: { permission: string }) => p.permission),
    },
  };
}

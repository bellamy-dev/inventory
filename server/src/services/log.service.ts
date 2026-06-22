import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createLog(
  userId: string | null,
  action: string,
  details?: Record<string, unknown>
) {
  return prisma.actionLog.create({
    data: {
      userId,
      action,
      details: details ? JSON.stringify(details) : undefined,
    },
    include: {
      user: { select: { id: true, username: true } },
    },
  });
}

export async function getLogs(filters: {
  page?: number;
  limit?: number;
  action?: string;
}) {
  const page = filters.page || 1;
  const limit = filters.limit || 100;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (filters.action) where.action = filters.action;

  const [logs, total] = await Promise.all([
    prisma.actionLog.findMany({
      where,
      include: {
        user: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.actionLog.count({ where }),
  ]);

  return {
    data: logs.map((log) => ({
      ...log,
      details: log.details ? JSON.parse(log.details as string) : null,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

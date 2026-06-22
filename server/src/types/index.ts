export enum Permission {
  ITEM_CREATE = "ITEM_CREATE",
  ITEM_EDIT = "ITEM_EDIT",
  ITEM_DELETE = "ITEM_DELETE",
  STOCK_ADD = "STOCK_ADD",
  STOCK_SELL = "STOCK_SELL",
  SALES_HISTORY_VIEW = "SALES_HISTORY_VIEW",
  USERS_MANAGE = "USERS_MANAGE",
  ROLES_MANAGE = "ROLES_MANAGE",
  WEBHOOK_CONFIGURE = "WEBHOOK_CONFIGURE",
  LOGS_VIEW = "LOGS_VIEW",
}

export const ALL_PERMISSIONS = Object.values(Permission);

export const PERMISSION_LABELS: Record<Permission, string> = {
  [Permission.ITEM_CREATE]: "Créer un objet",
  [Permission.ITEM_EDIT]: "Modifier un objet",
  [Permission.ITEM_DELETE]: "Supprimer un objet",
  [Permission.STOCK_ADD]: "Ajouter du stock",
  [Permission.STOCK_SELL]: "Vendre un objet",
  [Permission.SALES_HISTORY_VIEW]: "Voir l'historique des ventes",
  [Permission.USERS_MANAGE]: "Gérer les utilisateurs",
  [Permission.ROLES_MANAGE]: "Gérer les rôles et permissions",
  [Permission.WEBHOOK_CONFIGURE]: "Configurer le webhook Discord",
  [Permission.LOGS_VIEW]: "Voir les logs d'actions sensibles",
};

export interface JwtPayload {
  userId: string;
  username: string;
  roleId: string;
  rolePosition: number;
}

export interface AuthRequest extends Express.Request {
  user?: JwtPayload;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ActionLogDetails {
  itemName?: string;
  oldRole?: string;
  newRole?: string;
  quantity?: number;
  totalPrice?: number;
  [key: string]: unknown;
}

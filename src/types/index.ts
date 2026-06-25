export interface User {
  id: string;
  username: string;
  role: RoleSummary;
  permissions: Permission[];
}

export interface RoleSummary {
  id: string;
  name: string;
  color: string;
  position: number;
}

export interface Role {
  id: string;
  name: string;
  color: string;
  position: number;
  isSystem: boolean;
  permissions: RolePermission[];
  _count: { users: number };
  createdAt: string;
}

export interface RolePermission {
  permission: Permission;
}

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
  HARVEST_DECLARE = "HARVEST_DECLARE",
  HARVEST_VALIDATE = "HARVEST_VALIDATE",
}

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
  [Permission.HARVEST_DECLARE]: "Déclarer une récolte",
  [Permission.HARVEST_VALIDATE]: "Valider les récoltes et gérer les paiements",
};

export interface Category {
  id: string;
  name: string;
  _count?: { itemTypes: number };
}

export interface Rarity {
  id: string;
  name: string;
  color: string;
  position: number;
}

export interface ItemType {
  id: string;
  name: string;
  imageUrl: string | null;
  iconKey: string | null;
  category: Category;
  rarity: Rarity;
  weight: number;
  buyPrice: number;
  sellPrice: number;
  unlimitedStock: boolean;
  maxStock: number | null;
  lowStockAlert: number | null;
  stockItems: StockItem | null;
  harvestCommissionPercent: number | null;
  harvestable: boolean;
}

export interface StockItem {
  id: string;
  itemTypeId: string;
  quantity: number;
  position: number;
  itemType: ItemType;
}

export interface Sale {
  id: string;
  itemTypeId: string;
  itemType: ItemType;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  buyerName: string | null;
  sellerId: string;
  seller: { id: string; username: string };
  createdAt: string;
}

export interface ActionLog {
  id: string;
  userId: string | null;
  user: { id: string; username: string } | null;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface WebhookConfig {
  id: string;
  discordUrl: string | null;
  saleEvents: boolean;
  itemEvents: boolean;
  harvestEvents: boolean;
}

export interface UserWithRole {
  id: string;
  username: string;
  role: RoleSummary;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SaleStats {
  totalSales: number;
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
}

export interface UserListItem {
  id: string;
  username: string;
  role: {
    id: string;
    name: string;
    color: string;
    position: number;
  };
  createdAt: string;
}

export interface HarvestEntry {
  id: string;
  itemTypeId: string;
  itemType: ItemType;
  userId: string;
  user: { id: string; username: string; avatarUrl?: string | null };
  quantity: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  commissionPercent: number;
  totalValue: number | null;
  payoutAmount: number | null;
  reviewedById: string | null;
  reviewedBy: { id: string; username: string } | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface PayoutHistory {
  id: string;
  userId: string;
  user: { id: string; username: string };
  amount: number;
  paidById: string;
  paidBy: { id: string; username: string };
  paidAt: string;
}

export interface HarvestStats {
  id: string;
  username: string;
  avatarUrl: string | null;
  harvestCommissionPercent: number | null;
  pendingPayout: number;
  role: { id: string; name: string; color: string };
}

export interface Vehicle {
  id: string;
  name: string;
  imageUrl: string | null;
  maxWeight: number;
  position: number;
  items: VehicleStockItem[];
  createdAt: string;
  updatedAt: string;
}

export interface VehicleStockItem {
  id: string;
  vehicleId: string;
  itemTypeId: string;
  quantity: number;
  position: number;
  itemType: ItemType;
}

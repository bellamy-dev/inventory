import { useAuth } from "../context/AuthContext";
import { Permission } from "../types";

export function usePermissions() {
  const { user, hasPermission } = useAuth();

  return {
    user,
    hasPermission,
    canCreateItem: hasPermission(Permission.ITEM_CREATE),
    canEditItem: hasPermission(Permission.ITEM_EDIT),
    canDeleteItem: hasPermission(Permission.ITEM_DELETE),
    canAddStock: hasPermission(Permission.STOCK_ADD),
    canSellStock: hasPermission(Permission.STOCK_SELL),
    canViewSales: hasPermission(Permission.SALES_HISTORY_VIEW),
    canManageUsers: hasPermission(Permission.USERS_MANAGE),
    canManageRoles: hasPermission(Permission.ROLES_MANAGE),
    canConfigureWebhook: hasPermission(Permission.WEBHOOK_CONFIGURE),
    canViewLogs: hasPermission(Permission.LOGS_VIEW),
  };
}

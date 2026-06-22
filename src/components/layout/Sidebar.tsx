import { NavLink } from "react-router-dom";
import { usePermissions } from "../../hooks/usePermissions";
import {
  Package,
  PlusCircle,
  History,
  Users,
  Shield,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { to: "/inventaire", icon: Package, label: "Inventaire", permission: null },
  { to: "/creer-objet", icon: PlusCircle, label: "Créer un objet", permission: "ITEM_CREATE" as const },
  { to: "/historique", icon: History, label: "Historique des ventes", permission: "SALES_HISTORY_VIEW" as const },
  { to: "/utilisateurs", icon: Users, label: "Utilisateurs", permission: "USERS_MANAGE" as const },
  { to: "/roles", icon: Shield, label: "Rôles", permission: "ROLES_MANAGE" as const },
  { to: "/logs", icon: FileText, label: "Logs", permission: "LOGS_VIEW" as const },
  { to: "/parametres", icon: Settings, label: "Paramètres", permission: "WEBHOOK_CONFIGURE" as const },
];

export function Sidebar() {
  const { hasPermission } = usePermissions();
  const { user, logout } = useAuth();

  const filteredItems = navItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gta-border bg-gta-surface">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gta-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gta-accent text-white font-bold text-sm">
          DC
        </div>
        <div>
          <h1 className="text-sm font-semibold">Diamond City</h1>
          <p className="text-xs text-gta-text-dim">Gestion de Stock</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {filteredItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-gta-accent/15 text-gta-accent"
                  : "text-gta-text-dim hover:bg-gta-surface-hover hover:text-gta-text"
              }`
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gta-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold"
            style={{ backgroundColor: user?.role.color || "#6b7280" }}
          >
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.username}</p>
            <p className="text-xs text-gta-text-dim">{user?.role.name}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gta-text-dim hover:bg-gta-surface-hover hover:text-gta-danger transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}

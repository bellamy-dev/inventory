import { NavLink } from "react-router-dom";
import { usePermissions } from "../../hooks/usePermissions";
import { Permission } from "../../types";
import {
  Package,
  PlusCircle,
  History,
  Users,
  Shield,
  FileText,
  Settings,
  LogOut,
  Sprout,
  ClipboardCheck,
  DollarSign,
  Car,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const navItems: Array<{ to: string; icon: typeof Package; label: string; permission: Permission | null }> = [
  { to: "/inventaire", icon: Package, label: "Inventaire", permission: null },
  { to: "/vehicules", icon: Car, label: "Véhicules", permission: null },
  { to: "/creer-objet", icon: PlusCircle, label: "Créer un objet", permission: Permission.ITEM_CREATE },
  { to: "/historique", icon: History, label: "Historique des ventes", permission: Permission.SALES_HISTORY_VIEW },
  { to: "/mes-recoltes", icon: Sprout, label: "Mes récoltes", permission: Permission.HARVEST_DECLARE },
  { to: "/validation-recoltes", icon: ClipboardCheck, label: "Validation récoltes", permission: Permission.HARVEST_VALIDATE },
  { to: "/stats-paie", icon: DollarSign, label: "Statistiques & Paie", permission: null },
  { to: "/utilisateurs", icon: Users, label: "Utilisateurs", permission: Permission.USERS_MANAGE },
  { to: "/roles", icon: Shield, label: "Rôles", permission: Permission.ROLES_MANAGE },
  { to: "/logs", icon: FileText, label: "Logs", permission: Permission.LOGS_VIEW },
  { to: "/parametres", icon: Settings, label: "Paramètres", permission: Permission.WEBHOOK_CONFIGURE },
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

import { useState, useEffect, useCallback } from "react";
import { Header } from "../components/layout/Header";
import { Spinner } from "../components/ui/Spinner";
import { Button } from "../components/ui/Button";
import { logsApi } from "../api/logs.api";
import { ActionLog } from "../types";
import toast from "react-hot-toast";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Plus,
  Trash2,
  Pencil,
  Package,
  UserPlus,
  UserMinus,
  Shield,
  ShieldCheck,
  Settings,
  ArrowUpDown,
  Sprout,
  CheckCircle,
  XCircle,
  DollarSign,
  Undo2,
  Car,
  ArrowRightLeft,
} from "lucide-react";

interface LogDetails {
  itemName?: string;
  itemId?: string;
  imageUrl?: string | null;
  categoryName?: string;
  rarityName?: string;
  quantity?: number;
  amount?: number;
  totalPrice?: number;
  buyerName?: string | null;
  saleId?: string;
  username?: string;
  userId?: string;
  newRoleId?: string;
  roleName?: string;
  roleId?: string;
  permissions?: string[];
  discordUrl?: string;
  saleEvents?: boolean;
  itemEvents?: boolean;
  vehicleName?: string;
  fromName?: string;
  toName?: string;
  [key: string]: unknown;
}

const ACTION_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    icon: typeof ShoppingCart;
    format: (d: LogDetails) => string;
  }
> = {
  SALE_COMPLETED: {
    label: "Vente",
    color: "#3b82f6",
    icon: ShoppingCart,
    format: (d) => {
      const parts = [`${d.itemName || "?"} x${d.quantity || 0}`];
      parts.push(`${d.totalPrice?.toLocaleString("fr-FR")}$`);
      if (d.buyerName) parts.push(`Client: ${d.buyerName}`);
      return parts.join(" — ");
    },
  },
  SALE_DELETED: {
    label: "Vente supprimée",
    color: "#ef4444",
    icon: Trash2,
    format: (d) => {
      const parts = [`${d.itemName || "?"} x${d.quantity || 0}`];
      parts.push(`${d.totalPrice?.toLocaleString("fr-FR")}$`);
      parts.push("Stock restauré");
      return parts.join(" — ");
    },
  },
  ITEM_CREATED: {
    label: "Objet créé",
    color: "#22c55e",
    icon: Plus,
    format: (d) => d.itemName || "?",
  },
  ITEM_DELETED: {
    label: "Objet supprimé",
    color: "#ef4444",
    icon: Trash2,
    format: (d) => d.itemName || "?",
  },
  ITEM_UPDATED: {
    label: "Objet modifié",
    color: "#f59e0b",
    icon: Pencil,
    format: (d) => d.itemName || "?",
  },
  STOCK_UPDATED: {
    label: "Stock modifié",
    color: "#3b82f6",
    icon: Package,
    format: (d) => {
      const name = d.itemName || "?";
      return `${name} — ${d.quantity ?? "?"} unités en stock`;
    },
  },
  STOCK_ADDED: {
    label: "Stock ajouté",
    color: "#22c55e",
    icon: Package,
    format: (d) => {
      const name = d.itemName || "?";
      return `${name} — +${d.amount ?? "?"} unités`;
    },
  },
  STOCK_REMOVED: {
    label: "Stock retiré",
    color: "#ef4444",
    icon: Package,
    format: (d) => {
      const name = d.itemName || "?";
      const reason = d.reason ? ` (${d.reason})` : "";
      return `${name} — -${d.amount ?? "?"} unités${reason}`;
    },
  },
  USER_CREATED: {
    label: "Compte créé",
    color: "#22c55e",
    icon: UserPlus,
    format: (d) => d.username || "?",
  },
  USER_DELETED: {
    label: "Compte supprimé",
    color: "#ef4444",
    icon: UserMinus,
    format: (d) => d.username || "?",
  },
  USER_ROLE_CHANGED: {
    label: "Rôle changé",
    color: "#f59e0b",
    icon: Shield,
    format: (d) => `${d.username || "?"} → nouveau rôle assigné`,
  },
  ROLE_CREATED: {
    label: "Rôle créé",
    color: "#3b82f6",
    icon: ShieldCheck,
    format: (d) => d.roleName || "?",
  },
  ROLE_DELETED: {
    label: "Rôle supprimé",
    color: "#ef4444",
    icon: Trash2,
    format: (d) => d.roleName || "?",
  },
  ROLE_UPDATED: {
    label: "Rôle modifié",
    color: "#3b82f6",
    icon: Pencil,
    format: (d) => d.roleName || "?",
  },
  ROLE_HIERARCHY_CHANGED: {
    label: "Hiérarchie modifiée",
    color: "#f59e0b",
    icon: ArrowUpDown,
    format: () => "Ordre des rôles réorganisé",
  },
  ROLE_PERMISSIONS_CHANGED: {
    label: "Permissions modifiées",
    color: "#a855f7",
    icon: ShieldCheck,
    format: (d) => {
      const count = d.permissions?.length || 0;
      return `${d.roleName || "?"} — ${count} permission(s)`;
    },
  },
  WEBHOOK_UPDATED: {
    label: "Webhook modifié",
    color: "#6b7280",
    icon: Settings,
    format: (d) =>
      d.discordUrl === "Configuré" ? "URL configurée" : "Configuration mise à jour",
  },
  HARVEST_DECLARED: {
    label: "Récolte déclarée",
    color: "#f59e0b",
    icon: Sprout,
    format: (d) => `${d.itemName || "?"} x${d.quantity || 0}`,
  },
  HARVEST_APPROVED: {
    label: "Récolte validée",
    color: "#22c55e",
    icon: CheckCircle,
    format: (d) => {
      const parts = [`${d.itemName || "?"} x${d.quantity || 0}`];
      parts.push(`${d.memberUsername || "?"}`);
      if (d.payoutAmount != null) parts.push(`+${d.payoutAmount}$`);
      return parts.join(" — ");
    },
  },
  HARVEST_REJECTED: {
    label: "Récolte refusée",
    color: "#ef4444",
    icon: XCircle,
    format: (d) => `${d.itemName || "?"} x${d.quantity || 0} — ${d.memberUsername || "?"}`,
  },
  HARVEST_MARKED_PAID: {
    label: "Paiement effectué",
    color: "#22c55e",
    icon: DollarSign,
    format: (d) => `${d.memberUsername || "?"} — ${d.amount?.toLocaleString("fr-FR") || 0}$`,
  },
  HARVEST_REVIEW_CANCELLED: {
    label: "Décision annulée",
    color: "#f59e0b",
    icon: Undo2,
    format: (d) => `${d.itemName || "?"} x${d.quantity || 0}`,
  },
  VEHICLE_CREATED: {
    label: "Véhicule créé",
    color: "#22c55e",
    icon: Car,
    format: (d) => d.vehicleName || "?",
  },
  VEHICLE_DELETED: {
    label: "Véhicule supprimé",
    color: "#ef4444",
    icon: Car,
    format: (d) => d.vehicleName || "Inconnu",
  },
  ITEM_MOVED: {
    label: "Objet déplacé",
    color: "#3b82f6",
    icon: ArrowRightLeft,
    format: (d) => {
      const name = d.itemName || "Inconnu";
      const qty = d.quantity || 0;
      const from = d.fromName || "?";
      const to = d.toName || "?";
      return `${name} x${qty} — ${from} → ${to}`;
    },
  },
};

export function LogsPage() {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await logsApi.getAll({ page, limit: 50 });
      setLogs(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function isSameDay(a: string, b: string) {
    const da = new Date(a);
    const db = new Date(b);
    return (
      da.getFullYear() === db.getFullYear() &&
      da.getMonth() === db.getMonth() &&
      da.getDate() === db.getDate()
    );
  }

  let lastDate = "";

  return (
    <>
      <Header title="Logs d'actions" subtitle={`${total} entrée(s)`} />

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : logs.length === 0 ? (
        <div className="gta-card text-center py-12 text-gta-text-dim">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          Aucun log enregistré
        </div>
      ) : (
        <div className="gta-card">
          <div className="space-y-0">
            {logs.map((log) => {
              const config = ACTION_CONFIG[log.action];
              const Icon = config?.icon || FileText;
              const color = config?.color || "#6b7280";
              const details = (log.details || {}) as LogDetails;
              const description = config?.format(details) || JSON.stringify(details);
              const logDate = formatDate(log.createdAt);
              const showDateSeparator = logDate !== lastDate;
              lastDate = logDate;

              return (
                <div key={log.id}>
                  {showDateSeparator && (
                    <div className="flex items-center gap-3 py-3 mt-2 first:mt-0">
                      <div className="h-px flex-1 bg-gta-border" />
                      <span className="text-xs font-medium text-gta-text-dim uppercase tracking-wide">
                        {logDate}
                      </span>
                      <div className="h-px flex-1 bg-gta-border" />
                    </div>
                  )}
                  <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gta-bg/50 transition-colors group">
                    {details.imageUrl ? (
                      <img
                        src={details.imageUrl}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-lg object-contain bg-gta-bg"
                      />
                    ) : (
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: color + "18" }}
                      >
                        <Icon className="h-4 w-4" style={{ color }} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span
                          className="text-sm font-semibold"
                          style={{ color }}
                        >
                          {config?.label || log.action}
                        </span>
                        <span className="text-sm text-gta-text truncate">
                          {description}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {log.user && (
                          <span className="text-xs text-gta-text-dim">
                            par <span className="text-gta-text font-medium">{log.user.username}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-xs text-gta-text-dim shrink-0 tabular-nums">
                      {formatTime(log.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-gta-border">
              <Button
                variant="ghost"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="flex items-center px-4 text-sm text-gta-text-dim">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="ghost"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

import { useState, useEffect, useCallback } from "react";
import { Header } from "../components/layout/Header";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { harvestsApi } from "../api/harvests.api";
import { HarvestStats, PayoutHistory } from "../types";
import { usePermissions } from "../hooks/usePermissions";
import toast from "react-hot-toast";
import {
  DollarSign,
  Users,
  History,
  CheckCircle,
} from "lucide-react";

export function HarvestStatsPage() {
  const { canManageRoles } = usePermissions();
  const [stats, setStats] = useState<HarvestStats[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<PayoutHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stats" | "history">("stats");
  const [confirmPaid, setConfirmPaid] = useState<HarvestStats | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, historyData] = await Promise.all([
        harvestsApi.getStats(),
        harvestsApi.getPayoutHistory(),
      ]);
      setStats(statsData);
      setPayoutHistory(historyData);
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMarkPaid = async () => {
    if (!confirmPaid) return;
    setMarkingPaid(true);
    try {
      await harvestsApi.markPaid(confirmPaid.id);
      toast.success(`${confirmPaid.username} marqué comme payé !`);
      setConfirmPaid(null);
      loadData();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || "Erreur");
    } finally {
      setMarkingPaid(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  return (
    <>
      <Header
        title="Statistiques & Paie"
        subtitle="Suivi des revenus et paiements des membres"
      />

      <div className="max-w-4xl space-y-4">
        {/* Onglets */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === "stats"
                ? "bg-gta-accent/15 text-gta-accent font-medium"
                : "text-gta-text-dim hover:bg-gta-surface-hover"
            }`}
          >
            <Users className="h-4 w-4" />
            Membres
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === "history"
                ? "bg-gta-accent/15 text-gta-accent font-medium"
                : "text-gta-text-dim hover:bg-gta-surface-hover"
            }`}
          >
            <History className="h-4 w-4" />
            Historique des paiements
          </button>
        </div>

        {/* Tab Membres */}
        {activeTab === "stats" && (
          <div className="gta-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gta-border text-gta-text-dim">
                    <th className="text-left py-3 px-3 font-medium">Membre</th>
                    <th className="text-left py-3 px-3 font-medium">Rôle</th>
                    <th className="text-right py-3 px-3 font-medium">
                      <div className="flex items-center gap-1 justify-end">
                        <DollarSign className="h-3 w-3" />
                        Dû
                      </div>
                    </th>
                    {canManageRoles && (
                      <th className="text-right py-3 px-3 font-medium">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-gta-border/50 hover:bg-gta-bg/50"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: s.role.color }}
                          >
                            {s.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{s.username}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: s.role.color + "20",
                            color: s.role.color,
                          }}
                        >
                          {s.role.name}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`font-semibold ${
                            s.pendingPayout > 0
                              ? "text-gta-warning"
                              : "text-gta-text-dim"
                          }`}
                        >
                          {s.pendingPayout.toLocaleString("fr-FR")}$
                        </span>
                      </td>
                      {canManageRoles && (
                        <td className="py-3 px-3 text-right">
                          {s.pendingPayout > 0 && (
                            <Button
                              variant="ghost"
                              onClick={() => setConfirmPaid(s)}
                              className="text-gta-success hover:text-green-400 text-xs"
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1 inline" />
                              Marquer payé
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {stats.length === 0 && (
              <div className="text-center py-8 text-gta-text-dim">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Aucun membre trouvé</p>
              </div>
            )}
          </div>
        )}

        {/* Tab Historique paiements */}
        {activeTab === "history" && (
          <div className="gta-card">
            {payoutHistory.length === 0 ? (
              <div className="text-center py-12 text-gta-text-dim">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucun paiement enregistré</p>
              </div>
            ) : (
              <div className="space-y-2">
                {payoutHistory.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-gta-bg/50 transition-colors"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gta-success/15 shrink-0">
                      <DollarSign className="h-4 w-4 text-gta-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{p.user.username}</span>{" "}
                        a reçu{" "}
                        <span className="text-gta-success font-semibold">
                          {p.amount.toLocaleString("fr-FR")}$
                        </span>
                      </p>
                      <p className="text-xs text-gta-text-dim">
                        Payé par {p.paidBy.username} —{" "}
                        {new Date(p.paidAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmPaid}
        onClose={() => setConfirmPaid(null)}
        onConfirm={handleMarkPaid}
        title="Marquer comme payé"
        message={`Confirmer que ${confirmPaid?.username} a reçu ${confirmPaid?.pendingPayout.toLocaleString("fr-FR")}$ ? Le solde dû sera remis à zéro.`}
        confirmLabel="Confirmer le paiement"
        loading={markingPaid}
      />
    </>
  );
}

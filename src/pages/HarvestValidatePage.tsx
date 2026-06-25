import { useState, useEffect, useCallback } from "react";
import { Header } from "../components/layout/Header";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { Badge } from "../components/ui/Badge";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { harvestsApi } from "../api/harvests.api";
import { HarvestEntry } from "../types";
import toast from "react-hot-toast";
import {
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  ClipboardCheck,
  Undo2,
} from "lucide-react";

const STATUS_CONFIG = {
  PENDING: { label: "En attente", color: "#f59e0b", icon: Clock },
  APPROVED: { label: "Validée", color: "#22c55e", icon: CheckCircle },
  REJECTED: { label: "Refusée", color: "#ef4444", icon: XCircle },
};

export function HarvestValidatePage() {
  const [harvests, setHarvests] = useState<HarvestEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("PENDING");
  const [confirmTarget, setConfirmTarget] = useState<{
    harvest: HarvestEntry;
    action: "approve" | "reject" | "cancel";
  } | null>(null);
  const [processing, setProcessing] = useState(false);

  const loadHarvests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await harvestsApi.getAll(filter ? { status: filter } : undefined);
      setHarvests(data);
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadHarvests();
  }, [loadHarvests]);

  const handleConfirm = async () => {
    if (!confirmTarget) return;
    setProcessing(true);
    try {
      if (confirmTarget.action === "approve") {
        await harvestsApi.approve(confirmTarget.harvest.id);
        toast.success("Récolte validée !");
      } else if (confirmTarget.action === "reject") {
        await harvestsApi.reject(confirmTarget.harvest.id);
        toast.success("Récolte refusée");
      } else {
        await harvestsApi.cancel(confirmTarget.harvest.id);
        toast.success("Annulation effectuée");
      }
      setConfirmTarget(null);
      loadHarvests();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || "Erreur");
    } finally {
      setProcessing(false);
    }
  };

  const filters = [
    { value: "PENDING", label: "En attente" },
    { value: "APPROVED", label: "Validées" },
    { value: "REJECTED", label: "Refusées" },
    { value: "", label: "Toutes" },
  ];

  const getConfirmTitle = () => {
    if (!confirmTarget) return "";
    if (confirmTarget.action === "approve") return "Valider la récolte";
    if (confirmTarget.action === "reject") return "Refuser la récolte";
    return "Annuler la décision";
  };

  const getConfirmMessage = () => {
    if (!confirmTarget) return "";
    const qty = confirmTarget.harvest.quantity;
    const name = confirmTarget.harvest.itemType.name;
    if (confirmTarget.action === "approve") {
      return `Valider la récolte de x${qty} ${name} ? Le stock sera augmenté et le membre sera rémunéré.`;
    }
    if (confirmTarget.action === "reject") {
      return `Refuser la récolte de x${qty} ${name} ? Aucun impact sur le stock ou les revenus.`;
    }
    if (confirmTarget.harvest.status === "APPROVED") {
      return `Annuler la validation de x${qty} ${name} ? Le stock sera diminué et le montant sera déduit du pendingPayout.`;
    }
    return `Annuler le refus de x${qty} ${name} ? La déclaration repasse en attente.`;
  };

  return (
    <>
      <Header
        title="Validation des récoltes"
        subtitle="Approuver ou refuser les déclarations"
      />

      <div className="max-w-4xl space-y-4">
        {/* Filtres */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gta-text-dim" />
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === f.value
                  ? "bg-gta-accent/15 text-gta-accent font-medium"
                  : "text-gta-text-dim hover:bg-gta-surface-hover"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        <div className="gta-card">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : harvests.length === 0 ? (
            <div className="text-center py-12 text-gta-text-dim">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucune déclaration {filter ? `avec le statut "${filter}"` : ""}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {harvests.map((h) => {
                const config = STATUS_CONFIG[h.status];
                const StatusIcon = config.icon;
                return (
                  <div
                    key={h.id}
                    className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-gta-bg/50 transition-colors"
                  >
                    {h.itemType.imageUrl ? (
                      <img
                        src={h.itemType.imageUrl}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-lg object-contain bg-gta-bg"
                      />
                    ) : (
                      <div className="h-9 w-9 shrink-0 rounded-lg bg-gta-bg flex items-center justify-center text-gta-text-dim text-xs">
                        ?
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {h.itemType.name}
                        </span>
                        <span className="text-xs text-gta-text-dim">x{h.quantity}</span>
                      </div>
                      <p className="text-xs text-gta-text-dim">
                        Déclaré par{" "}
                        <span className="text-gta-text font-medium">
                          {h.user.username}
                        </span>{" "}
                        — {new Date(h.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                      {h.status !== "PENDING" && h.reviewedBy && (
                        <p className="text-xs text-gta-text-dim">
                          {h.status === "APPROVED" ? "Validée" : "Refusée"} par{" "}
                          {h.reviewedBy.username}
                          {h.payoutAmount != null && (
                            <span className="text-gta-success font-medium">
                              {" "}
                              — {h.payoutAmount.toLocaleString("fr-FR")}$
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <Badge color={config.color}>
                      <StatusIcon className="h-3 w-3 mr-1 inline" />
                      {config.label}
                    </Badge>
                    <div className="flex gap-1.5 shrink-0">
                      {h.status === "PENDING" && (
                        <>
                          <Button
                            variant="ghost"
                            onClick={() =>
                              setConfirmTarget({ harvest: h, action: "approve" })
                            }
                            className="text-gta-success hover:text-green-400"
                            title="Valider"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() =>
                              setConfirmTarget({ harvest: h, action: "reject" })
                            }
                            className="text-gta-danger hover:text-red-400"
                            title="Refuser"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {h.status !== "PENDING" && (
                        <Button
                          variant="ghost"
                          onClick={() =>
                            setConfirmTarget({ harvest: h, action: "cancel" })
                          }
                          className="text-gta-warning hover:text-amber-400"
                          title="Annuler la décision"
                        >
                          <Undo2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleConfirm}
        title={getConfirmTitle()}
        message={getConfirmMessage()}
        confirmLabel={
          confirmTarget?.action === "approve"
            ? "Valider"
            : confirmTarget?.action === "reject"
            ? "Refuser"
            : "Annuler"
        }
        loading={processing}
      />
    </>
  );
}

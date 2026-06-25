import { useState, useEffect } from "react";
import { Header } from "../components/layout/Header";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Spinner } from "../components/ui/Spinner";
import { Badge } from "../components/ui/Badge";
import { harvestsApi } from "../api/harvests.api";
import { HarvestEntry, ItemType } from "../types";
import toast from "react-hot-toast";
import { Sprout, CheckCircle, XCircle, Clock } from "lucide-react";

const STATUS_CONFIG = {
  PENDING: { label: "En attente", color: "#f59e0b", icon: Clock },
  APPROVED: { label: "Validée", color: "#22c55e", icon: CheckCircle },
  REJECTED: { label: "Refusée", color: "#ef4444", icon: XCircle },
};

export function HarvestDeclarePage() {
  const [items, setItems] = useState<ItemType[]>([]);
  const [harvests, setHarvests] = useState<HarvestEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState("1");

  useEffect(() => {
    Promise.all([harvestsApi.getHarvestableItems(), harvestsApi.getMine()])
      .then(([itemsData, harvestsData]) => {
        setItems(itemsData);
        setHarvests(harvestsData);
        if (itemsData.length > 0) setSelectedItemId(itemsData[0].id);
      })
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || parseInt(quantity) <= 0) {
      toast.error("Sélectionnez un objet et une quantité valide");
      return;
    }
    setSubmitting(true);
    try {
      const harvest = await harvestsApi.declare(selectedItemId, parseInt(quantity));
      setHarvests((prev) => [harvest, ...prev]);
      setQuantity("1");
      toast.success("Récolte déclarée !");
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || "Erreur lors de la déclaration");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  return (
    <>
      <Header title="Mes récoltes" subtitle="Déclarer et suivre vos récoltes" />

      <div className="max-w-3xl space-y-6">
        {/* Formulaire de déclaration */}
        <form onSubmit={handleSubmit} className="gta-card space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gta-success/15">
              <Sprout className="h-5 w-5 text-gta-success" />
            </div>
            <div>
              <h3 className="font-medium">Nouvelle déclaration</h3>
              <p className="text-xs text-gta-text-dim">Déclarez ce que vous avez récolté</p>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_120px_auto] gap-3 items-end">
            <div>
              <label className="text-sm font-medium text-gta-text-dim mb-1.5 block">
                Objet récolté
              </label>
              <div className="relative">
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full appearance-none gta-input pr-10 py-2.5 text-sm"
                >
                  {items.length === 0 && <option value="">Aucun objet récoltable</option>}
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.category.name})
                    </option>
                  ))}
                </select>
                {selectedItemId && (() => {
                  const selected = items.find((i) => i.id === selectedItemId);
                  return selected?.imageUrl ? (
                    <img
                      src={selected.imageUrl}
                      alt=""
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded object-contain bg-gta-bg pointer-events-none"
                    />
                  ) : null;
                })()}
              </div>
            </div>
            <Input
              label="Quantité"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <Button type="submit" disabled={submitting || !selectedItemId || items.length === 0}>
              {submitting ? <Spinner size="sm" /> : "Déclarer"}
            </Button>
          </div>
          {items.length === 0 && (
            <p className="text-xs text-gta-text-dim">Aucun objet n'est configuré comme récoltable.</p>
          )}
        </form>

        {/* Liste des déclarations */}
        <div className="gta-card">
          <h3 className="font-medium mb-4">Historique de mes déclarations</h3>
          {harvests.length === 0 ? (
            <div className="text-center py-8 text-gta-text-dim">
              <Sprout className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Aucune déclaration pour le moment</p>
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
                      <p className="text-sm font-medium truncate">{h.itemType.name}</p>
                      <p className="text-xs text-gta-text-dim">
                        x{h.quantity} — {new Date(h.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    {h.status === "APPROVED" && h.payoutAmount != null && (
                      <span className="text-sm font-semibold text-gta-success">
                        +{h.payoutAmount.toLocaleString("fr-FR")}$
                      </span>
                    )}
                    <Badge color={config.color}>
                      <StatusIcon className="h-3 w-3 mr-1 inline" />
                      {config.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

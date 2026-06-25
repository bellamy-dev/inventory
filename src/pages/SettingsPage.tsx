import { useState, useEffect, useCallback } from "react";
import { Header } from "../components/layout/Header";
import { Spinner } from "../components/ui/Spinner";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Toggle } from "../components/ui/Toggle";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { webhookApi } from "../api/webhook.api";
import { categoriesApi } from "../api/categories.api";
import { raritiesApi } from "../api/rarities.api";
import { WebhookConfig, Category, Rarity } from "../types";
import toast from "react-hot-toast";
import { Send, Webhook, Tags, Palette, Plus, Trash2 } from "lucide-react";

export function SettingsPage() {
  const [config, setConfig] = useState<WebhookConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [url, setUrl] = useState("");
  const [saleEvents, setSaleEvents] = useState(true);
  const [itemEvents, setItemEvents] = useState(true);
  const [harvestEvents, setHarvestEvents] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);
  const [deleteCatTarget, setDeleteCatTarget] = useState<Category | null>(null);
  const [deletingCat, setDeletingCat] = useState(false);

  const [rarities, setRarities] = useState<Rarity[]>([]);
  const [newRarName, setNewRarName] = useState("");
  const [newRarColor, setNewRarColor] = useState("#9ca3af");
  const [creatingRar, setCreatingRar] = useState(false);
  const [deleteRarTarget, setDeleteRarTarget] = useState<Rarity | null>(null);
  const [deletingRar, setDeletingRar] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [c, cats, rars] = await Promise.all([
        webhookApi.getConfig(),
        categoriesApi.getAll(),
        raritiesApi.getAll(),
      ]);
      setConfig(c);
      setUrl(c.discordUrl || "");
      setSaleEvents(c.saleEvents);
      setItemEvents(c.itemEvents);
      setHarvestEvents(c.harvestEvents);
      setCategories(cats);
      setRarities(rars);
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSaveWebhook = async () => {
    setSaving(true);
    try {
      const updated = await webhookApi.updateConfig({
        discordUrl: url || undefined,
        saleEvents,
        itemEvents,
        harvestEvents,
      });
      setConfig(updated);
      toast.success("Paramètres enregistrés !");
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await webhookApi.test();
      toast.success("Message de test envoyé !");
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || "Échec de l'envoi");
    } finally {
      setTesting(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCreatingCat(true);
    try {
      await categoriesApi.create(newCatName.trim());
      toast.success("Catégorie créée !");
      setNewCatName("");
      loadAll();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || "Erreur");
    } finally {
      setCreatingCat(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCatTarget) return;
    setDeletingCat(true);
    try {
      await categoriesApi.delete(deleteCatTarget.id);
      toast.success("Catégorie supprimée !");
      setDeleteCatTarget(null);
      loadAll();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || "Erreur");
    } finally {
      setDeletingCat(false);
    }
  };

  const handleCreateRarity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRarName.trim()) return;
    setCreatingRar(true);
    try {
      await raritiesApi.create({ name: newRarName.trim(), color: newRarColor });
      toast.success("Rareté créée !");
      setNewRarName("");
      setNewRarColor("#9ca3af");
      loadAll();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || "Erreur");
    } finally {
      setCreatingRar(false);
    }
  };

  const handleDeleteRarity = async () => {
    if (!deleteRarTarget) return;
    setDeletingRar(true);
    try {
      await raritiesApi.delete(deleteRarTarget.id);
      toast.success("Rareté supprimée !");
      setDeleteRarTarget(null);
      loadAll();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || "Erreur");
    } finally {
      setDeletingRar(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  return (
    <>
      <Header title="Paramètres" subtitle="Configuration générale" />

      <div className="max-w-2xl space-y-6">
        {/* Discord Webhook */}
        <div className="gta-card space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5865F2]/15">
              <Webhook className="h-5 w-5 text-[#5865F2]" />
            </div>
            <div>
              <h3 className="font-medium">Webhook Discord</h3>
              <p className="text-xs text-gta-text-dim">
                Notifications automatiques pour les ventes et objets
              </p>
            </div>
          </div>

          <Input
            label="URL du webhook Discord"
            placeholder="https://discord.com/api/webhooks/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <div className="space-y-3">
            <p className="text-sm font-medium text-gta-text-dim">Événements</p>
            <Toggle
              checked={saleEvents}
              onChange={setSaleEvents}
              label="Notifications de vente"
            />
            <Toggle
              checked={itemEvents}
              onChange={setItemEvents}
              label="Notifications de création/suppression d'objet"
            />
            <Toggle
              checked={harvestEvents}
              onChange={setHarvestEvents}
              label="Notifications de récolte validée"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSaveWebhook} disabled={saving}>
              {saving ? "..." : "Enregistrer"}
            </Button>
            <Button
              variant="ghost"
              onClick={handleTest}
              disabled={testing || !url}
            >
              <Send className="h-4 w-4 mr-2 inline" />
              {testing ? "Envoi..." : "Tester le webhook"}
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div className="gta-card space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gta-accent/15">
              <Tags className="h-5 w-5 text-gta-accent" />
            </div>
            <div>
              <h3 className="font-medium">Catégories</h3>
              <p className="text-xs text-gta-text-dim">
                Gérer les catégories d'objets (Armes, Drogues, etc.)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gta-bg/50"
              >
                <span className="text-sm">{cat.name}</span>
                <div className="flex items-center gap-2">
                  {cat._count && (
                    <span className="text-xs text-gta-text-dim">
                      {cat._count.itemTypes} objet(s)
                    </span>
                  )}
                  <button
                    className="text-gta-danger hover:text-red-400"
                    onClick={() => setDeleteCatTarget(cat)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleCreateCategory} className="flex gap-2 pt-2 border-t border-gta-border">
            <Input
              placeholder="Nouvelle catégorie..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={creatingCat || !newCatName.trim()}>
              <Plus className="h-4 w-4 mr-1 inline" />
              Ajouter
            </Button>
          </form>
        </div>

        {/* Rarities */}
        <div className="gta-card space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/15">
              <Palette className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium">Raretés</h3>
              <p className="text-xs text-gta-text-dim">
                Gérer les niveaux de rareté des objets
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {rarities.map((rar) => (
              <div
                key={rar.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gta-bg/50"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded-full shrink-0"
                    style={{ backgroundColor: rar.color }}
                  />
                  <span className="text-sm">{rar.name}</span>
                </div>
                <button
                  className="text-gta-danger hover:text-red-400"
                  onClick={() => setDeleteRarTarget(rar)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleCreateRarity} className="flex gap-2 items-end pt-2 border-t border-gta-border">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gta-text-dim">Couleur</label>
              <input
                type="color"
                value={newRarColor}
                onChange={(e) => setNewRarColor(e.target.value)}
                className="h-10 w-10 rounded cursor-pointer border-0"
              />
            </div>
            <Input
              placeholder="Nouvelle rareté..."
              value={newRarName}
              onChange={(e) => setNewRarName(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={creatingRar || !newRarName.trim()}>
              <Plus className="h-4 w-4 mr-1 inline" />
              Ajouter
            </Button>
          </form>
        </div>

        {/* Preview */}
        <div className="gta-card">
          <h3 className="font-medium mb-3">Aperçu de l'embed</h3>
          <div className="rounded-lg border border-[#5865F2]/30 bg-[#2f3136] p-4 max-w-sm">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-[#5865F2] flex items-center justify-center text-white text-sm font-bold shrink-0">
                DC
              </div>
              <div>
                <p className="text-sm font-medium text-white">Stockage RP</p>
                <p className="text-xs text-[#b9bbbe]">Aujourd'hui à {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
            <div className="mt-3 ml-[52px] rounded border-l-4 border-[#3b82f6] bg-[#2f3136] p-3">
              <p className="text-sm font-semibold text-white mb-1">Vente effectuée</p>
              <div className="space-y-0.5">
                <p className="text-xs text-[#b9bbbe]"><strong className="text-white">Objet:</strong> Pistolet</p>
                <p className="text-xs text-[#b9bbbe]"><strong className="text-white">Quantité:</strong> x1</p>
                <p className="text-xs text-[#b9bbbe]"><strong className="text-white">Prix total:</strong> 5000$</p>
                <p className="text-xs text-[#b9bbbe]"><strong className="text-white">Vendeur:</strong> Admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteCatTarget}
        onClose={() => setDeleteCatTarget(null)}
        onConfirm={handleDeleteCategory}
        title="Supprimer la catégorie"
        message={`Supprimer "${deleteCatTarget?.name}" ? Les objets dans cette catégorie ne seront pas supprimés.`}
        confirmLabel="Supprimer"
        loading={deletingCat}
      />

      <ConfirmDialog
        isOpen={!!deleteRarTarget}
        onClose={() => setDeleteRarTarget(null)}
        onConfirm={handleDeleteRarity}
        title="Supprimer la rareté"
        message={`Supprimer "${deleteRarTarget?.name}" ?`}
        confirmLabel="Supprimer"
        loading={deletingRar}
      />
    </>
  );
}

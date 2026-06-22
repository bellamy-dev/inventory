import { useState, useEffect, useCallback } from "react";
import { Header } from "../components/layout/Header";
import { Spinner } from "../components/ui/Spinner";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Toggle } from "../components/ui/Toggle";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { usePermissions } from "../hooks/usePermissions";
import { stockApi } from "../api/stock.api";
import { salesApi } from "../api/sales.api";
import { itemTypesApi } from "../api/itemTypes.api";
import { categoriesApi } from "../api/categories.api";
import { raritiesApi } from "../api/rarities.api";
import { StockItem, Category, Rarity } from "../types";
import toast from "react-hot-toast";
import {
  Search,
  AlertTriangle,
  Package,
  ShoppingCart,
  Trash2,
  Pencil,
  Upload,
} from "lucide-react";

export function InventoryPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: StockItem;
  } | null>(null);
  const [rarities, setRarities] = useState<Rarity[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<StockItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Sell modal
  const [sellModal, setSellModal] = useState<{
    item: StockItem;
    quantity: number;
    buyerName: string;
  } | null>(null);

  // Add stock modal
  const [addStockModal, setAddStockModal] = useState<{
    item: StockItem;
    amount: number;
  } | null>(null);

  // Remove stock modal
  const [removeStockModal, setRemoveStockModal] = useState<{
    item: StockItem;
    amount: number;
    reason: string;
  } | null>(null);

  // Edit item modal
  const [editModal, setEditModal] = useState<{
    item: StockItem;
    name: string;
    sellPrice: number;
    buyPrice: number;
    weight: number;
    categoryId: string;
    rarityId: string;
    unlimitedStock: boolean;
    maxStock: string;
    lowStockAlert: string;
    imageFile: File | null;
    imagePreview: string | null;
  } | null>(null);

  const { canAddStock, canSellStock, canEditItem, canDeleteItem } = usePermissions();

  const loadData = useCallback(async () => {
    try {
      const [items, cats, rars] = await Promise.all([
        stockApi.getAll(),
        categoriesApi.getAll(),
        raritiesApi.getAll(),
      ]);
      setStockItems(items);
      setCategories(cats);
      setRarities(rars);
    } catch {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredItems = stockItems.filter((si) => {
    const matchSearch = si.itemType.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      selectedCategory === "all" || si.itemType.categoryId === selectedCategory;
    return matchSearch && matchCategory;
  });

  const totalWeight = stockItems.reduce(
    (sum, si) => sum + si.quantity * si.itemType.weight,
    0
  );
  const maxWeight = 1000;
  const fillPercent = Math.min((totalWeight / maxWeight) * 100, 100);
  const weightColor =
    fillPercent < 50 ? "#22c55e" : fillPercent < 80 ? "#f59e0b" : "#ef4444";

  const handleContextMenu = (e: React.MouseEvent, item: StockItem) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSell = async () => {
    if (!sellModal) return;
    try {
      await salesApi.create({
        itemTypeId: sellModal.item.itemTypeId,
        quantity: sellModal.quantity,
        buyerName: sellModal.buyerName || undefined,
      });
      toast.success("Vente effectuée !");
      setSellModal(null);
      loadData();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || "Erreur lors de la vente");
    }
  };

  const handleSellSelection = async () => {
    if (selectedItems.size === 0) return;
    const items = stockItems.filter((si) => selectedItems.has(si.id));
    let totalSold = 0;
    for (const item of items) {
      try {
        await salesApi.create({
          itemTypeId: item.itemTypeId,
          quantity: item.quantity,
        });
        totalSold++;
      } catch {
        // skip errors
      }
    }
    toast.success(`${totalSold} vente(s) effectuée(s) !`);
    setSelectedItems(new Set());
    loadData();
  };

  const handleAddStock = async () => {
    if (!addStockModal) return;
    try {
      await stockApi.add(
        addStockModal.item.itemTypeId,
        addStockModal.amount
      );
      toast.success("Stock ajouté !");
      setAddStockModal(null);
      loadData();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || "Erreur");
    }
  };

  const handleRemoveStock = async () => {
    if (!removeStockModal) return;
    try {
      await stockApi.remove(
        removeStockModal.item.itemTypeId,
        removeStockModal.amount,
        removeStockModal.reason || undefined
      );
      toast.success("Stock retiré !");
      setRemoveStockModal(null);
      loadData();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || "Erreur");
    }
  };

  const handleUpdateItem = async () => {
    if (!editModal) return;
    try {
      const fd = new FormData();
      fd.append("name", editModal.name);
      fd.append("sellPrice", String(editModal.sellPrice));
      fd.append("buyPrice", String(editModal.buyPrice));
      fd.append("weight", String(editModal.weight));
      fd.append("categoryId", editModal.categoryId);
      fd.append("rarityId", editModal.rarityId);
      fd.append("unlimitedStock", String(editModal.unlimitedStock));
      if (editModal.maxStock) fd.append("maxStock", editModal.maxStock);
      if (editModal.lowStockAlert) fd.append("lowStockAlert", editModal.lowStockAlert);
      if (editModal.imageFile) fd.append("image", editModal.imageFile);
      await itemTypesApi.update(editModal.item.itemTypeId, fd);
      toast.success("Objet modifié !");
      setEditModal(null);
      loadData();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || "Erreur");
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await itemTypesApi.delete(deleteTarget.itemTypeId);
      toast.success("Objet supprimé !");
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Header
        title="Inventaire"
        subtitle={`${stockItems.length} type(s) d'objet(s) en stock`}
        actions={
          selectedItems.size > 0 && canSellStock ? (
            <Button onClick={handleSellSelection}>
              <ShoppingCart className="h-4 w-4 mr-2 inline" />
              Vendre la sélection ({selectedItems.size})
            </Button>
          ) : undefined
        }
      />

      {/* Capacity bar */}
      <div className="gta-card mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gta-text-dim flex items-center gap-2">
            <Package className="h-4 w-4" /> Capacité
          </span>
          <span className="text-sm font-medium">
            {totalWeight.toFixed(1)} / {maxWeight} kg
          </span>
        </div>
        <div className="h-2 rounded-full bg-gta-border overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${fillPercent}%`, backgroundColor: weightColor }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gta-text-dim" />
          <input
            type="text"
            className="gta-input pl-10"
            placeholder="Rechercher un objet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              selectedCategory === "all"
                ? "bg-gta-accent text-white"
                : "bg-gta-surface text-gta-text-dim hover:bg-gta-surface-hover"
            }`}
            onClick={() => setSelectedCategory("all")}
          >
            Tous
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedCategory === cat.id
                  ? "bg-gta-accent text-white"
                  : "bg-gta-surface text-gta-text-dim hover:bg-gta-surface-hover"
              }`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filteredItems.length === 0 ? (
        <div className="gta-card text-center py-12 text-gta-text-dim">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Aucun objet dans l'inventaire</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {filteredItems.map((si) => {
            const isLowStock =
              si.itemType.lowStockAlert &&
              si.quantity <= si.itemType.lowStockAlert &&
              !si.itemType.unlimitedStock;
            const isSelected = selectedItems.has(si.id);
            const hasStock = si.quantity > 0;

            return (
              <div
                key={si.id}
                className={`gta-cell relative group ${
                  isSelected ? "gta-cell-selected" : ""
                } ${!hasStock ? "opacity-50" : ""}`}
                style={{ borderColor: si.itemType.rarity.color }}
                onContextMenu={(e) => handleContextMenu(e, si)}
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) toggleSelect(si.id, e);
                }}
              >
                {/* Quantity badge */}
                <span className="absolute top-1 left-1.5 text-xs font-bold bg-black/50 rounded px-1">
                  x{si.quantity}
                </span>

                {/* Low stock warning */}
                {isLowStock && (
                  <span className="absolute top-1 right-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-gta-warning" />
                  </span>
                )}

                {/* Selection checkbox */}
                {canSellStock && hasStock && (
                  <button
                    className="absolute bottom-1 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => toggleSelect(si.id, e)}
                  >
                    <div
                      className={`h-4 w-4 rounded border flex items-center justify-center text-[10px] ${
                        isSelected
                          ? "bg-gta-accent border-gta-accent text-white"
                          : "border-gta-border bg-gta-bg"
                      }`}
                    >
                      {isSelected && "✓"}
                    </div>
                  </button>
                )}

                {/* Image */}
                <div className="flex items-center justify-center h-12 w-12 mb-1">
                  {si.itemType.imageUrl ? (
                    <img
                      src={si.itemType.imageUrl}
                      alt={si.itemType.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Package className="h-8 w-8 text-gta-text-dim" />
                  )}
                </div>

                {/* Name */}
                <p className="text-xs text-center font-medium truncate w-full">
                  {si.itemType.name}
                </p>

                {/* Weight */}
                {si.itemType.weight > 0 && (
                  <p className="text-[10px] text-gta-text-dim">
                    {si.itemType.weight}kg
                  </p>
                )}

                {/* Low stock badge */}
                {isLowStock && (
                  <span className="text-[10px] text-gta-warning font-medium">
                    Stock faible
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (() => {
        const menuW = 192;
        const menuH = 200;
        const x = Math.min(contextMenu.x, window.innerWidth - menuW - 8);
        const y = Math.min(contextMenu.y, window.innerHeight - menuH - 8);
        return (
          <>
            <div
              className="fixed inset-0 z-50"
              onClick={() => setContextMenu(null)}
            />
            <div
              className="fixed z-50 w-48 rounded-lg border border-gta-border bg-gta-surface shadow-xl py-1"
              style={{ left: Math.max(8, x), top: Math.max(8, y) }}
            >
            {canSellStock && contextMenu.item.quantity > 0 && (
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gta-surface-hover"
                onClick={() => {
                  setSellModal({
                    item: contextMenu.item,
                    quantity: 1,
                    buyerName: "",
                  });
                  setContextMenu(null);
                }}
              >
                <ShoppingCart className="h-4 w-4 text-gta-accent" />
                Vendre
              </button>
            )}
            {canAddStock && (
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gta-surface-hover"
                onClick={() => {
                  setAddStockModal({ item: contextMenu.item, amount: 1 });
                  setContextMenu(null);
                }}
              >
                <Package className="h-4 w-4 text-gta-success" />
                Ajouter du stock
              </button>
            )}
            {canAddStock && (
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gta-surface-hover"
                onClick={() => {
                  setRemoveStockModal({ item: contextMenu.item, amount: 1, reason: "" });
                  setContextMenu(null);
                }}
              >
                <Package className="h-4 w-4 text-gta-danger" />
                Retirer du stock
              </button>
            )}
            {canEditItem && (
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gta-surface-hover"
                onClick={() => {
                  const it = contextMenu.item.itemType;
                  setEditModal({
                    item: contextMenu.item,
                    name: it.name,
                    sellPrice: it.sellPrice,
                    buyPrice: it.buyPrice,
                    weight: it.weight,
                    categoryId: it.category.id,
                    rarityId: it.rarity.id,
                    unlimitedStock: it.unlimitedStock,
                    maxStock: it.maxStock != null ? String(it.maxStock) : "",
                    lowStockAlert: it.lowStockAlert != null ? String(it.lowStockAlert) : "",
                    imageFile: null,
                    imagePreview: it.imageUrl,
                  });
                  setContextMenu(null);
                }}
              >
                <Pencil className="h-4 w-4 text-gta-warning" />
                Modifier
              </button>
            )}
            {canDeleteItem && (
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gta-surface-hover text-gta-danger"
                onClick={() => {
                  setDeleteTarget(contextMenu.item);
                  setContextMenu(null);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </button>
            )}
          </div>
          </>
        );
      })()}

      {/* Sell Modal */}
      <Modal
        isOpen={!!sellModal}
        onClose={() => setSellModal(null)}
        title="Vendre un objet"
      >
        {sellModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gta-bg">
              {sellModal.item.itemType.imageUrl ? (
                <img
                  src={sellModal.item.itemType.imageUrl}
                  alt={sellModal.item.itemType.name}
                  className="h-10 w-10 object-contain"
                />
              ) : (
                <Package className="h-10 w-10 text-gta-text-dim" />
              )}
              <div>
                <p className="font-medium">{sellModal.item.itemType.name}</p>
                <p className="text-xs text-gta-text-dim">
                  {sellModal.item.quantity} en stock — {sellModal.item.itemType.sellPrice}$/unité
                </p>
              </div>
            </div>
            <Input
              label="Quantité"
              type="number"
              min={1}
              max={sellModal.item.quantity}
              value={sellModal.quantity}
              onChange={(e) =>
                setSellModal({ ...sellModal, quantity: parseInt(e.target.value) || 0 })
              }
            />
            <Input
              label="Nom de l'acheteur (optionnel)"
              placeholder="Nom du client"
              value={sellModal.buyerName}
              onChange={(e) =>
                setSellModal({ ...sellModal, buyerName: e.target.value })
              }
            />
            <div className="p-3 rounded-lg bg-gta-bg">
              <p className="text-sm text-gta-text-dim">Total</p>
              <p className="text-xl font-bold text-gta-success">
                {sellModal.quantity * sellModal.item.itemType.sellPrice}$
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setSellModal(null)}>
                Annuler
              </Button>
              <Button
                onClick={handleSell}
                disabled={
                  sellModal.quantity <= 0 ||
                  sellModal.quantity > sellModal.item.quantity
                }
              >
                Confirmer la vente
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Stock Modal */}
      <Modal
        isOpen={!!addStockModal}
        onClose={() => setAddStockModal(null)}
        title="Ajouter du stock"
      >
        {addStockModal && (
          <div className="space-y-4">
            <p className="text-sm text-gta-text-dim">
              Ajouter du stock pour{" "}
              <strong>{addStockModal.item.itemType.name}</strong>
            </p>
            <Input
              label="Quantité à ajouter"
              type="number"
              min={1}
              value={addStockModal.amount}
              onChange={(e) =>
                setAddStockModal({
                  ...addStockModal,
                  amount: parseInt(e.target.value) || 0,
                })
              }
            />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setAddStockModal(null)}>
                Annuler
              </Button>
              <Button onClick={handleAddStock} disabled={addStockModal.amount <= 0}>
                Ajouter
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Remove Stock Modal */}
      <Modal
        isOpen={!!removeStockModal}
        onClose={() => setRemoveStockModal(null)}
        title="Retirer du stock"
      >
        {removeStockModal && (
          <div className="space-y-4">
            <p className="text-sm text-gta-text-dim">
              Retirer du stock pour{" "}
              <strong>{removeStockModal.item.itemType.name}</strong>
              {" — "}Actuel: <strong>{removeStockModal.item.quantity}</strong>
            </p>
            <Input
              label="Quantité à retirer"
              type="number"
              min={1}
              max={removeStockModal.item.quantity}
              value={removeStockModal.amount}
              onChange={(e) =>
                setRemoveStockModal({
                  ...removeStockModal,
                  amount: parseInt(e.target.value) || 0,
                })
              }
            />
            <Input
              label="Raison (optionnel)"
              placeholder="Ex: Taxe, utilisation, perte..."
              value={removeStockModal.reason}
              onChange={(e) =>
                setRemoveStockModal({
                  ...removeStockModal,
                  reason: e.target.value,
                })
              }
            />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setRemoveStockModal(null)}>
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={handleRemoveStock}
                disabled={
                  removeStockModal.amount <= 0 ||
                  removeStockModal.amount > removeStockModal.item.quantity
                }
              >
                Retirer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editModal}
        onClose={() => setEditModal(null)}
        title="Modifier l'objet"
      >
        {editModal && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gta-text-dim mb-2 block">
                Image de l'objet
              </label>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-lg border-2 border-dashed border-gta-border flex items-center justify-center overflow-hidden bg-gta-bg shrink-0">
                  {editModal.imagePreview ? (
                    <img src={editModal.imagePreview} alt="Preview" className="h-full w-full object-contain" />
                  ) : (
                    <Package className="h-8 w-8 text-gta-text-dim" />
                  )}
                </div>
                <label className="gta-btn-primary cursor-pointer inline-flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Changer l'image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () =>
                          setEditModal({ ...editModal, imageFile: file, imagePreview: reader.result as string });
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <Input
              label="Nom de l'objet"
              value={editModal.name}
              onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Catégorie"
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                value={editModal.categoryId}
                onChange={(e) => setEditModal({ ...editModal, categoryId: e.target.value })}
              />
              <Select
                label="Rareté"
                options={rarities.map((r) => ({ value: r.id, label: r.name }))}
                value={editModal.rarityId}
                onChange={(e) => setEditModal({ ...editModal, rarityId: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Poids (kg)"
                type="number"
                step="0.1"
                min="0"
                value={editModal.weight}
                onChange={(e) => setEditModal({ ...editModal, weight: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="Prix d'achat ($)"
                type="number"
                min="0"
                value={editModal.buyPrice}
                onChange={(e) => setEditModal({ ...editModal, buyPrice: parseInt(e.target.value) || 0 })}
              />
              <Input
                label="Prix de vente ($)"
                type="number"
                min="0"
                value={editModal.sellPrice}
                onChange={(e) => setEditModal({ ...editModal, sellPrice: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-3">
              <Toggle
                checked={editModal.unlimitedStock}
                onChange={(v) => setEditModal({ ...editModal, unlimitedStock: v })}
                label="Stock illimité"
              />
              {!editModal.unlimitedStock && (
                <Input
                  label="Stock maximum"
                  type="number"
                  min="0"
                  placeholder="Ex: 100"
                  value={editModal.maxStock}
                  onChange={(e) => setEditModal({ ...editModal, maxStock: e.target.value })}
                />
              )}
              <Input
                label="Seuil d'alerte stock faible"
                type="number"
                min="0"
                placeholder="Ex: 5"
                value={editModal.lowStockAlert}
                onChange={(e) => setEditModal({ ...editModal, lowStockAlert: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setEditModal(null)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateItem}>Enregistrer</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteItem}
        title="Supprimer l'objet"
        message={`Supprimer "${deleteTarget?.itemType?.name}" ? Cette action est irréversible et supprimera aussi les ventes associées.`}
        confirmLabel="Supprimer"
        loading={deleting}
      />
    </>
  );
}

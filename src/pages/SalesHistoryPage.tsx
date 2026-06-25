import { useState, useEffect, useCallback } from "react";
import { Header } from "../components/layout/Header";
import { Spinner } from "../components/ui/Spinner";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { salesApi } from "../api/sales.api";
import { usersApi } from "../api/users.api";
import { itemTypesApi } from "../api/itemTypes.api";
import { usePermissions } from "../hooks/usePermissions";
import { Sale, SaleStats, UserListItem, ItemType } from "../types";
import toast from "react-hot-toast";
import { Download, TrendingUp, TrendingDown, DollarSign, BarChart3, Trash2 } from "lucide-react";

export function SalesHistoryPage() {
  const { canManageUsers } = usePermissions();
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<SaleStats | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [items, setItems] = useState<ItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [filterSeller, setFilterSeller] = useState("");
  const [filterItem, setFilterItem] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [salesResult, statsResult, itemsList] = await Promise.all([
        salesApi.getAll({
          startDate: filterDateStart || undefined,
          endDate: filterDateEnd || undefined,
          sellerId: filterSeller || undefined,
          itemTypeId: filterItem || undefined,
          page,
          limit: 50,
        }),
        salesApi.getStats({
          startDate: filterDateStart || undefined,
          endDate: filterDateEnd || undefined,
        }),
        itemTypesApi.getAll(),
      ]);
      setSales(salesResult.data);
      setTotalPages(salesResult.totalPages);
      setStats(statsResult);
      setItems(itemsList);

      if (canManageUsers) {
        const usersList = await usersApi.getAll();
        setUsers(usersList);
      }
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [page, filterDateStart, filterDateEnd, filterSeller, filterItem, canManageUsers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const exportCSV = () => {
    const headers = ["Date", "Objet", "Quantité", "Prix unitaire", "Total", "Vendeur", "Acheteur"];
    const rows = sales.map((s) => [
      new Date(s.createdAt).toLocaleString("fr-FR"),
      s.itemType.name,
      s.quantity,
      s.unitPrice,
      s.totalPrice,
      s.seller.username,
      s.buyerName || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ventes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exporté !");
  };

  const handleDeleteSale = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await salesApi.delete(deleteTarget.id);
      toast.success("Vente supprimée, stock restauré !");
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Header
        title="Historique des ventes"
        subtitle={`${stats?.totalSales || 0} vente(s) enregistrée(s)`}
        actions={
          <Button variant="ghost" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2 inline" />
            Exporter CSV
          </Button>
        }
      />

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="gta-card flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gta-accent/15">
              <BarChart3 className="h-6 w-6 text-gta-accent" />
            </div>
            <div>
              <p className="text-xs text-gta-text-dim">Total ventes</p>
              <p className="text-xl font-bold">{stats.totalSales}</p>
            </div>
          </div>
          <div className="gta-card flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gta-success/15">
              <DollarSign className="h-6 w-6 text-gta-success" />
            </div>
            <div>
              <p className="text-xs text-gta-text-dim">Revenu total</p>
              <p className="text-xl font-bold text-gta-success">{stats.totalRevenue}$</p>
            </div>
          </div>
          <div className="gta-card flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gta-danger/15">
              <TrendingDown className="h-6 w-6 text-gta-danger" />
            </div>
            <div>
              <p className="text-xs text-gta-text-dim">Coût total</p>
              <p className="text-xl font-bold text-gta-danger">{stats.totalCost}$</p>
            </div>
          </div>
          <div className="gta-card flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gta-warning/15">
              <TrendingUp className="h-6 w-6 text-gta-warning" />
            </div>
            <div>
              <p className="text-xs text-gta-text-dim">Marge totale</p>
              <p className={`text-xl font-bold ${stats.totalMargin >= 0 ? "text-gta-success" : "text-gta-danger"}`}>
                {stats.totalMargin}$
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="gta-card mb-6">
        <div className={`grid gap-4 ${canManageUsers ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3"}`}>
          <Input
            label="Date début"
            type="date"
            value={filterDateStart}
            onChange={(e) => { setFilterDateStart(e.target.value); setPage(1); }}
          />
          <Input
            label="Date fin"
            type="date"
            value={filterDateEnd}
            onChange={(e) => { setFilterDateEnd(e.target.value); setPage(1); }}
          />
          {canManageUsers && (
            <Select
              label="Vendeur"
              options={[
                { value: "", label: "Tous" },
                ...users.map((u) => ({ value: u.id, label: u.username })),
              ]}
              value={filterSeller}
              onChange={(e) => { setFilterSeller(e.target.value); setPage(1); }}
            />
          )}
          <Select
            label="Objet"
            options={[
              { value: "", label: "Tous" },
              ...items.map((i) => ({ value: i.id, label: i.name })),
            ]}
            value={filterItem}
            onChange={(e) => { setFilterItem(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : sales.length === 0 ? (
        <div className="gta-card text-center py-12 text-gta-text-dim">Aucune vente enregistrée</div>
      ) : (
        <div className="gta-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gta-border">
                <th className="text-left py-3 px-2 text-gta-text-dim font-medium">Date</th>
                <th className="text-left py-3 px-2 text-gta-text-dim font-medium">Objet</th>
                <th className="text-center py-3 px-2 text-gta-text-dim font-medium">Qté</th>
                <th className="text-right py-3 px-2 text-gta-text-dim font-medium">Prix unit.</th>
                <th className="text-right py-3 px-2 text-gta-text-dim font-medium">Total</th>
                <th className="text-right py-3 px-2 text-gta-text-dim font-medium">Marge</th>
                <th className="text-left py-3 px-2 text-gta-text-dim font-medium">Vendeur</th>
                <th className="text-left py-3 px-2 text-gta-text-dim font-medium">Acheteur</th>
                <th className="text-right py-3 px-2 text-gta-text-dim font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => {
                const margin = (sale.unitPrice - sale.itemType.buyPrice) * sale.quantity;
                return (
                  <tr key={sale.id} className="border-b border-gta-border/50 hover:bg-gta-surface-hover">
                    <td className="py-3 px-2">
                      {new Date(sale.createdAt).toLocaleString("fr-FR")}
                    </td>
                    <td className="py-3 px-2 font-medium">{sale.itemType.name}</td>
                    <td className="py-3 px-2 text-center">{sale.quantity}</td>
                    <td className="py-3 px-2 text-right">{sale.unitPrice}$</td>
                    <td className="py-3 px-2 text-right font-bold text-gta-success">
                      {sale.totalPrice}$
                    </td>
                    <td className={`py-3 px-2 text-right font-medium ${margin >= 0 ? "text-gta-success" : "text-gta-danger"}`}>
                      {margin}$
                    </td>
                    <td className="py-3 px-2">{sale.seller.username}</td>
                    <td className="py-3 px-2 text-gta-text-dim">{sale.buyerName || "—"}</td>
                    <td className="py-3 px-2 text-right">
                      <button
                        className="text-gta-danger hover:text-red-400 transition-colors"
                        onClick={() => setDeleteTarget(sale)}
                        title="Supprimer cette vente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="ghost"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Précédent
              </Button>
              <span className="flex items-center px-4 text-sm text-gta-text-dim">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="ghost"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Suivant
              </Button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSale}
        title="Supprimer la vente"
        message={`Supprimer cette vente de "${deleteTarget?.itemType?.name}" ? Le stock sera restauré.`}
        confirmLabel="Supprimer"
        loading={deleting}
      />
    </>
  );
}

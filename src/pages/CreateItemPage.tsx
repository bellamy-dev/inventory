import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Toggle } from "../components/ui/Toggle";
import { Spinner } from "../components/ui/Spinner";
import { categoriesApi } from "../api/categories.api";
import { raritiesApi } from "../api/rarities.api";
import { itemTypesApi } from "../api/itemTypes.api";
import { Category, Rarity } from "../types";
import { usePermissions } from "../hooks/usePermissions";
import { parseNumericInput } from "../lib/utils";
import toast from "react-hot-toast";
import { Upload, Package } from "lucide-react";

export function CreateItemPage() {
  const navigate = useNavigate();
  const { canManageRoles } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rarities, setRarities] = useState<Rarity[]>([]);

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [rarityId, setRarityId] = useState("");
  const [weight, setWeight] = useState("0");
  const [buyPrice, setBuyPrice] = useState("0");
  const [sellPrice, setSellPrice] = useState("0");
  const [unlimitedStock, setUnlimitedStock] = useState(false);
  const [maxStock, setMaxStock] = useState("");
  const [lowStockAlert, setLowStockAlert] = useState("");
  const [harvestCommissionPercent, setHarvestCommissionPercent] = useState("");
  const [harvestable, setHarvestable] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([categoriesApi.getAll(), raritiesApi.getAll()]).then(
      ([cats, rars]) => {
        setCategories(cats);
        setRarities(rars);
        if (cats.length > 0) setCategoryId(cats[0].id);
        if (rars.length > 0) setRarityId(rars[0].id);
      }
    );
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("L'image est trop volumineuse (max 10 Mo)");
        e.target.value = "";
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId || !rarityId) {
      toast.error("Remplissez tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("categoryId", categoryId);
      fd.append("rarityId", rarityId);
      fd.append("weight", weight);
      fd.append("buyPrice", buyPrice);
      fd.append("sellPrice", sellPrice);
      fd.append("unlimitedStock", String(unlimitedStock));
      if (maxStock) fd.append("maxStock", maxStock);
      if (lowStockAlert) fd.append("lowStockAlert", lowStockAlert);
      if (harvestCommissionPercent) fd.append("harvestCommissionPercent", harvestCommissionPercent);
      fd.append("harvestable", String(harvestable));
      if (imageFile) fd.append("image", imageFile);

      await itemTypesApi.create(fd);
      toast.success("Objet créé avec succès !");
      navigate("/inventaire");
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Créer un objet" subtitle="Définir un nouveau type d'objet" />

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="gta-card space-y-6">
          {/* Image */}
          <div>
            <label className="text-sm font-medium text-gta-text-dim mb-2 block">
              Image de l'objet
            </label>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-lg border-2 border-dashed border-gta-border flex items-center justify-center overflow-hidden bg-gta-bg">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-contain" />
                ) : (
                  <Package className="h-8 w-8 text-gta-text-dim" />
                )}
              </div>
              <label className="gta-btn-primary cursor-pointer inline-flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Choisir une image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            </div>
          </div>

          {/* Name */}
          <Input
            label="Nom de l'objet *"
            placeholder="Ex: Pistolet AK-47"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {/* Category & Rarity */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Catégorie *"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            />
            <Select
              label="Rareté *"
              options={rarities.map((r) => ({ value: r.id, label: r.name }))}
              value={rarityId}
              onChange={(e) => setRarityId(e.target.value)}
            />
          </div>

          {/* Weight & Prices */}
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Poids (kg)"
              type="text"
              inputMode="decimal"
              step="0.1"
              min="0"
              placeholder="Ex: 0,25"
              value={weight}
              onChange={(e) => setWeight(parseNumericInput(e.target.value))}
            />
            <Input
              label="Prix d'achat ($)"
              type="text"
              inputMode="decimal"
              min="0"
              placeholder="Ex: 10,50"
              value={buyPrice}
              onChange={(e) => setBuyPrice(parseNumericInput(e.target.value))}
            />
            <Input
              label="Prix de vente ($)"
              type="text"
              inputMode="decimal"
              min="0"
              placeholder="Ex: 15,00"
              value={sellPrice}
              onChange={(e) => setSellPrice(parseNumericInput(e.target.value))}
            />
          </div>

          {/* Stock */}
          <div className="space-y-3">
            <Toggle
              checked={unlimitedStock}
              onChange={setUnlimitedStock}
              label="Stock illimité"
            />
            {!unlimitedStock && (
              <Input
                label="Stock maximum"
                type="number"
                min="0"
                placeholder="Ex: 100"
                value={maxStock}
                onChange={(e) => setMaxStock(e.target.value)}
              />
            )}
            <Input
              label="Seuil d'alerte stock faible (optionnel)"
              type="number"
              min="0"
              placeholder="Ex: 5"
              value={lowStockAlert}
              onChange={(e) => setLowStockAlert(e.target.value)}
            />
          </div>

          {/* Harvest Commission */}
          {canManageRoles && (
            <div className="border-t border-gta-border pt-4 space-y-3">
              <Toggle
                checked={harvestable}
                onChange={setHarvestable}
                label="Objet récoltable"
              />
              {harvestable && (
                <>
                  <Input
                    label="Commission de récolte par défaut (%)"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    placeholder="Ex: 10"
                    value={harvestCommissionPercent}
                    onChange={(e) => setHarvestCommissionPercent(e.target.value)}
                  />
                  <p className="text-xs text-gta-text-dim">
                    Pourcentage reversé aux membres quand cet objet est récolté. Peut être personnalisé par membre.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gta-border">
            <Button type="button" variant="ghost" onClick={() => navigate("/inventaire")}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner size="sm" /> : "Créer l'objet"}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}

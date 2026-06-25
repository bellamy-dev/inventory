import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "../components/layout/Header";
import { Spinner } from "../components/ui/Spinner";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { VehicleSelect } from "../components/ui/VehicleSelect";
import { Modal } from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { vehiclesApi } from "../api/vehicles.api";
import { itemTypesApi } from "../api/itemTypes.api";
import { Vehicle, VehicleStockItem, ItemType } from "../types";
import toast from "react-hot-toast";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  useDroppable,
  DragStartEvent,
  closestCenter,
  MouseSensor,
  TouchSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Car,
  Plus,
  Trash2,
  Package,
  ArrowRightLeft,
  Upload,
  Pencil,
  GripVertical,
} from "lucide-react";

function SortableVehicleItem({
  vsi,
  isDraggingAny,
  onMoveClick,
}: {
  vsi: VehicleStockItem;
  isDraggingAny: boolean;
  onMoveClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: vsi.itemTypeId });

  const totalW = vsi.quantity * vsi.itemType.weight;
  const rarityColor = vsi.itemType.rarity?.color || "#6b7280";
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.3 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`gta-cell relative group cursor-grab active:cursor-grabbing select-none transition-all duration-150 ${
        isDragging ? "scale-[1.04] shadow-2xl ring-2 ring-gta-accent" : ""
      } ${isDraggingAny && !isDragging ? "opacity-60" : ""}`}
      {...attributes}
      {...listeners}
      onContextMenu={(e) => {
        e.preventDefault();
        onMoveClick();
      }}
    >
      {/* Rarity top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t pointer-events-none"
        style={{ backgroundColor: rarityColor }}
      />

      {/* Quantity */}
      <span className="absolute top-1.5 left-1.5 text-xs font-bold bg-black/60 rounded px-1.5 py-0.5 pointer-events-none">
        x{vsi.quantity}
      </span>

      {/* Grip icon on hover */}
      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <GripVertical className="h-3.5 w-3.5 text-gta-text-dim" />
      </div>

      {/* Image */}
      <div className="flex items-center justify-center h-12 w-12 mb-1.5 pointer-events-none">
        {vsi.itemType.imageUrl ? (
          <img src={vsi.itemType.imageUrl} alt={vsi.itemType.name} className="h-full w-full object-contain" />
        ) : (
          <Package className="h-8 w-8 text-gta-text-dim" />
        )}
      </div>

      {/* Name */}
      <p className="text-xs text-center font-medium truncate w-full pointer-events-none">
        {vsi.itemType.name}
      </p>

      {/* Weight */}
      <p className="text-[10px] text-gta-text-dim text-center pointer-events-none">
        {parseFloat(totalW.toFixed(4))}kg
      </p>

      {/* Move button on hover */}
      <button
        className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-gta-accent/20 hover:bg-gta-accent/40 rounded p-0.5 pointer-events-auto"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onMoveClick();
        }}
      >
        <ArrowRightLeft className="h-3 w-3 text-gta-accent" />
      </button>
    </div>
  );
}

function DroppableVehicleTab({
  vehicle,
  isSelected,
  isDraggingAny,
  onSelect,
  onContextMenu,
}: {
  vehicle: Vehicle;
  isSelected: boolean;
  isDraggingAny: boolean;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent, vehicle: Vehicle) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `vehicle-tab-${vehicle.id}`,
    data: { type: "vehicle-tab", vehicleId: vehicle.id },
  });

  const vWeight = vehicle.items.reduce(
    (sum, vsi) => sum + vsi.quantity * vsi.itemType.weight,
    0
  );
  const itemCount = vehicle.items.reduce((sum, vsi) => sum + vsi.quantity, 0);
  const fillPercent = vehicle.maxWeight > 0 ? Math.min((vWeight / vehicle.maxWeight) * 100, 100) : 0;
  const barColor =
    fillPercent < 50 ? "#22c55e" : fillPercent < 80 ? "#f59e0b" : "#ef4444";

  return (
    <button
      ref={setNodeRef}
      className={`relative flex flex-col items-start px-4 py-2.5 rounded-lg text-sm transition-all duration-150 min-w-[140px] ${
        isSelected
          ? "bg-gta-accent text-white shadow-lg shadow-gta-accent/20"
          : isOver
            ? "bg-gta-accent/20 text-gta-accent border-2 border-dashed border-gta-accent scale-[1.02]"
            : isDraggingAny
              ? "bg-gta-surface hover:bg-gta-surface-hover border border-gta-accent/30"
              : "bg-gta-surface text-gta-text-dim hover:bg-gta-surface-hover"
      }`}
      onClick={onSelect}
      onContextMenu={(e) => onContextMenu(e, vehicle)}
    >
      <div className="flex items-center gap-2 w-full">
        {vehicle.imageUrl ? (
          <img src={vehicle.imageUrl} alt={vehicle.name} className="h-5 w-5 object-contain shrink-0" />
        ) : (
          <Car className="h-4 w-4 shrink-0" />
        )}
        <span className="font-medium truncate">{vehicle.name}</span>
        <span className="ml-auto text-xs opacity-70 shrink-0">{itemCount}</span>
      </div>
      {/* Mini capacity bar */}
      <div className="w-full mt-1.5">
        <div className="h-1 rounded-full bg-black/20 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${fillPercent}%`,
              backgroundColor: isSelected ? "white" : barColor,
            }}
          />
        </div>
        <p className="text-[10px] mt-0.5 opacity-70 text-left">
          {vWeight.toFixed(1)} / {vehicle.maxWeight}kg
        </p>
      </div>
    </button>
  );
}

function DroppableVehicleZone({
  vehicle,
  onSelect,
}: {
  vehicle: Vehicle;
  onSelect: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `vehicle-zone-${vehicle.id}`,
    data: { type: "vehicle-tab", vehicleId: vehicle.id },
  });

  const vWeight = vehicle.items.reduce(
    (sum, vsi) => sum + vsi.quantity * vsi.itemType.weight,
    0
  );
  const fillPercent = vehicle.maxWeight > 0 ? Math.min((vWeight / vehicle.maxWeight) * 100, 100) : 0;
  const barColor = fillPercent < 50 ? "#22c55e" : fillPercent < 80 ? "#f59e0b" : "#ef4444";

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onSelect}
      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed transition-all duration-200 min-h-[120px] ${
        isOver
          ? "border-gta-accent bg-gta-accent/15 scale-[1.03] shadow-lg shadow-gta-accent/10"
          : "border-gta-border/40 hover:border-gta-accent/40 hover:bg-gta-surface/50"
      }`}
    >
      {vehicle.imageUrl ? (
        <img src={vehicle.imageUrl} alt={vehicle.name} className="h-10 w-10 object-contain mb-2 opacity-60" />
      ) : (
        <Car className="h-8 w-8 text-gta-text-dim mb-2 opacity-40" />
      )}
      <span className="text-sm font-medium text-gta-text-dim">{vehicle.name}</span>
      <span className="text-[10px] text-gta-text-dim/60 mt-0.5">
        {vWeight.toFixed(1)}/{vehicle.maxWeight}kg
      </span>
      <div className="w-full h-1 rounded-full bg-gta-border/30 overflow-hidden mt-2">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${fillPercent}%`, backgroundColor: barColor }}
        />
      </div>
      {isOver && (
        <span className="text-xs text-gta-accent font-medium mt-2 animate-pulse">
          Déposez ici
        </span>
      )}
    </button>
  );
}

export function VehicleInventoryPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [allItemTypes, setAllItemTypes] = useState<ItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const selectedVehicleIdRef = useRef(selectedVehicleId);
  const [isDraggingAny, setIsDraggingAny] = useState(false);

  useEffect(() => {
    selectedVehicleIdRef.current = selectedVehicleId;
  }, [selectedVehicleId]);

  // Create modal
  const [createModal, setCreateModal] = useState(false);
  const [newVehicleName, setNewVehicleName] = useState("");
  const [newVehicleWeight, setNewVehicleWeight] = useState("300");
  const [newVehicleImage, setNewVehicleImage] = useState<File | null>(null);
  const [newVehicleImagePreview, setNewVehicleImagePreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [editModal, setEditModal] = useState<Vehicle | null>(null);
  const [editName, setEditName] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Move modal
  const [moveModal, setMoveModal] = useState<{
    itemTypeId: string;
    itemName: string;
    fromType: "stock" | "vehicle";
    fromId: string;
    maxQuantity: number;
  } | null>(null);
  const [moveQuantity, setMoveQuantity] = useState(1);
  const [moveTargetId, setMoveTargetId] = useState<string>("");
  const [moving, setMoving] = useState(false);

  // Tab context menu
  const [tabContextMenu, setTabContextMenu] = useState<{
    x: number;
    y: number;
    vehicle: Vehicle;
  } | null>(null);

  // Drag overlay
  const [activeDrag, setActiveDrag] = useState<{
    itemTypeId: string;
    name: string;
    imageUrl: string | null;
    fromVehicleName: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  // SSE ref
  const eventSourceRef = useRef<EventSource | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [vData, iData] = await Promise.all([
        vehiclesApi.getAll(),
        itemTypesApi.getAll(),
      ]);
      setVehicles(vData);
      setAllItemTypes(iData);

      const currentId = selectedVehicleIdRef.current;
      if (vData.length > 0 && (!currentId || !vData.find((v: Vehicle) => v.id === currentId))) {
        setSelectedVehicleId(vData[0].id);
      }
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // SSE connection
  useEffect(() => {
    const connect = () => {
      const es = new EventSource("/api/events");
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "vehicle-change" || data.type === "stock-change") {
            loadData();
          }
        } catch {
          // ignore
        }
      };

      es.onerror = () => {
        es.close();
        setTimeout(connect, 3000);
      };
    };

    connect();
    return () => { eventSourceRef.current?.close(); };
  }, [loadData]);

  // Block native context menu when our menu is open
  useEffect(() => {
    if (!tabContextMenu) return;
    const handler = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, [tabContextMenu]);

  // Keyboard navigation between vehicles
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (vehicles.length < 2) return;

      const idx = vehicles.findIndex((v) => v.id === selectedVehicleId);
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = idx < vehicles.length - 1 ? idx + 1 : 0;
        setSelectedVehicleId(vehicles[next].id);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prev = idx > 0 ? idx - 1 : vehicles.length - 1;
        setSelectedVehicleId(vehicles[prev].id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [vehicles, selectedVehicleId]);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const vehicleItems = selectedVehicle?.items || [];

  const currentWeight = vehicleItems.reduce(
    (sum, vsi) => sum + vsi.quantity * vsi.itemType.weight,
    0
  );
  const maxWeight = selectedVehicle?.maxWeight || 0;
  const fillPercent = maxWeight > 0 ? Math.min((currentWeight / maxWeight) * 100, 100) : 0;
  const weightColor =
    fillPercent < 50 ? "#22c55e" : fillPercent < 80 ? "#f59e0b" : "#ef4444";

  // --- Create ---
  const handleCreateVehicle = async () => {
    if (!newVehicleName.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append("name", newVehicleName.trim());
      fd.append("maxWeight", newVehicleWeight);
      if (newVehicleImage) fd.append("image", newVehicleImage);
      const v = await vehiclesApi.create(fd);
      toast.success(`Véhicule "${v.name}" créé !`);
      setCreateModal(false);
      setNewVehicleName("");
      setNewVehicleWeight("300");
      setNewVehicleImage(null);
      setNewVehicleImagePreview(null);
      setSelectedVehicleId(v.id);
      loadData();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || "Erreur");
    } finally {
      setCreating(false);
    }
  };

  // --- Edit ---
  const openEditModal = (v: Vehicle) => {
    setEditModal(v);
    setEditName(v.name);
    setEditWeight(String(v.maxWeight));
    setEditImage(null);
    setEditImagePreview(v.imageUrl);
  };

  const handleEditVehicle = async () => {
    if (!editModal || !editName.trim()) return;
    setEditing(true);
    try {
      const fd = new FormData();
      fd.append("name", editName.trim());
      fd.append("maxWeight", editWeight);
      if (editImage) fd.append("image", editImage);
      await vehiclesApi.update(editModal.id, fd);
      toast.success("Véhicule modifié !");
      setEditModal(null);
      loadData();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || "Erreur");
    } finally {
      setEditing(false);
    }
  };

  // --- Delete ---
  const handleDeleteVehicle = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await vehiclesApi.delete(deleteTarget.id);
      toast.success(`Véhicule "${deleteTarget.name}" supprimé !`);
      setDeleteTarget(null);
      if (selectedVehicleId === deleteTarget.id) {
        setSelectedVehicleId(vehicles.find((v) => v.id !== deleteTarget.id)?.id || null);
      }
      loadData();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || "Erreur");
    } finally {
      setDeleting(false);
    }
  };

  // --- Move ---
  const openMoveModal = (
    source: "stock" | "vehicle",
    itemTypeId: string,
    itemName: string,
    maxQuantity: number,
    fromId: string
  ) => {
    const otherVehicles = vehicles.filter(
      (v) => !(source === "vehicle" && v.id === fromId)
    );
    setMoveModal({ itemTypeId, itemName, fromType: source, fromId, maxQuantity });
    setMoveQuantity(1);
    setMoveTargetId(otherVehicles[0]?.id || "");
  };

  const handleMove = async () => {
    if (!moveModal || !moveTargetId) return;
    setMoving(true);
    try {
      const toType = moveTargetId === "__stock__" ? "stock" : "vehicle";
      const toId = moveTargetId === "__stock__" ? "stock" : moveTargetId;

      await vehiclesApi.moveItem(
        moveModal.fromType,
        moveModal.fromId,
        toType,
        toId,
        moveModal.itemTypeId,
        moveQuantity
      );
      toast.success("Objet déplacé !");
      setMoveModal(null);
      loadData();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || "Erreur");
    } finally {
      setMoving(false);
    }
  };

  // --- DnD ---
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = String(active.id);
    const vsi = vehicleItems.find((v) => v.itemTypeId === activeId);
    if (vsi) {
      setIsDraggingAny(true);
      setActiveDrag({
        itemTypeId: vsi.itemTypeId,
        name: vsi.itemType.name,
        imageUrl: vsi.itemType.imageUrl,
        fromVehicleName: selectedVehicle?.name || "",
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDrag(null);
    setIsDraggingAny(false);

    if (!over || !selectedVehicleId) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Check if dropped on a vehicle tab/zone (cross-vehicle move)
    const overData = over.data.current;
    if (overData?.type === "vehicle-tab" && overData.vehicleId !== selectedVehicleId) {
      const vsi = vehicleItems.find((v) => v.itemTypeId === activeId);
      if (vsi) {
        const toName = vehicles.find((v) => v.id === overData.vehicleId)?.name;
        try {
          await vehiclesApi.moveItem(
            "vehicle",
            selectedVehicleId,
            "vehicle",
            overData.vehicleId,
            activeId,
            vsi.quantity
          );
          toast.success(`Déplacé vers ${toName}`);
          loadData();
        } catch (err) {
          toast.error((err as any)?.response?.data?.error || "Erreur");
        }
      }
      return;
    }

    // Reorder within same vehicle
    if (activeId !== overId) {
      const oldIndex = vehicleItems.findIndex((v) => v.itemTypeId === activeId);
      const newIndex = vehicleItems.findIndex((v) => v.itemTypeId === overId);
      if (oldIndex === -1 || newIndex === -1) return;

      const newItems = arrayMove(vehicleItems, oldIndex, newIndex);
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === selectedVehicleId ? { ...v, items: newItems } : v
        )
      );

      try {
        await vehiclesApi.updateItemPositions(
          selectedVehicleId,
          newItems.map((item, i) => ({ itemTypeId: item.itemTypeId, position: i }))
        );
      } catch {
        toast.error("Erreur de réorganisation");
        loadData();
      }
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
        title="Véhicules"
        subtitle={`${vehicles.length} véhicule(s) — ← → pour naviguer`}
        actions={
          <Button onClick={() => setCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2 inline" />
            Nouveau véhicule
          </Button>
        }
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Vehicle tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {vehicles.map((v) => (
            <DroppableVehicleTab
              key={v.id}
              vehicle={v}
              isSelected={selectedVehicleId === v.id}
              isDraggingAny={isDraggingAny}
              onSelect={() => setSelectedVehicleId(v.id)}
              onContextMenu={(e, veh) => {
                e.preventDefault();
                setTabContextMenu({ x: e.clientX, y: e.clientY, vehicle: veh });
              }}
            />
          ))}
          {vehicles.length === 0 && (
            <div className="gta-card flex items-center gap-3 py-4 px-6 w-full">
              <Car className="h-8 w-8 text-gta-text-dim opacity-50" />
              <div>
                <p className="text-sm font-medium">Aucun véhicule</p>
                <p className="text-xs text-gta-text-dim">Créez votre premier véhicule pour commencer à gérer les stocks</p>
              </div>
            </div>
          )}
        </div>

        {selectedVehicle && (
          <>
            {/* Capacity bar */}
            <div className="gta-card mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gta-text-dim flex items-center gap-2">
                  {selectedVehicle.imageUrl ? (
                    <img src={selectedVehicle.imageUrl} alt={selectedVehicle.name} className="h-4 w-4 object-contain" />
                  ) : (
                    <Car className="h-4 w-4" />
                  )} {selectedVehicle.name}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gta-text-dim">
                    {vehicleItems.length} type(s) — {vehicleItems.reduce((s, v) => s + v.quantity, 0)} objet(s)
                  </span>
                  <span className="text-sm font-medium">
                    {currentWeight.toFixed(1)} / {maxWeight} kg
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-gta-border overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${fillPercent}%`, backgroundColor: weightColor }}
                />
              </div>
            </div>

            {/* Vehicle items grid */}
            <div className={`gta-card transition-all duration-200 ${isDraggingAny ? "ring-2 ring-gta-accent/30 ring-dashed" : ""}`}>
              {vehicleItems.length === 0 ? (
                <div className={`text-center py-16 text-gta-text-dim transition-all duration-200 ${isDraggingAny ? "scale-[1.02]" : ""}`}>
                  <div className={`mx-auto mb-4 h-20 w-20 rounded-2xl border-2 border-dashed flex items-center justify-center transition-colors duration-200 ${isDraggingAny ? "border-gta-accent bg-gta-accent/10" : "border-gta-border"}`}>
                    <Package className={`h-10 w-10 transition-colors duration-200 ${isDraggingAny ? "text-gta-accent" : "opacity-40"}`} />
                  </div>
                  <p className="font-medium mb-1">
                    {isDraggingAny ? "Déposez ici" : "Véhicule vide"}
                  </p>
                  <p className="text-xs opacity-60">
                    {isDraggingAny
                      ? "Relâchez pour ajouter l'objet à ce véhicule"
                      : "Glissez un objet depuis un autre véhicule pour l'ajouter"}
                  </p>
                </div>
              ) : (
                <SortableContext items={vehicleItems.map((v) => v.itemTypeId)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                    {vehicleItems.map((vsi) => (
                      <SortableVehicleItem
                        key={vsi.id}
                        vsi={vsi}
                        isDraggingAny={isDraggingAny}
                        onMoveClick={() =>
                          openMoveModal(
                            "vehicle",
                            vsi.itemType.id,
                            vsi.itemType.name,
                            vsi.quantity,
                            selectedVehicleId!
                          )
                        }
                      />
                    ))}
                  </div>
                </SortableContext>
              )}
            </div>

            {/* Drop zones for other vehicles - visible when dragging */}
            {isDraggingAny && (
              <div className="mt-4">
                <p className="text-xs text-gta-text-dim mb-2 font-medium">Déposer dans un autre véhicule :</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {vehicles
                    .filter((v) => v.id !== selectedVehicleId)
                    .map((v) => (
                      <DroppableVehicleZone
                        key={v.id}
                        vehicle={v}
                        onSelect={() => {}}
                      />
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        <DragOverlay dropAnimation={null}>
          {activeDrag && (
            <div className="gta-cell ring-2 ring-gta-accent shadow-2xl scale-110 opacity-95 pointer-events-none">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gta-accent text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap font-medium shadow-lg">
                {activeDrag.fromVehicleName}
              </div>
              <div className="flex items-center justify-center h-12 w-12 mb-1">
                {activeDrag.imageUrl ? (
                  <img src={activeDrag.imageUrl} alt={activeDrag.name} className="h-full w-full object-contain" />
                ) : (
                  <Package className="h-8 w-8 text-gta-text-dim" />
                )}
              </div>
              <p className="text-xs text-center font-medium truncate w-full">
                {activeDrag.name}
              </p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Tab context menu */}
      {tabContextMenu && (() => {
        const menuW = 180;
        const menuH = 80;
        const x = Math.min(tabContextMenu.x, window.innerWidth - menuW - 8);
        const y = Math.min(tabContextMenu.y, window.innerHeight - menuH - 8);
        return (
          <>
            <div className="fixed inset-0 z-50" onClick={() => setTabContextMenu(null)} onContextMenu={(e) => { e.preventDefault(); setTabContextMenu(null); }} />
            <div
              className="fixed z-50 rounded-lg border border-gta-border bg-gta-surface shadow-xl py-1"
              style={{ left: Math.max(8, x), top: Math.max(8, y), width: menuW }}
            >
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gta-surface-hover"
                onClick={() => {
                  openEditModal(tabContextMenu.vehicle);
                  setTabContextMenu(null);
                }}
              >
                <Pencil className="h-4 w-4 text-gta-warning" />
                Modifier
              </button>
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gta-surface-hover text-gta-danger"
                onClick={() => {
                  setDeleteTarget(tabContextMenu.vehicle);
                  setTabContextMenu(null);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </button>
            </div>
          </>
        );
      })()}

      {/* Create Vehicle Modal */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Nouveau véhicule"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gta-text-dim mb-2 block">
              Image du véhicule
            </label>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-lg border-2 border-dashed border-gta-border flex items-center justify-center overflow-hidden bg-gta-bg shrink-0">
                {newVehicleImagePreview ? (
                  <img src={newVehicleImagePreview} alt="Preview" className="h-full w-full object-contain" />
                ) : (
                  <Car className="h-8 w-8 text-gta-text-dim" />
                )}
              </div>
              <label className="gta-btn-primary cursor-pointer inline-flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Choisir une image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        toast.error("L'image est trop volumineuse (max 10 Mo)");
                        e.target.value = "";
                        return;
                      }
                      setNewVehicleImage(file);
                      const reader = new FileReader();
                      reader.onloadend = () => setNewVehicleImagePreview(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>
          <Input
            label="Nom du véhicule"
            placeholder="Ex: Camion Benne"
            value={newVehicleName}
            onChange={(e) => setNewVehicleName(e.target.value)}
          />
          <Input
            label="Poids maximum (kg)"
            type="text"
            inputMode="decimal"
            placeholder="Ex: 300"
            value={newVehicleWeight}
            onChange={(e) => setNewVehicleWeight(e.target.value.replace(",", "."))}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setCreateModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateVehicle} disabled={creating}>
              {creating ? <Spinner size="sm" /> : "Créer"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal
        isOpen={!!editModal}
        onClose={() => setEditModal(null)}
        title="Modifier le véhicule"
      >
        {editModal && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gta-text-dim mb-2 block">
                Image du véhicule
              </label>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-lg border-2 border-dashed border-gta-border flex items-center justify-center overflow-hidden bg-gta-bg shrink-0">
                  {editImagePreview ? (
                    <img src={editImagePreview} alt="Preview" className="h-full w-full object-contain" />
                  ) : (
                    <Car className="h-8 w-8 text-gta-text-dim" />
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
                        if (file.size > 10 * 1024 * 1024) {
                          toast.error("L'image est trop volumineuse (max 10 Mo)");
                          e.target.value = "";
                          return;
                        }
                        setEditImage(file);
                        const reader = new FileReader();
                        reader.onloadend = () => setEditImagePreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
            <Input
              label="Nom du véhicule"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <Input
              label="Poids maximum (kg)"
              type="text"
              inputMode="decimal"
              value={editWeight}
              onChange={(e) => setEditWeight(e.target.value.replace(",", "."))}
            />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setEditModal(null)}>
                Annuler
              </Button>
              <Button onClick={handleEditVehicle} disabled={editing}>
                {editing ? <Spinner size="sm" /> : "Enregistrer"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Move Modal */}
      <Modal
        isOpen={!!moveModal}
        onClose={() => setMoveModal(null)}
        title="Déplacer un objet"
      >
        {moveModal && (
          <div className="space-y-4">
            <p className="text-sm text-gta-text-dim">
              Déplacer <strong>{moveModal.itemName}</strong> depuis{" "}
              <strong>
                {moveModal.fromType === "stock"
                  ? "l'inventaire principal"
                  : vehicles.find((v) => v.id === moveModal.fromId)?.name || "véhicule"}
              </strong>
            </p>
            <Input
              label={`Quantité (max: ${moveModal.maxQuantity})`}
              type="number"
              min={1}
              max={moveModal.maxQuantity}
              value={moveQuantity}
              onChange={(e) => {
                const v = parseInt(e.target.value) || 1;
                setMoveQuantity(Math.min(v, moveModal.maxQuantity));
              }}
            />
            <VehicleSelect
              vehicles={vehicles.filter(
                (v) => !(moveModal.fromType === "vehicle" && v.id === moveModal.fromId)
              )}
              value={moveTargetId}
              onChange={setMoveTargetId}
              showStock={moveModal.fromType === "vehicle"}
            />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setMoveModal(null)}>
                Annuler
              </Button>
              <Button onClick={handleMove} disabled={moving || !moveTargetId}>
                {moving ? <Spinner size="sm" /> : "Déplacer"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteVehicle}
        title="Supprimer le véhicule"
        message={`Supprimer "${deleteTarget?.name}" ? Tous les objets qu'il contient seront supprimés.`}
        confirmLabel="Supprimer"
        loading={deleting}
      />
    </>
  );
}

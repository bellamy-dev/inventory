import { useState, useEffect, useCallback } from "react";
import { Header } from "../components/layout/Header";
import { Spinner } from "../components/ui/Spinner";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Toggle } from "../components/ui/Toggle";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { rolesApi } from "../api/roles.api";
import { Role, Permission, PERMISSION_LABELS } from "../types";
import toast from "react-hot-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Shield, Plus, Trash2 } from "lucide-react";

const ALL_PERMISSIONS = Object.values(Permission);

function SortableRole({
  role,
  onEditPermissions,
  onDelete,
}: {
  role: Role;
  onEditPermissions: (role: Role) => void;
  onDelete: (role: Role) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: role.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : undefined,
  };

  const rolePermissions = role.permissions.map((p) => p.permission);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`gta-card flex items-center gap-4 ${isDragging ? "ring-2 ring-gta-accent" : ""}`}
    >
      <button
        className="cursor-grab active:cursor-grabbing text-gta-text-dim hover:text-gta-text"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div
        className="h-8 w-8 rounded-full shrink-0"
        style={{ backgroundColor: role.color }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{role.name}</span>
          <span className="text-xs text-gta-text-dim">
            Rang #{role.position + 1}
          </span>
          {role.isSystem && (
            <span className="text-[10px] bg-gta-accent/15 text-gta-accent px-1.5 py-0.5 rounded">
              Système
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {rolePermissions.slice(0, 5).map((perm) => (
            <span
              key={perm}
              className="text-[10px] bg-gta-bg text-gta-text-dim px-1.5 py-0.5 rounded"
            >
              {PERMISSION_LABELS[perm]}
            </span>
          ))}
          {rolePermissions.length > 5 && (
            <span className="text-[10px] bg-gta-bg text-gta-text-dim px-1.5 py-0.5 rounded">
              +{rolePermissions.length - 5}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-gta-text-dim">{role._count.users} user(s)</span>
        <Button variant="ghost" onClick={() => onEditPermissions(role)}>
          <Shield className="h-4 w-4" />
        </Button>
        {!role.isSystem && (
          <button
            className="text-gta-danger hover:text-red-400"
            onClick={() => onDelete(role)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6b7280");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Permissions modal
  const [permModal, setPermModal] = useState<Role | null>(null);
  const [permEdit, setPermEdit] = useState<Permission[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadData = useCallback(async () => {
    try {
      const data = await rolesApi.getAll();
      setRoles(data);
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = roles.findIndex((r) => r.id === active.id);
    const newIndex = roles.findIndex((r) => r.id === over.id);
    const newRoles = arrayMove(roles, oldIndex, newIndex);
    setRoles(newRoles);

    try {
      await rolesApi.updateHierarchy(
        newRoles.map((r, i) => ({ id: r.id, position: i }))
      );
      toast.success("Hiérarchie mise à jour !");
    } catch {
      toast.error("Erreur lors de la mise à jour");
      loadData();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    setCreating(true);
    try {
      await rolesApi.create({ name: newName, color: newColor, permissions: [] });
      toast.success("Rôle créé !");
      setCreateModal(false);
      setNewName("");
      setNewColor("#6b7280");
      loadData();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || "Erreur");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await rolesApi.delete(deleteTarget.id);
      toast.success("Rôle supprimé !");
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || "Erreur");
    } finally {
      setDeleting(false);
    }
  };

  const openPermModal = (role: Role) => {
    setPermModal(role);
    setPermEdit(role.permissions.map((p) => p.permission));
  };

  const togglePerm = (perm: Permission) => {
    setPermEdit((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const savePermissions = async () => {
    if (!permModal) return;
    setSavingPerms(true);
    try {
      await rolesApi.updatePermissions(permModal.id, permEdit);
      toast.success("Permissions mises à jour !");
      setPermModal(null);
      loadData();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || "Erreur");
    } finally {
      setSavingPerms(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  return (
    <>
      <Header
        title="Gestion des rôles"
        subtitle="Définir les rôles et permissions"
        actions={
          <Button onClick={() => setCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2 inline" />
            Créer un rôle
          </Button>
        }
      />

      <p className="text-xs text-gta-text-dim mb-4">
        Glissez-déposez pour réorganiser la hiérarchie. Le rôle en haut (Rang #1) a le plus de privilèges.
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={roles.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {roles.map((role) => (
              <SortableRole
                key={role.id}
                role={role}
                onEditPermissions={openPermModal}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Create role modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Créer un rôle">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Nom du rôle"
            placeholder="Ex: Modérateur"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gta-text-dim">Couleur</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="h-10 w-10 rounded cursor-pointer border-0"
              />
              <input
                type="text"
                className="gta-input flex-1"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setCreateModal(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? "..." : "Créer"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Permissions modal */}
      <Modal
        isOpen={!!permModal}
        onClose={() => setPermModal(null)}
        title={`Permissions — ${permModal?.name}`}
      >
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {ALL_PERMISSIONS.map((perm) => (
            <div
              key={perm}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gta-bg"
            >
              <span className="text-sm">{PERMISSION_LABELS[perm]}</span>
              <Toggle
                checked={permEdit.includes(perm)}
                onChange={() => togglePerm(perm)}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gta-border">
          <Button variant="ghost" onClick={() => setPermModal(null)}>
            Annuler
          </Button>
          <Button onClick={savePermissions} disabled={savingPerms}>
            {savingPerms ? "..." : "Enregistrer"}
          </Button>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer le rôle"
        message={`Êtes-vous sûr de vouloir supprimer le rôle "${deleteTarget?.name}" ?`}
        confirmLabel="Supprimer"
        loading={deleting}
      />
    </>
  );
}

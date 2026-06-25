import { useState, useEffect, useCallback } from "react";
import { Header } from "../components/layout/Header";
import { Spinner } from "../components/ui/Spinner";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { usersApi } from "../api/users.api";
import { rolesApi } from "../api/roles.api";
import { usePermissions } from "../hooks/usePermissions";
import { UserListItem, Role } from "../types";
import toast from "react-hot-toast";
import { UserPlus, Trash2, Shield } from "lucide-react";

export function UsersPage() {
  const { canManageRoles } = usePermissions();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRoleId, setNewRoleId] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [u, r] = await Promise.all([
        usersApi.getAll(),
        canManageRoles ? rolesApi.getAll() : Promise.resolve([] as Role[]),
      ]);
      setUsers(u);
      setRoles(r);
      if (r.length > 0 && !newRoleId) setNewRoleId(r[r.length - 1].id);
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [canManageRoles]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim() || !newRoleId) {
      toast.error("Tous les champs sont requis");
      return;
    }
    setCreating(true);
    try {
      await usersApi.create({
        username: newUsername,
        password: newPassword,
        roleId: newRoleId,
      });
      toast.success("Compte créé !");
      setCreateModal(false);
      setNewUsername("");
      setNewPassword("");
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
      await usersApi.delete(deleteTarget.id);
      toast.success("Utilisateur supprimé !");
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || "Erreur");
    } finally {
      setDeleting(false);
    }
  };

  const handleRoleChange = async (userId: string, roleId: string) => {
    try {
      await usersApi.updateRole(userId, roleId);
      toast.success("Rôle mis à jour !");
      loadData();
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || "Erreur");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  return (
    <>
      <Header
        title="Gestion des utilisateurs"
        subtitle={`${users.length} compte(s)`}
        actions={
          <Button onClick={() => setCreateModal(true)} disabled={!canManageRoles}>
            <UserPlus className="h-4 w-4 mr-2 inline" />
            Créer un compte
          </Button>
        }
      />

      <div className="gta-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gta-border">
              <th className="text-left py-3 px-4 text-gta-text-dim font-medium">Utilisateur</th>
              <th className="text-left py-3 px-4 text-gta-text-dim font-medium">Rôle</th>
              <th className="text-left py-3 px-4 text-gta-text-dim font-medium">Créé le</th>
              <th className="text-right py-3 px-4 text-gta-text-dim font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gta-border/50 hover:bg-gta-surface-hover">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: user.role.color }}
                    >
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{user.username}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <select
                    className="gta-input w-auto text-xs py-1"
                    value={user.role.id}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={!canManageRoles}
                  >
                    {roles.length > 0 ? (
                      roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))
                    ) : (
                      <option value={user.role.id}>{user.role.name}</option>
                    )}
                  </select>
                </td>
                <td className="py-3 px-4 text-gta-text-dim text-xs">
                  {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    className="text-gta-danger hover:text-red-400 transition-colors"
                    onClick={() => setDeleteTarget(user)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create user modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Créer un compte">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Pseudo"
            placeholder="Nom d'utilisateur"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            autoFocus
          />
          <Input
            label="Mot de passe"
            type="password"
            placeholder="Mot de passe"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Select
            label="Rôle"
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
            value={newRoleId}
            onChange={(e) => setNewRoleId(e.target.value)}
          />
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

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer l'utilisateur"
        message={`Êtes-vous sûr de vouloir supprimer le compte "${deleteTarget?.username}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        loading={deleting}
      />
    </>
  );
}

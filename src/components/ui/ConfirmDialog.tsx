import { Modal } from "./Modal";
import { Button } from "./Button";
import { Spinner } from "./Spinner";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmer",
  loading,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-gta-text-dim text-sm mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          Annuler
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={loading}>
          {loading ? <Spinner size="sm" /> : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

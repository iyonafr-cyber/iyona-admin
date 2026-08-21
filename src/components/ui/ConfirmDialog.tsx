import { useState, type ReactNode } from "react";
import Modal from "./Modal";
import Button from "../button/Button";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  requireReason?: boolean;
  destructive?: boolean;
  busy?: boolean;
}

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  requireReason = false,
  destructive = false,
  busy = false,
}: ConfirmDialogProps) => {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const disabled = busy || submitting || (requireReason && !reason.trim());

  const handleConfirm = async () => {
    if (disabled) return;
    try {
      setSubmitting(true);
      await onConfirm(reason.trim());
      setReason("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {cancelLabel}
          </Button>
          <Button
            onClick={() => void handleConfirm()}
            disabled={disabled}
            className={
              destructive
                ? "bg-red-600 text-white hover:bg-red-700"
                : ""
            }
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description && (
        <div className="text-sm text-muted-foreground mb-3">{description}</div>
      )}
      {requireReason && (
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">
            Reason
          </span>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/50"
            placeholder="Why are you taking this action?"
            autoFocus
          />
        </label>
      )}
    </Modal>
  );
};

export default ConfirmDialog;

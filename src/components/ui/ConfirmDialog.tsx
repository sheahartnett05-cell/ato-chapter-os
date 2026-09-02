import { Modal } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <p className="text-sm text-[var(--muted)]">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-ghost text-sm">
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm()
            onCancel()
          }}
          className={
            destructive
              ? 'rounded-sm bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700'
              : 'btn-primary text-sm'
          }
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';

/**
 * Reusable confirmation dialog for destructive actions (delete, clear data, etc).
 *
 * @param {boolean}  open           - Whether the dialog is visible
 * @param {function} onClose        - Called when the user cancels / clicks away
 * @param {function} onConfirm      - Called when the user confirms the action
 * @param {string}   [title]        - Dialog title (default: "Are you sure?")
 * @param {string|React.ReactNode} [message] - Body text / description
 * @param {string}   [confirmLabel] - Label for the confirm button (default: "Delete")
 * @param {string}   [cancelLabel]  - Label for the cancel button (default: "Cancel")
 * @param {string}   [confirmColor] - MUI color for the confirm button (default: "error")
 * @param {boolean}  [busy]         - Disables buttons while an async action is in progress
 * @param {string}   [busyLabel]    - Label shown on confirm button when busy (default: "Deleting…")
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  confirmColor = 'error',
  busy = false,
  busyLabel = 'Deleting…',
}) {
  return (
    <Dialog
      open={open}
      onClose={() => !busy && onClose()}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      PaperProps={{
        sx: { borderRadius: 2, width: '100%', maxWidth: 400 },
      }}
    >
      <DialogTitle id="confirm-dialog-title" sx={{ fontWeight: 700 }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description" sx={{ fontSize: '14px' }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          disabled={busy}
          sx={{ borderRadius: 1, fontSize: '12px' }}
        >
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          color={confirmColor}
          variant="contained"
          disabled={busy}
          autoFocus
          sx={{ borderRadius: 1, fontSize: '12px', boxShadow: 'none' }}
        >
          {busy ? busyLabel : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

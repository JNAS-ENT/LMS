import { AnimatePresence, motion } from 'framer-motion';

interface ConfirmDialogProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  confirmVariant?: 'danger' | 'warning' | 'primary';
}

export default function ConfirmDialog({
  open,
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  confirmText,
  variant,
  confirmVariant
}: ConfirmDialogProps) {
  // Support both prop naming conventions
  const showDialog = open ?? isOpen ?? false;
  const buttonText = confirmLabel || confirmText || 'Confirm';
  const buttonVariant = variant || confirmVariant || 'primary';

  console.log('[UI] ConfirmDialog rendered, showDialog:', showDialog);

  return (
    <AnimatePresence>
      {showDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative bg-white rounded-2xl shadow-xl border border-gray-200/60 w-full max-w-sm p-6"
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-500 mb-5">{message}</p>
            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('[UI] Confirm button clicked');
                  onConfirm();
                }}
                className={`px-4 py-2 text-sm text-white rounded-lg transition-colors ${
                  buttonVariant === 'danger' ? 'bg-red-600 hover:bg-red-700' :
                  buttonVariant === 'warning' ? 'bg-amber-600 hover:bg-amber-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {buttonText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

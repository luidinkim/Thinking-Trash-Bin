import { useToast } from '../contexts/toast-context'

const TYPE_STYLES = {
  success: 'bg-green-900/80 border-green-700 text-green-200',
  error: 'bg-red-900/80 border-red-700 text-red-200',
  info: 'bg-gray-800/80 border-gray-700 text-gray-200',
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-2 rounded-lg border text-sm backdrop-blur cursor-pointer ${TYPE_STYLES[toast.type]}`}
          onClick={() => removeToast(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}

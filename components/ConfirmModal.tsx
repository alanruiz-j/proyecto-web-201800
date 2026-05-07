'use client';

// ── Props del modal ───────────────────────────────────────────────────────────
// La interfaz describe qué datos necesita recibir el modal para funcionar.
// onConfirm y onCancel son funciones que el padre le pasa para controlar qué pasa al hacer click.
interface Props {
  message: string;
  confirmLabel?: string; // texto del botón; si no se pasa, usa 'Eliminar' por defecto
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ message, confirmLabel = 'Eliminar', onConfirm, onCancel }: Props) {
  return (
    // fixed + inset-0 cubre toda la pantalla. z-50 lo pone encima de cualquier otro elemento.
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Overlay oscuro: al hacer click fuera del cuadro, cancela el modal */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

      {/* El cuadro de diálogo. "relative" lo saca del flujo del overlay para que aparezca encima */}
      <div className="relative bg-white rounded-2xl shadow-xl border border-[var(--border)] p-6 max-w-sm w-full">
        <p className="text-[var(--foreground)] text-sm mb-6">{message}</p>

        <div className="flex gap-3 justify-end">
          {/* Botón Cancelar: cierra el modal sin ejecutar ninguna acción */}
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            Cancelar
          </button>

          {/* Botón de confirmación: ejecuta la acción destructiva (ej. eliminar) */}
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

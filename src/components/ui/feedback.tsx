import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';

/* ---------- Toast ---------- */

type ToastKind = 'ok' | 'error';
type ShowToast = (message: string, kind?: ToastKind) => void;

/* ---------- Confirm dialog ---------- */

interface ConfirmOptions {
  title: string;
  text: string;
  okLabel: string;
}
type Confirm = (options: ConfirmOptions) => Promise<boolean>;

interface Feedback {
  toast: ShowToast;
  confirm: Confirm;
}

const FeedbackContext = createContext<Feedback | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toastState, setToastState] = useState<{ message: string; kind: ToastKind; visible: boolean }>({
    message: '',
    kind: 'ok',
    visible: false,
  });
  const timer = useRef<number>();

  const toast = useCallback<ShowToast>((message, kind = 'ok') => {
    window.clearTimeout(timer.current);
    setToastState({ message, kind, visible: true });
    timer.current = window.setTimeout(() => setToastState((s) => ({ ...s, visible: false })), 2600);
  }, []);

  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);

  const confirm = useCallback<Confirm>(
    (options) => new Promise((resolve) => setDialog({ ...options, resolve })),
    [],
  );

  const close = (ok: boolean) => {
    dialog?.resolve(ok);
    setDialog(null);
  };

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}

      <div
        className={`toast${toastState.visible ? ' toast--show' : ''}${toastState.kind === 'error' ? ' toast--error' : ''}`}
        role="status"
        aria-live="polite"
      >
        <Icon name={toastState.kind === 'error' ? 'alert' : 'check'} />
        {toastState.message}
      </div>

      {dialog && <ConfirmDialog {...dialog} onClose={close} />}
    </FeedbackContext.Provider>
  );
}

function ConfirmDialog({ title, text, okLabel, onClose }: ConfirmOptions & { onClose: (ok: boolean) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={() => onClose(false)}>
      <div className="modal__box" onClick={(e) => e.stopPropagation()}>
        <h3 id="modal-title">{title}</h3>
        <p>{text}</p>
        <div className="modal__actions">
          <Button size="sm" onClick={() => onClose(false)}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" autoFocus onClick={() => onClose(true)}>
            {okLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function useFeedback(): Feedback {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used inside <FeedbackProvider>');
  return ctx;
}

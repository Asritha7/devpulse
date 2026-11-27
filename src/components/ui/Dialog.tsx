import { useEffect, useId, useRef, type ReactNode } from 'react';

export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog?.showModal();
    dialog?.querySelector<HTMLElement>('[data-initial-focus]')?.focus();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
      else document.getElementById('main')?.focus();
    };
  }, []);
  return <dialog ref={ref} className="dialog" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="dialog-heading"><h2 id={titleId}>{title}</h2><button onClick={onClose} aria-label="Close dialog">Close</button></div>
    {children}
  </dialog>;
}

export function ConfirmDialog({ title, children, onClose, onConfirm }: { title: string; children: ReactNode; onClose: () => void; onConfirm: () => void }) {
  return <Dialog title={title} onClose={onClose}>
    <p>{children}</p>
    <div className="form-actions"><button data-initial-focus onClick={onClose}>Cancel</button><button className="danger-button" onClick={onConfirm}>Delete</button></div>
  </Dialog>;
}

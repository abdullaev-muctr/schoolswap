import { useState, type InputHTMLAttributes, type ReactNode } from 'react';

interface FieldProps {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}

/** Label + control + hint + error. Wrap any input, select or custom control. */
export function Field({ label, htmlFor, hint, error, children }: FieldProps) {
  const Label = htmlFor ? 'label' : 'span';
  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <Label className="field__label" htmlFor={htmlFor}>
        {label}
      </Label>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
      {error && (
        <span className="field__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

/** Password input with a show/hide toggle. */
export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="input-wrap">
      <input {...props} className="input" type={visible ? 'text' : 'password'} />
      <button type="button" className="input-wrap__action" onClick={() => setVisible((v) => !v)}>
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

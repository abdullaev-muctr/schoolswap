import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Button } from '../components/ui/Button';
import { Field, PasswordInput } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { useFeedback } from '../components/ui/feedback';
import { PASSWORD_MIN } from '../lib/constants';

type Errors = Partial<Record<'name' | 'email' | 'password' | 'form', string>>;

const EMAIL_RE = /^\S+@\S+\.\S+$/;

function AuthLayout({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <div className="auth">
      <div className="auth__side">
        <img className="ghost-crest" src="/crest.webp" alt="" />
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      <div className="auth__form">{children}</div>
    </div>
  );
}

/** After login, return to the page the visitor originally wanted. */
function useRedirectTarget() {
  const location = useLocation();
  return (location.state as { from?: string } | null)?.from ?? '/market';
}

export function Login() {
  const { profile, signIn } = useAuth();
  const { toast } = useFeedback();
  const navigate = useNavigate();
  const target = useRedirectTarget();
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  if (profile) return <Navigate to={target} replace />;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email')).trim().toLowerCase();
    const password = String(form.get('password'));

    const next: Errors = {
      email: email ? undefined : 'Enter your email.',
      password: password ? undefined : 'Enter your password.',
    };
    setErrors(next);
    if (next.email || next.password) return;

    setBusy(true);
    try {
      await signIn(email, password);
      toast('Welcome back!');
      navigate(target, { replace: true });
    } catch (err) {
      setErrors({ form: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" text="Log in to browse listings, message sellers and manage your items.">
      <form className="form" onSubmit={submit} noValidate>
        <div>
          <h1 className="form__title">Log in</h1>
          {target !== '/market' && <p className="form__sub">Log in to continue.</p>}
        </div>
        {errors.form && <div className="form__error">{errors.form}</div>}
        <Field label="Email" htmlFor="email" error={errors.email}>
          <input className="input" id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password}>
          <PasswordInput id="password" name="password" autoComplete="current-password" />
        </Field>
        <Button type="submit" variant="primary" block disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </Button>
        <p className="auth__alt">
          New here?{' '}
          <Link className="linkbtn" to="/signup" state={{ from: target }}>
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

function passwordStrength(value: string): number {
  let score = 0;
  if (value.length >= PASSWORD_MIN) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value) || value.length >= 12) score++;
  return score;
}

const STRENGTH_LABEL = ['Weak', 'Okay', 'Good', 'Strong', 'Strong'];

export function Signup() {
  const { profile, signUp } = useAuth();
  const { toast } = useFeedback();
  const navigate = useNavigate();
  const target = useRedirectTarget();
  const [errors, setErrors] = useState<Errors>({});
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  if (profile) return <Navigate to={target} replace />;

  const strength = passwordStrength(password);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get('name')).trim().replace(/\s+/g, ' ');
    const email = String(form.get('email')).trim().toLowerCase();

    const next: Errors = {
      name: name.length >= 2 ? undefined : 'Enter your name.',
      email: EMAIL_RE.test(email) ? undefined : 'Enter a valid email, like name@example.com.',
      password: password.length >= PASSWORD_MIN ? undefined : `Use at least ${PASSWORD_MIN} characters.`,
    };
    setErrors(next);
    if (next.name || next.email || next.password) return;

    setBusy(true);
    try {
      await signUp(name, email, password);
      toast(`Welcome to SchoolSwap, ${name.split(' ')[0]}!`);
      navigate(target, { replace: true });
    } catch (err) {
      setErrors({ form: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Join SchoolSwap"
      text="One account for buying, selling and messaging. It stays saved, so you can log in again on any device."
    >
      <form className="form" onSubmit={submit} noValidate>
        <div>
          <h1 className="form__title">Create account</h1>
          <p className="form__sub">Takes less than a minute.</p>
        </div>
        {errors.form && <div className="form__error">{errors.form}</div>}
        <Field label="Full name" htmlFor="name" hint="Buyers see this name on your listings." error={errors.name}>
          <input className="input" id="name" name="name" autoComplete="name" placeholder="e.g. Alex Morgan" maxLength={60} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <input className="input" id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
        </Field>
        <Field
          label="Password"
          htmlFor="password"
          error={errors.password}
          hint={password.length < PASSWORD_MIN ? `At least ${PASSWORD_MIN} characters.` : `${STRENGTH_LABEL[strength]} password.`}
        >
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="meter" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <i key={i} className={i < strength ? 'on' : undefined} />
            ))}
          </div>
        </Field>
        <Button type="submit" variant="primary" block disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </Button>
        <p className="auth__secure">
          <Icon name="lock" />
          Passwords are stored hashed (bcrypt). Nobody can read them, including us.
        </p>
        <p className="auth__alt">
          Already have an account?{' '}
          <Link className="linkbtn" to="/login" state={{ from: target }}>
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

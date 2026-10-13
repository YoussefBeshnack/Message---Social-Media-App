import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Eye, EyeOff, MessageCircle } from "lucide-react";
import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { getApiError, signin, signup } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { AuthPayload, SignupValues } from "../types";

const loginSchema = z.object({
  email: z.string().min(1, "Enter your email or username."),
  password: z.string().min(1, "Enter your password."),
});
type LoginForm = z.infer<typeof loginSchema>;

const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Use at least 2 characters."),
    username: z.string().trim().min(3, "Use at least 3 characters."),
    email: z.string().email("Enter a valid email address."),
    dateOfBirth: z.string().min(1, "Choose your date of birth."),
    gender: z.enum(["male", "female"]),
    password: z.string().min(6, "Use at least 6 characters."),
    rePassword: z.string().min(6, "Confirm your password."),
  })
  .refine((values) => values.password === values.rePassword, {
    message: "The passwords do not match.",
    path: ["rePassword"],
  });
type SignupForm = z.infer<typeof signupSchema>;

function AuthBackdrop({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-[#123d32] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute -bottom-32 -left-16 h-[460px] w-[460px] rounded-full border border-white/10" />
        <Link to="/login" className="relative flex items-center gap-3 font-display text-xl font-extrabold">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
            <MessageCircle size={21} />
          </span>{" "}
          Message
        </Link>
        <div className="relative max-w-lg">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-300" /> A calmer kind of social
          </p>
          <h1 className="font-display text-5xl font-extrabold leading-[1.08] tracking-tight xl:text-6xl">Make room for the good stuff.</h1>
          <p className="mt-6 max-w-md text-base leading-7 text-emerald-100/75">A place to share the small wins, ideas, and moments that bring people closer.</p>
        </div>
        <p className="relative text-xs text-emerald-100/50">A learning project powered by the Route Academy Posts API.</p>
      </section>
      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[430px]">
          <Link to="/login" className="mb-9 flex items-center gap-2 font-display text-xl font-extrabold lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-leaf text-white">
              <MessageCircle size={19} />
            </span>{" "}
            Message
          </Link>
          <div className="mb-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-leaf">Your people are here</p>
            <h2 className="font-display text-3xl font-extrabold tracking-tight">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}

function Field({ label, error, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-700">{label}</span>
      <input {...props} className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-300" />
      {error && (
        <span role="alert" className="mt-1.5 block text-xs font-semibold text-rose-600">
          {error}
        </span>
      )}
    </label>
  );
}

function FormError({ message }: { message: string }) {
  return message ? (
    <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
      {message}
    </p>
  ) : null;
}

export function LoginPage() {
  const { token, signInWith } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/";
  const notice = (location.state as { notice?: string } | null)?.notice;
  const form = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const mutation = useMutation({
    mutationFn: signin,
    onSuccess: (payload: AuthPayload) => {
      signInWith(payload);
      navigate(destination, { replace: true });
    },
  });

  if (token) return <Navigate to="/" replace />;

  return (
    <AuthBackdrop title="Welcome back" subtitle="Sign in to catch up with your people.">
      <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        {notice && (
          <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {notice}
          </p>
        )}
        <Field label="Email or username" autoComplete="username" placeholder="you@example.com" {...form.register("email")} error={form.formState.errors.email?.message} />
        <label className="block">
          <span className="mb-2 block text-xs font-bold text-slate-700">Password</span>
          <span className="relative block">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your password"
              className="focus-ring w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-sm outline-none focus:border-emerald-300"
              {...form.register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </span>
          {form.formState.errors.password && (
            <span role="alert" className="mt-1.5 block text-xs font-semibold text-rose-600">
              {form.formState.errors.password.message}
            </span>
          )}
        </label>
        <FormError message={mutation.error ? getApiError(mutation.error) : ""} />
        <button
          disabled={mutation.isPending}
          className="focus-ring mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-leaf px-5 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60"
        >
          {mutation.isPending ? "Signing in…" : "Sign in"} {!mutation.isPending && <ArrowRight size={17} />}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        New around here?{" "}
        <Link to="/signup" className="font-bold text-leaf hover:underline">
          Create an account
        </Link>
      </p>
    </AuthBackdrop>
  );
}

export function SignupPage() {
  const { token, signInWith } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { gender: "female" },
  });

  const mutation = useMutation({
    mutationFn: (values: SignupForm) => {
      const payload: SignupValues = values;
      return signup(payload);
    },
    onSuccess: (payload) => {
      if (payload.token) {
        signInWith(payload);
        navigate("/", { replace: true });
      } else {
        navigate("/login", { replace: true, state: { notice: "Account created. Please sign in." } });
      }
    },
  });

  if (token) return <Navigate to="/" replace />;

  return (
    <AuthBackdrop title="Find your circle" subtitle="Create an account and make yourself at home.">
      <form className="space-y-3.5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" placeholder="Your name" autoComplete="name" {...form.register("name")} error={form.formState.errors.name?.message} />
          <Field label="Username" placeholder="yourhandle" autoComplete="username" {...form.register("username")} error={form.formState.errors.username?.message} />
        </div>
        <Field label="Email" type="email" placeholder="you@example.com" autoComplete="email" {...form.register("email")} error={form.formState.errors.email?.message} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date of birth" type="date" {...form.register("dateOfBirth")} error={form.formState.errors.dateOfBirth?.message} />
          <label className="block">
            <span className="mb-2 block text-xs font-bold text-slate-700">Gender</span>
            <select className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" {...form.register("gender")}>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </label>
        </div>
        <label className="block">
          <span className="mb-2 block text-xs font-bold text-slate-700">Password</span>
          <span className="relative block">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 6 characters"
              className="focus-ring w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-sm outline-none focus:border-emerald-300"
              {...form.register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </span>
          {form.formState.errors.password && (
            <span role="alert" className="mt-1 block text-xs font-semibold text-rose-600">
              {form.formState.errors.password.message}
            </span>
          )}
        </label>
        <Field label="Confirm password" type="password" autoComplete="new-password" placeholder="Type it again" {...form.register("rePassword")} error={form.formState.errors.rePassword?.message} />
        <FormError message={mutation.error ? getApiError(mutation.error) : ""} />
        <button
          disabled={mutation.isPending}
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-leaf px-5 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60"
        >
          {mutation.isPending ? "Creating account…" : "Create account"} {!mutation.isPending && <ArrowRight size={17} />}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        Already a member?{" "}
        <Link to="/login" className="font-bold text-leaf hover:underline">
          Sign in
        </Link>
      </p>
    </AuthBackdrop>
  );
}

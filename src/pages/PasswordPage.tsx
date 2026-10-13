import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { changePassword, getApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

const schema = z
  .object({ password: z.string().min(1, "Enter your current password."), newPassword: z.string().min(6, "Use at least 6 characters."), confirm: z.string().min(1, "Confirm your new password.") })
  .refine((v) => v.newPassword === v.confirm, { path: ["confirm"], message: "The new passwords do not match." });
type Values = z.infer<typeof schema>;

export function PasswordPage() {
  const { signInWith } = useAuth();
  const form = useForm<Values>({ resolver: zodResolver(schema) });
  const mutation = useMutation({
    mutationFn: (values: Values) => changePassword(values.password, values.newPassword),
    onSuccess: (payload) => {
      if (payload.token) signInWith(payload);
      form.reset();
    },
  });
  return (
    <section className="soft-shadow mx-auto max-w-xl rounded-[28px] border border-emerald-950/5 bg-white p-6 sm:p-8">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-mint text-leaf">
        <KeyRound size={20} />
      </span>
      <h1 className="mt-4 font-display text-2xl font-extrabold">Change password</h1>
      <p className="mt-2 text-sm leading-6 text-muted">Confirm your current password, then choose a new one.</p>
      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        {(
          [
            ["password", "Current password"],
            ["newPassword", "New password"],
            ["confirm", "Confirm new password"],
          ] as const
        ).map(([name, label]) => (
          <label key={name} className="block">
            <span className="mb-2 block text-xs font-bold">{label}</span>
            <input
              type="password"
              autoComplete={name === "password" ? "current-password" : "new-password"}
              className="focus-ring w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none"
              {...form.register(name)}
            />
            {form.formState.errors[name] && (
              <span role="alert" className="mt-1 block text-xs text-rose-600">
                {form.formState.errors[name]?.message}
              </span>
            )}
          </label>
        ))}
        {mutation.isSuccess && (
          <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
            Password changed successfully.
          </p>
        )}
        {mutation.error && (
          <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            {getApiError(mutation.error)}
          </p>
        )}
        <button disabled={mutation.isPending} className="rounded-xl bg-leaf px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
          {mutation.isPending ? "Updating…" : "Update password"}
        </button>
      </form>
    </section>
  );
}

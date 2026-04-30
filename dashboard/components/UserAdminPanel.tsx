import { FormEvent, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { createInvitation } from "../lib/api";
import type { Invitation, UserRole } from "../lib/types";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type Props = {
  token: string;
};

export function UserAdminPanel({ token }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("traffic_monitor");
  const [pendingInvite, setPendingInvite] = useState<{
    email: string;
    role: UserRole;
  } | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const validateEmail = (value: string) => {
    const normalizedEmail = value.trim().toLowerCase();
    if (!normalizedEmail) {
      return "Email address is required.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return "Enter a valid email address.";
    }
    return null;
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const nextEmailError = validateEmail(normalizedEmail);
    setEmailError(nextEmailError);
    setError(null);
    setSuccess(null);
    setInvitation(null);
    if (nextEmailError) {
      return;
    }

    setPendingInvite({ email: normalizedEmail, role });
  };

  const confirmInvite = async () => {
    if (!pendingInvite) {
      return;
    }
    try {
      setSending(true);
      setError(null);
      setSuccess(null);
      const createdInvitation = await createInvitation(
        pendingInvite.email,
        pendingInvite.role,
        token,
      );
      setInvitation(createdInvitation);
      setSuccess(
        createdInvitation.email_sent
          ? `Invitation email sent to ${createdInvitation.email}.`
          : "Invitation created. SMTP email was not sent, so use the registration link below.",
      );
      setEmail("");
      setEmailError(null);
      setPendingInvite(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invitation failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="border-b bg-card px-6 py-3">
      <form className="grid gap-2 lg:grid-cols-[minmax(220px,1fr)_180px_110px]" noValidate onSubmit={submit}>
        <div>
          <Input
            type="email"
            value={email}
            onBlur={(event) => setEmailError(validateEmail(event.target.value))}
            onChange={(event) => {
              setEmail(event.target.value);
              if (emailError) {
                setEmailError(validateEmail(event.target.value));
              }
            }}
            placeholder="user@example.com"
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? "invite-email-error" : undefined}
            required
          />
          {emailError ? (
            <p id="invite-email-error" className="mt-1 text-xs text-destructive">
              {emailError}
            </p>
          ) : null}
        </div>
        <Select value={role} onValueChange={(value) => value && setRole(value as UserRole)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="traffic_monitor">Traffic monitor</SelectItem>
            <SelectItem value="police">Police</SelectItem>
            <SelectItem value="fire_fighter">Fire fighter</SelectItem>
            <SelectItem value="super_admin">Super admin</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={sending}>
          {sending ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <Send size={16} aria-hidden="true" />
          )}
          <span>{sending ? "Sending..." : "Invite"}</span>
        </Button>
      </form>
      {error ? (
        <Alert variant="destructive" className="mt-3">
          <AlertTitle>Invitation failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {success ? (
        <Alert className="mt-3 border-emerald-200 bg-emerald-50 text-emerald-900">
          <AlertTitle>Invitation ready</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}
      {invitation ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>
            {invitation.email_sent
              ? `Invitation email sent to ${invitation.email}`
              : "Invitation created; SMTP email was not sent"}
          </span>
          <code className="rounded-md border bg-muted px-2 py-1 text-xs text-foreground">
            {invitation.registration_url ?? invitation.token}
          </code>
        </div>
      ) : null}

      {pendingInvite ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border bg-popover p-5 text-popover-foreground shadow-lg">
            <h3 className="text-lg font-semibold">Send invitation?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Send an invitation email to <strong>{pendingInvite.email}</strong> as{" "}
              <strong>{roleLabel(pendingInvite.role)}</strong>?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                disabled={sending}
                onClick={() => setPendingInvite(null)}
              >
                No
              </Button>
              <Button type="button" disabled={sending} onClick={confirmInvite}>
                {sending ? (
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                ) : null}
                <span>{sending ? "Sending..." : "Yes"}</span>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function roleLabel(role: UserRole) {
  const labels = {
    super_admin: "Super admin",
    traffic_monitor: "Traffic monitor",
    police: "Police",
    fire_fighter: "Fire fighter",
  } as const;

  return labels[role];
}

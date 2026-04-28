import { FormEvent, useState } from "react";
import { Send } from "lucide-react";
import { createInvitation } from "../lib/api";
import type { Invitation, UserRole } from "../lib/types";
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
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setError(null);
      setInvitation(await createInvitation(email, role, token));
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invitation failed");
    }
  };

  return (
    <section className="border-b bg-card px-6 py-3">
      <form className="grid gap-2 lg:grid-cols-[minmax(220px,1fr)_180px_110px]" onSubmit={submit}>
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="user@example.com"
          required
        />
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
        <Button type="submit">
          <Send size={16} />
          <span>Invite</span>
        </Button>
      </form>
      {error ? (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {invitation ? (
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <span>Invitation token</span>
          <code className="rounded-md border bg-muted px-2 py-1 text-xs text-foreground">
            {invitation.token}
          </code>
        </div>
      ) : null}
    </section>
  );
}

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";
import { createInvitation } from "../lib/api";
import type { Invitation, UserRole } from "../lib/types";

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
    <section className="admin-panel">
      <form onSubmit={submit}>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="user@example.com"
          required
        />
        <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
          <option value="traffic_monitor">Traffic monitor</option>
          <option value="police">Police</option>
          <option value="fire_fighter">Fire fighter</option>
          <option value="super_admin">Super admin</option>
        </select>
        <button type="submit">
          <Send size={16} />
          <span>Invite</span>
        </button>
      </form>
      {error ? <div className="form-error">{error}</div> : null}
      {invitation ? (
        <div className="invite-token">
          <span>Invitation token</span>
          <code>{invitation.token}</code>
        </div>
      ) : null}
    </section>
  );
}

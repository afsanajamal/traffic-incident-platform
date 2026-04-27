import { FormEvent, useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { login, registerWithInvite } from "../lib/api";
import type { AuthResponse } from "../lib/types";

type Props = {
  onAuthenticated: (auth: AuthResponse) => void;
};

export function AuthPanel({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin12345");
  const [fullName, setFullName] = useState("");
  const [invitationToken, setInvitationToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setError(null);
      if (mode === "register") {
        await registerWithInvite(invitationToken, fullName, password);
      }
      const auth = await login(email, password);
      onAuthenticated(auth);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    }
  };

  return (
    <main className="auth-shell">
      <form className="auth-panel" onSubmit={submit}>
        <div>
          <h1>{mode === "login" ? "Sign in" : "Register from invite"}</h1>
          <p>Traffic incident operations access</p>
        </div>

        {mode === "register" ? (
          <>
            <input
              value={invitationToken}
              onChange={(event) => setInvitationToken(event.target.value)}
              placeholder="Invitation token"
              required
            />
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Full name"
              required
            />
          </>
        ) : null}

        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          required
        />

        {error ? <div className="form-error">{error}</div> : null}

        <button type="submit">
          {mode === "login" ? <LogIn size={16} /> : <UserPlus size={16} />}
          <span>{mode === "login" ? "Sign in" : "Register and sign in"}</span>
        </button>

        <button
          className="secondary-button"
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Use invitation token" : "Back to sign in"}
        </button>
      </form>
    </main>
  );
}

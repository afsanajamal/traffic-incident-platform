import { FormEvent, useEffect, useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { login, registerWithInvite } from "../lib/api";
import type { AuthResponse } from "../lib/types";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Input } from "./ui/input";

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

  useEffect(() => {
    const inviteToken = new URLSearchParams(window.location.search).get("invite");
    if (!inviteToken) {
      return;
    }
    setMode("register");
    setInvitationToken(inviteToken);
    setEmail("");
    setPassword("");
  }, []);

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
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-semibold">
            {mode === "login" ? "Sign in" : "Register from invite"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Traffic incident operations access
          </p>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={submit}>

        {mode === "register" ? (
          <>
            <Input
              value={invitationToken}
              onChange={(event) => setInvitationToken(event.target.value)}
              placeholder="Invitation token"
              required
            />
            <Input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Full name"
              required
            />
          </>
        ) : null}

        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          required
        />
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          required
        />

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <Button type="submit">
          {mode === "login" ? <LogIn size={16} /> : <UserPlus size={16} />}
          <span>{mode === "login" ? "Sign in" : "Register and sign in"}</span>
        </Button>

        <Button
          variant="secondary"
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Use invitation token" : "Back to sign in"}
        </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

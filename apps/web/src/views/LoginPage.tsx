import { useMemo, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SearchParams = {
  next?: string;
  role?: "WAITER" | "KITCHEN" | "BAR" | "ADMIN";
};

export function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as SearchParams;

  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nextPath = useMemo(() => {
    // Ensure nextPath is always a valid string path
    if (typeof search.next === "string" && search.next.startsWith("/")) {
      return search.next;
    }
    return "/";
  }, [search.next]);

  // Extract just the route path (e.g., "/waiter?foo=bar" -> "/waiter")
  const nextRoute = useMemo(() => {
    if (!nextPath || nextPath === "/") return "/";
    // Remove query params but keep the leading slash
    return "/" + nextPath.replace(/^\//, "").split("?")[0];
  }, [nextPath]);

  async function login() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name: name.trim(), pin })
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Login failed");
      }

      const data = (await res.json()) as { user: { role: SearchParams["role"] } };
      if (search.role && data.user.role !== search.role) {
        throw new Error(`Wrong role. You logged in as ${data.user.role}.`);
      }

      // Navigate to the next route
      await navigate({ to: nextRoute });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await navigate({ to: "/login", search: { next: nextRoute, role: search.role } });
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md items-center p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>FestFlow</CardTitle>
          <div className="text-sm text-muted-foreground">Login with name + PIN.</div>
          {search.role ? <div className="text-xs text-muted-foreground">Role: {search.role}</div> : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {error ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <Input
            placeholder="Name (e.g. Mia)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoCapitalize="words"
            autoCorrect="off"
          />
          <Input
            placeholder="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
          />

          <Button className="w-full" disabled={!name.trim() || !pin || loading} onClick={() => void login()}>
            {loading ? "Logging in…" : "Login"}
          </Button>
          <Button className="w-full" variant="secondary" onClick={() => void logout()}>
            Logout
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

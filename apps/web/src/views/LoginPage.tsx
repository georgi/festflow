import { useMemo, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";

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
    if (typeof search.next === "string" && search.next.startsWith("/")) return search.next;
    return "/";
  }, [search.next]);

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

      await navigate({ to: nextPath });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await navigate({ to: "/login", search: { next: nextPath, role: search.role } });
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-3xl font-semibold">FestFlow</h1>
      <p className="mt-2 text-slate-300">Login with name + PIN.</p>
      {search.role ? <p className="mt-1 text-sm text-slate-400">Role: {search.role}</p> : null}

      {error ? (
        <div className="mt-4 rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        <input
          className="w-full rounded-xl bg-slate-950 px-4 py-3 text-slate-200 placeholder:text-slate-500"
          placeholder="Name (e.g. Mia)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoCapitalize="words"
          autoCorrect="off"
        />
        <input
          className="w-full rounded-xl bg-slate-950 px-4 py-3 text-slate-200 placeholder:text-slate-500"
          placeholder="PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
        />

        <button
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-emerald-50 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-200"
          type="button"
          disabled={!name.trim() || !pin || loading}
          onClick={() => void login()}
        >
          {loading ? "Logging in…" : "Login"}
        </button>

        <button
          className="w-full rounded-xl bg-slate-800 px-4 py-3 font-medium hover:bg-slate-700"
          type="button"
          onClick={() => void logout()}
        >
          Logout
        </button>
      </div>
    </main>
  );
}


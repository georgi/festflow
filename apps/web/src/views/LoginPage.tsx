import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, User } from "lucide-react";
import type { LoginUser, Role } from "@/api/types";

const MIN_PIN_LENGTH = 3;

type SearchParams = {
  next?: string;
};

// Determine the best default route based on user's role
function getDefaultRouteForRole(role: Role): string {
  switch (role) {
    case "WAITER":
      return "/waiter";
    case "CASHIER":
      return "/cashier";
    case "KITCHEN":
      return "/kitchen";
    case "BAR":
      return "/bar";
    case "ADMIN":
      return "/admin";
    default:
      return "/";
  }
}

// Check if a user's role allows access to a given route
function canAccessRoute(role: Role, route: string): boolean {
  // Extract the base path (e.g., "/waiter?foo=bar" -> "/waiter")
  const basePath = route.split("?")[0];
  
  switch (basePath) {
    case "/waiter":
      // WAITER and CASHIER can both access waiter page
      return role === "WAITER" || role === "CASHIER";
    case "/cashier":
      // WAITER and CASHIER can both access cashier page
      return role === "WAITER" || role === "CASHIER";
    case "/kitchen":
      return role === "KITCHEN" || role === "ADMIN";
    case "/bar":
      return role === "BAR" || role === "ADMIN";
    case "/admin":
      return role === "ADMIN";
    default:
      return true;
  }
}

export function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as SearchParams;

  // Step 1: User selection, Step 2: PIN entry
  const [step, setStep] = useState<1 | 2>(1);
  const [users, setUsers] = useState<LoginUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<LoginUser | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);

  // Fetch available users on mount
  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/auth/users", {
          headers: { Accept: "application/json" }
        });
        if (!res.ok) throw new Error("Failed to load users");
        const data = (await res.json()) as LoginUser[];
        setUsers(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setFetchingUsers(false);
      }
    }
    void fetchUsers();
  }, []);

  const nextPath = useMemo(() => {
    if (typeof search.next === "string" && search.next.startsWith("/")) {
      return search.next;
    }
    return null;
  }, [search.next]);

  const nextRoute = useMemo(() => {
    if (!nextPath) return null;
    return nextPath.split("?")[0];
  }, [nextPath]);

  function selectUser(user: LoginUser) {
    setSelectedUser(user);
    setStep(2);
    setPin("");
    setError(null);
  }

  function goBack() {
    setStep(1);
    setSelectedUser(null);
    setPin("");
    setError(null);
  }

  async function login() {
    if (!selectedUser) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ userId: selectedUser.id, pin })
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Login failed");
      }

      const data = (await res.json()) as { user: { role: Role } };

      // Determine where to navigate after login
      let targetRoute: string;
      
      if (nextRoute && canAccessRoute(data.user.role, nextRoute)) {
        // If there's a requested next route and user can access it, go there
        targetRoute = nextRoute;
      } else {
        // Otherwise, go to the best default route for their role
        targetRoute = getDefaultRouteForRole(data.user.role);
      }

      await navigate({ to: targetRoute });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setStep(1);
    setSelectedUser(null);
    setPin("");
    setError(null);
  }

  // Step 1: User card selection
  if (step === 1) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center p-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>FestFlow</CardTitle>
            <div className="text-sm text-muted-foreground">Select your account to continue.</div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {fetchingUsers ? (
              <div className="py-8 text-center text-muted-foreground">Loading users…</div>
            ) : users.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No users available.</div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {users.map((user) => (
                  <Button
                    key={user.id}
                    variant="outline"
                    className="flex h-auto flex-col items-center gap-2 p-4"
                    onClick={() => selectUser(user)}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <User className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.role}</div>
                    </div>
                  </Button>
                ))}
              </div>
            )}

            <Button className="w-full" variant="secondary" onClick={() => void logout()}>
              Logout
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Step 2: PIN entry
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md items-center p-6">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Enter PIN</CardTitle>
              <div className="text-sm text-muted-foreground">
                Logging in as <span className="font-medium">{selectedUser?.name}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex items-center justify-center py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              placeholder="Enter your PIN"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && pin.length >= MIN_PIN_LENGTH) {
                  void login();
                }
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
            />
          </div>

          <Button className="w-full" disabled={pin.length < MIN_PIN_LENGTH || loading} onClick={() => void login()}>
            {loading ? "Logging in…" : "Login"}
          </Button>
          <Button className="w-full" variant="secondary" onClick={goBack}>
            Back
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

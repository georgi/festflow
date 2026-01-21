import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPatch, apiPost } from "../api/client";
import type { Bootstrap, MenuCategory, MenuItem, Order, StationType, User } from "../api/types";
import { useRealtime } from "../api/useRealtime";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageShell } from "@/components/layout/PageShell";
import { Section } from "@/components/layout/Section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";

function formatPrice(priceCents: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(priceCents / 100);
}

export function AdminPage() {
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newTableName, setNewTableName] = useState("");
  const [newStationName, setNewStationName] = useState("");
  const [newStationType, setNewStationType] = useState<StationType>("KITCHEN");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategorySortOrder, setNewCategorySortOrder] = useState("0");
  const [newItemName, setNewItemName] = useState("");
  const [newItemPriceCents, setNewItemPriceCents] = useState("0");
  const [newItemCategoryId, setNewItemCategoryId] = useState<string>("");
  const [newItemStationId, setNewItemStationId] = useState<string>("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<User["role"]>("WAITER");
  const [newUserPin, setNewUserPin] = useState("");

  async function refresh() {
    try {
      setError(null);
      const [b, o, u] = await Promise.all([
        apiGet<Bootstrap>("/api/bootstrap"),
        apiGet<Order[]>("/api/orders?status=OPEN"),
        apiGet<User[]>("/api/users")
      ]);
      setBootstrap(b);
      setOrders(o);
      setUsers(u);
      setNewItemCategoryId((prev) => prev || b.categories[0]?.id || "");
      setNewItemStationId((prev) => prev || b.stations[0]?.id || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const realtimeStatus = useRealtime(() => void refresh());

  const openOrders = orders ?? [];
  const openKitchenLines = openOrders.flatMap((o) => o.lines).filter((l) => l.station?.type === "KITCHEN" && l.status !== "DONE" && l.status !== "CANCELED");
  const openBarLines = openOrders.flatMap((o) => o.lines).filter((l) => l.station?.type === "BAR" && l.status !== "DONE" && l.status !== "CANCELED");

  const categories = useMemo(() => {
    if (!bootstrap) return [];
    return [...bootstrap.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [bootstrap]);

  async function createTable() {
    if (!newTableName.trim()) return;
    try {
      await apiPost("/api/tables", { name: newTableName.trim() });
      setNewTableName("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function createStation() {
    if (!newStationName.trim()) return;
    try {
      await apiPost("/api/stations", { name: newStationName.trim(), type: newStationType });
      setNewStationName("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function createCategory() {
    if (!newCategoryName.trim()) return;
    try {
      const sortOrder = Number(newCategorySortOrder || "0");
      await apiPost("/api/menu/categories", { name: newCategoryName.trim(), sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0 });
      setNewCategoryName("");
      setNewCategorySortOrder("0");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function createItem() {
    if (!newItemName.trim()) return;
    if (!newItemCategoryId || !newItemStationId) return;
    try {
      const priceCents = Number(newItemPriceCents || "0");
      await apiPost("/api/menu/items", {
        name: newItemName.trim(),
        priceCents: Number.isFinite(priceCents) ? priceCents : 0,
        categoryId: newItemCategoryId,
        stationId: newItemStationId
      });
      setNewItemName("");
      setNewItemPriceCents("0");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function toggleSoldOut(item: MenuItem) {
    try {
      await apiPatch(`/api/menu/items/${item.id}`, { soldOut: !item.soldOut });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function createUser() {
    if (!newUserName.trim() || !newUserPin) return;
    try {
      await apiPost("/api/users", {
        name: newUserName.trim(),
        role: newUserRole,
        pin: newUserPin
      });
      setNewUserName("");
      setNewUserPin("");
      setNewUserRole("WAITER");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <PageShell
      title="Admin"
      subtitle="Setup and live control for your event."
      actions={
        <>
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
            {realtimeStatus}
          </Badge>
          <Button size="sm" variant="secondary" onClick={() => void refresh()}>
            Refresh
          </Button>
        </>
      }
    >

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Section withDivider={false} title="Live overview" subtitle="Snapshot of current workload.">
        <div className="grid gap-3 md:grid-cols-3">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Open orders</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{openOrders.length}</CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Kitchen backlog</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{openKitchenLines.length}</CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Bar backlog</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{openBarLines.length}</CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Setup" subtitle="Stations and tables used during service.">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Stations</CardTitle>
            <div className="text-xs text-muted-foreground">Create stations and assign them to menu items.</div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Input
                className="flex-1"
                placeholder="Station name"
                value={newStationName}
                onChange={(e) => setNewStationName(e.target.value)}
              />
              <Select value={newStationType} onValueChange={(value) => setNewStationType(value as StationType)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KITCHEN">KITCHEN</SelectItem>
                  <SelectItem value="BAR">BAR</SelectItem>
                  <SelectItem value="OTHER">OTHER</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="secondary" onClick={() => void createStation()}>
                Add
              </Button>
            </div>

          <ul className="mt-3 space-y-2">
            {(bootstrap?.stations ?? []).map((s) => (
              <li key={s.id} className="rounded-xl border bg-muted/40 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.type}</div>
                </div>
              </li>
            ))}
          </ul>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Tables</CardTitle>
            <div className="text-xs text-muted-foreground">Quickly add or disable tables.</div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                className="flex-1"
                placeholder="Table name"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
              />
              <Button variant="secondary" onClick={() => void createTable()}>
                Add
              </Button>
            </div>

          <ul className="mt-3 grid grid-cols-2 gap-2">
            {(bootstrap?.tables ?? []).map((t) => (
              <li key={t.id} className="rounded-xl border bg-muted/40 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.active ? "active" : "disabled"}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      try {
                        await apiPatch(`/api/tables/${t.id}`, { active: !t.active });
                        await refresh();
                      } catch (e) {
                        setError(e instanceof Error ? e.message : String(e));
                      }
                    }}
                  >
                    {t.active ? "Disable" : "Enable"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          </CardContent>
        </Card>
        </div>
      </Section>

      <Section title="Menu" subtitle="Categories, items, and station routing.">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Menu</CardTitle>
            <div className="text-xs text-muted-foreground">Organize categories and items with station routing.</div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold">Menu categories</h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Input
                className="col-span-2"
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <Input
                inputMode="numeric"
                value={newCategorySortOrder}
                onChange={(e) => setNewCategorySortOrder(e.target.value)}
                placeholder="Sort"
              />
              <Button className="col-span-3" variant="secondary" onClick={() => void createCategory()}>
                Add category
              </Button>
            </div>
            <ul className="mt-3 space-y-2">
              {categories.map((c: MenuCategory) => (
                <li key={c.id} className="rounded-xl border bg-muted/40 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">sort {c.sortOrder}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Menu item</h3>
            <div className="mt-3 grid gap-2">
              <Input
                placeholder="Item name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
              <Input
                inputMode="numeric"
                value={newItemPriceCents}
                onChange={(e) => setNewItemPriceCents(e.target.value)}
                placeholder="Price cents"
              />
              <div className="grid grid-cols-2 gap-2">
                <Select value={newItemCategoryId} onValueChange={setNewItemCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(bootstrap?.categories ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newItemStationId} onValueChange={setNewItemStationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Station" />
                  </SelectTrigger>
                  <SelectContent>
                    {(bootstrap?.stations ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="secondary" onClick={() => void createItem()}>
                Add item
              </Button>
            </div>
          </div>
        </CardContent>
          <CardContent className="grid gap-4 md:grid-cols-2">
          {categories.map((c) => {
            const items = (bootstrap?.items ?? []).filter((i) => i.categoryId === c.id);
            return (
              <div key={c.id} className="rounded-xl border bg-muted/40 p-3">
                <div className="font-medium">{c.name}</div>
                <ul className="mt-2 space-y-2">
                  {items.map((item) => (
                    <li key={item.id} className="rounded-xl border bg-background/60 px-3 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.name}</span>
                            {item.soldOut ? (
                              <Badge variant="secondary" className="text-xs">
                                Sold out
                              </Badge>
                            ) : null}
                          </div>
                          <div className="text-xs text-muted-foreground">Station: {item.station?.name ?? item.stationId}</div>
                        </div>
                        <div className="text-sm text-slate-200">{formatPrice(item.priceCents)}</div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => void toggleSoldOut(item)}>
                          Toggle sold out
                        </Button>
                      </div>
                    </li>
                  ))}
                  {items.length === 0 ? <div className="text-sm text-slate-500">No items.</div> : null}
                </ul>
              </div>
            );
          })}
          </CardContent>
        </Card>
      </Section>

      <Section title="Users" subtitle="Create role logins with short PINs.">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <div className="text-xs text-muted-foreground">Create role logins with short PINs.</div>
          </CardHeader>
          <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            <Input
              placeholder="Name"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
            />
          <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as User["role"])}>
            <SelectTrigger>
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WAITER">WAITER</SelectItem>
              <SelectItem value="KITCHEN">KITCHEN</SelectItem>
              <SelectItem value="BAR">BAR</SelectItem>
              <SelectItem value="ADMIN">ADMIN</SelectItem>
            </SelectContent>
          </Select>
            <Input
              placeholder="PIN"
              value={newUserPin}
              onChange={(e) => setNewUserPin(e.target.value)}
              inputMode="numeric"
            />
            <Button className="md:col-span-3" variant="secondary" onClick={() => void createUser()}>
              Add user
            </Button>
          </div>

          <ul className="mt-4 grid gap-2 md:grid-cols-2">
            {(users ?? []).map((u) => (
              <li key={u.id} className="rounded-xl border bg-muted/40 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.role}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{u.active ? "active" : "disabled"}</div>
                </div>
              </li>
            ))}
          </ul>
          </CardContent>
        </Card>
      </Section>
    </PageShell>
  );
}

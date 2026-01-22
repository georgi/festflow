import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
  const [newUserRoles, setNewUserRoles] = useState<Set<string>>(new Set(["WAITER"]));
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
    if (!newUserName.trim() || !newUserPin || newUserRoles.size === 0) return;
    try {
      await apiPost("/api/users", {
        name: newUserName.trim(),
        roles: Array.from(newUserRoles),
        pin: newUserPin
      });
      setNewUserName("");
      setNewUserPin("");
      setNewUserRoles(new Set(["WAITER"]));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <PageShell
      title={t('admin.title')}
      subtitle={t('admin.subtitle')}
      actions={
        <>
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
            {realtimeStatus}
          </Badge>
          <Button size="sm" variant="secondary" onClick={() => void refresh()}>
            {t('admin.refresh')}
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

      <Section withDivider={false} title={t('admin.liveOverview')} subtitle={t('admin.liveOverviewSubtitle')}>
        <div className="grid gap-3 md:grid-cols-3">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.openOrders')}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{openOrders.length}</CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.kitchenBacklog')}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{openKitchenLines.length}</CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.barBacklog')}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{openBarLines.length}</CardContent>
          </Card>
        </div>
      </Section>

      <Section title={t('admin.setup')} subtitle={t('admin.setupSubtitle')}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>{t('admin.stations')}</CardTitle>
            <div className="text-xs text-muted-foreground">{t('admin.stationsDescription')}</div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Input
                className="flex-1"
                placeholder={t('admin.stationName')}
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
                {t('admin.add')}
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
            <CardTitle>{t('admin.tables')}</CardTitle>
            <div className="text-xs text-muted-foreground">{t('admin.tablesDescription')}</div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                className="flex-1"
                placeholder={t('admin.tableName')}
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
              />
              <Button variant="secondary" onClick={() => void createTable()}>
                {t('admin.add')}
              </Button>
            </div>

          <ul className="mt-3 grid grid-cols-2 gap-2">
            {(bootstrap?.tables ?? []).map((table) => (
              <li key={table.id} className="rounded-xl border bg-muted/40 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">{table.name}</div>
                    <div className="text-xs text-muted-foreground">{table.active ? t('admin.active') : t('admin.disabled')}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      try {
                        await apiPatch(`/api/tables/${table.id}`, { active: !table.active });
                        await refresh();
                      } catch (e) {
                        setError(e instanceof Error ? e.message : String(e));
                      }
                    }}
                  >
                    {table.active ? t('admin.disable') : t('admin.enable')}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          </CardContent>
        </Card>
        </div>
      </Section>

      <Section title={t('admin.menu')} subtitle={t('admin.menuSubtitle')}>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>{t('admin.menu')}</CardTitle>
            <div className="text-xs text-muted-foreground">{t('admin.menuDescription')}</div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold">{t('admin.menuCategories')}</h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Input
                className="col-span-2"
                placeholder={t('admin.categoryName')}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <Input
                inputMode="numeric"
                value={newCategorySortOrder}
                onChange={(e) => setNewCategorySortOrder(e.target.value)}
                placeholder={t('admin.sort')}
              />
              <Button className="col-span-3" variant="secondary" onClick={() => void createCategory()}>
                {t('admin.addCategory')}
              </Button>
            </div>
            <ul className="mt-3 space-y-2">
              {categories.map((c: MenuCategory) => (
                <li key={c.id} className="rounded-xl border bg-muted/40 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{t('admin.sort')} {c.sortOrder}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold">{t('admin.menuItem')}</h3>
            <div className="mt-3 grid gap-2">
              <Input
                placeholder={t('admin.itemName')}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
              <Input
                inputMode="numeric"
                value={newItemPriceCents}
                onChange={(e) => setNewItemPriceCents(e.target.value)}
                placeholder={t('admin.priceCents')}
              />
              <div className="grid grid-cols-2 gap-2">
                <Select value={newItemCategoryId} onValueChange={setNewItemCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin.category')} />
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
                    <SelectValue placeholder={t('admin.station')} />
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
                {t('admin.addItem')}
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
                                {t('admin.soldOut')}
                              </Badge>
                            ) : null}
                          </div>
                          <div className="text-xs text-muted-foreground">{t('admin.station')}: {item.station?.name ?? item.stationId}</div>
                        </div>
                        <div className="text-sm text-muted-foreground">{formatPrice(item.priceCents)}</div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => void toggleSoldOut(item)}>
                          {t('admin.toggleSoldOut')}
                        </Button>
                      </div>
                    </li>
                  ))}
                  {items.length === 0 ? <div className="text-sm text-muted-foreground">{t('admin.noItems')}</div> : null}
                </ul>
              </div>
            );
          })}
          </CardContent>
        </Card>
      </Section>

      <Section title={t('admin.users')} subtitle={t('admin.usersSubtitle')}>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>{t('admin.users')}</CardTitle>
            <div className="text-xs text-muted-foreground">{t('admin.usersDescription')}</div>
          </CardHeader>
          <CardContent>
          <div className="grid gap-3">
            <div className="grid gap-2 md:grid-cols-2">
              <Input
                placeholder={t('admin.name')}
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
              <Input
                placeholder={t('login.pin')}
                value={newUserPin}
                onChange={(e) => setNewUserPin(e.target.value)}
                inputMode="numeric"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              {(["WAITER", "CASHIER", "KITCHEN", "BAR", "ADMIN"] as const).map((role) => (
                <label key={role} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border accent-primary"
                    checked={newUserRoles.has(role)}
                    onChange={(e) => {
                      const next = new Set(newUserRoles);
                      if (e.target.checked) {
                        next.add(role);
                      } else {
                        next.delete(role);
                      }
                      setNewUserRoles(next);
                    }}
                  />
                  <span className="text-sm">{role}</span>
                </label>
              ))}
            </div>
            <Button variant="secondary" onClick={() => void createUser()} disabled={newUserRoles.size === 0}>
              {t('admin.addUser')}
            </Button>
          </div>

          <ul className="mt-4 grid gap-2 md:grid-cols-2">
            {(users ?? []).map((u) => (
              <li key={u.id} className="rounded-xl border bg-muted/40 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.roles.join(", ")}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{u.active ? t('admin.active') : t('admin.disabled')}</div>
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

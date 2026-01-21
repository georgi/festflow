import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { apiGet, apiPatch, apiPost } from "../api/client";
import type { Bootstrap, Me, MenuCategory, MenuItem, Order } from "../api/types";
import { useRealtime } from "../api/useRealtime";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageShell } from "@/components/layout/PageShell";
import { Section } from "@/components/layout/Section";
import { AlertCircle, CheckCircle2, Wallet } from "lucide-react";

function formatPrice(priceCents: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(priceCents / 100);
}

function minutesSinceIso(ts: string) {
  const ms = Date.now() - new Date(ts).getTime();
  return Math.max(0, Math.floor(ms / 60_000));
}

type CartLine = { menuItemId: string; qty: number; note?: string };

export function WaiterPage() {
  const [me, setMe] = useState<Me["user"] | null>(null);
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);

  async function refresh() {
    try {
      setError(null);
      const [b, o, meRes] = await Promise.all([
        apiGet<Bootstrap>("/api/bootstrap"),
        apiGet<Order[]>("/api/orders?status=OPEN,DONE&mine=1"),
        apiGet<Me>("/api/auth/me")
      ]);
      setBootstrap(b);
      setOrders(o);
      setMe(meRes.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const realtimeStatus = useRealtime(() => void refresh());

  const categories = useMemo(() => {
    if (!bootstrap) return [];
    return [...bootstrap.categories].filter((c) => c.active).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [bootstrap]);

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    if (!bootstrap) return map;
    for (const item of bootstrap.items) {
      if (!item.active) continue;
      if (item.soldOut) continue;
      const list = map.get(item.categoryId) ?? [];
      list.push(item);
      map.set(item.categoryId, list);
    }
    for (const [key, list] of map.entries()) {
      map.set(
        key,
        [...list].sort((a, b) => a.name.localeCompare(b.name))
      );
    }
    return map;
  }, [bootstrap]);

  const myOpenOrders = useMemo(() => {
    if (!orders) return [];
    return orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders]);

  const cartTotalCents = useMemo(() => {
    if (!bootstrap) return 0;
    const itemById = new Map(bootstrap.items.map((i) => [i.id, i]));
    return cart.reduce((sum, l) => sum + (itemById.get(l.menuItemId)?.priceCents ?? 0) * l.qty, 0);
  }, [bootstrap, cart]);

  async function sendOrder() {
    if (!selectedTableId) return;
    if (cart.length === 0) return;
    if (sending) return; // Prevent double-submits
    setShowSendDialog(false);
    setSending(true);
    setError(null);
    setOrderSuccess(false);
    try {
      await apiPost<Order>("/api/orders", {
        tableId: selectedTableId,
        lines: cart
      });
      setCart([]);
      setOrderSuccess(true);
      // Clear success message after 3 seconds
      setTimeout(() => setOrderSuccess(false), 3000);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <PageShell
      title="Waiter"
      subtitle="Take orders fast and keep an eye on progress."
      actions={
        <>
          <Link to="/cashier">
            <Button size="sm" variant="outline" className="gap-1">
              <Wallet className="h-4 w-4" />
              Open Cashier
            </Button>
          </Link>
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
            {realtimeStatus}
          </Badge>
          <Button size="sm" variant="secondary" onClick={() => void refresh()}>
            Refresh
          </Button>
        </>
      }
    >
      <Section withDivider={false} title="Tables and orders" subtitle="Select a table and review your active orders.">
        <div className="grid gap-6 md:grid-cols-2">
          {error ? (
            <Alert variant="destructive" className="md:col-span-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xl">Select table</CardTitle>
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                tap to start
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {(bootstrap?.tables ?? []).filter((t) => t.active).map((t) => (
                  <Button
                    key={t.id}
                    variant={selectedTableId === t.id ? "default" : "secondary"}
                    className="h-auto items-start px-4 py-3 text-left"
                    type="button"
                    onClick={() => setSelectedTableId(t.id)}
                  >
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {selectedTableId === t.id ? "Selected" : "Tap to start"}
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xl">My orders</CardTitle>
              <div className="text-xs text-muted-foreground">{me?.name ?? ""}</div>
            </CardHeader>
            <CardContent className="space-y-3">
              {myOpenOrders.length === 0 ? (
                <div className="text-sm text-muted-foreground">No orders.</div>
              ) : (
                myOpenOrders.map((o) => (
                  <div
                    key={o.id}
                    className={`rounded-xl border p-3 ${o.status === "DONE" ? "border-success/50 bg-success/10" : "bg-muted/40"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {o.table?.name ?? o.tableId}
                        </span>
                        {o.status === "DONE" ? (
                          <Badge variant="secondary" className="bg-success text-success-foreground text-[10px] uppercase">
                            Ready to serve
                          </Badge>
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground">{minutesSinceIso(o.createdAt)}m</div>
                    </div>
                    <ul className="mt-2 space-y-1 text-sm text-foreground">
                      {o.lines.map((l) => (
                        <li key={l.id} className="flex items-start justify-between gap-3">
                          <div>
                            <span className="font-medium">
                              {l.qty}× {l.menuItem?.name ?? l.menuItemId}
                            </span>
                            {l.note ? (
                              <div className="text-xs text-muted-foreground">Note: {l.note}</div>
                            ) : null}
                          </div>
                          <div className="text-xs text-muted-foreground">{l.status.toLowerCase().replace("_", " ")}</div>
                        </li>
                      ))}
                    </ul>
                    {o.status === "OPEN" ? (
                      <div className="mt-3 flex justify-end">
                        <Button
                          size="sm"
                          variant="secondary"
                          type="button"
                          onClick={async () => {
                            const ok = window.confirm("Cancel this order?");
                            if (!ok) return;
                            try {
                              await apiPatch(`/api/orders/${o.id}/cancel`, { reason: "canceled by waiter" });
                              await refresh();
                            } catch (e) {
                              setError(e instanceof Error ? e.message : String(e));
                            }
                          }}
                        >
                          Cancel order
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Menu" subtitle="Tap items to build the cart.">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xl">Menu</CardTitle>
            <div className="text-sm text-muted-foreground">
              Cart total: {formatPrice(cartTotalCents)}
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
              {categories.map((c: MenuCategory) => (
                <div key={c.id} className="rounded-xl border bg-muted/40 p-3">
                  <div className="font-medium">{c.name}</div>
                  <div className="mt-2 grid gap-2">
                    {(itemsByCategory.get(c.id) ?? []).map((item) => (
                      <Button
                        key={item.id}
                        variant="secondary"
                        className="h-auto items-start px-4 py-3 text-left"
                        type="button"
                        onClick={() => {
                          setCart((prev) => {
                            const next = [...prev];
                            const existing = next.find((l) => l.menuItemId === item.id && !l.note);
                            if (existing) {
                              existing.qty += 1;
                              return next;
                            }
                            next.push({ menuItemId: item.id, qty: 1 });
                            return next;
                          });
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">{formatPrice(item.priceCents)}</div>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Station: {item.station?.name ?? item.stationId}
                        </div>
                      </Button>
                    ))}
                    {(itemsByCategory.get(c.id) ?? []).length === 0 ? (
                      <div className="text-sm text-muted-foreground">No items.</div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <aside className="rounded-xl border bg-muted/40 p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">Cart</div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setCart([])}
                  disabled={cart.length === 0}
                >
                  Clear
                </Button>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Table: {selectedTableId ? (bootstrap?.tables.find((t) => t.id === selectedTableId)?.name ?? selectedTableId) : "—"}
              </div>

              <ul className="mt-3 space-y-2">
                {cart.map((l, idx) => {
                  const item = bootstrap?.items.find((i) => i.id === l.menuItemId);
                  return (
                    <li key={`${l.menuItemId}-${idx}`} className="rounded-xl border bg-background/60 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-medium">{item?.name ?? l.menuItemId}</div>
                        <div className="text-sm text-muted-foreground">{item ? formatPrice(item.priceCents * l.qty) : ""}</div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => setCart((prev) => prev.map((x, i) => (i === idx ? { ...x, qty: Math.max(1, x.qty - 1) } : x)))}
                        >
                          −
                        </Button>
                        <div className="min-w-10 text-center text-sm">{l.qty}</div>
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => setCart((prev) => prev.map((x, i) => (i === idx ? { ...x, qty: x.qty + 1 } : x)))}
                        >
                          +
                        </Button>
                        <Button
                          className="ml-auto"
                          size="sm"
                          variant="secondary"
                          onClick={() => setCart((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          Remove
                        </Button>
                      </div>
                      <Textarea
                        className="mt-2"
                        placeholder="Note (optional)"
                        value={l.note ?? ""}
                        onChange={(e) => {
                          const note = e.target.value;
                          setCart((prev) => prev.map((x, i) => (i === idx ? { ...x, note: note || undefined } : x)));
                        }}
                      />
                    </li>
                  );
                })}
                {cart.length === 0 ? <div className="text-sm text-muted-foreground">Empty.</div> : null}
              </ul>

              {orderSuccess ? (
                <Alert variant="success" className="mt-4">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>Order sent successfully!</AlertDescription>
                </Alert>
              ) : null}

              <Button
                className="mt-4 w-full"
                type="button"
                disabled={!selectedTableId || cart.length === 0 || sending}
                onClick={() => setShowSendDialog(true)}
              >
                {sending ? "Sending…" : "Send order"}
              </Button>
            </aside>
          </CardContent>
        </Card>
      </Section>

      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send order?</DialogTitle>
            <DialogDescription>
              You're about to send {cart.length} item{cart.length !== 1 ? 's' : ''} to the kitchen/bar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowSendDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => void sendOrder()}>
              Send order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

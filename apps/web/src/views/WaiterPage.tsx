import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../api/client";
import type { Bootstrap, Me, MenuCategory, MenuItem, Order } from "../api/types";
import { useRealtime } from "../api/useRealtime";

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

  async function refresh() {
    try {
      setError(null);
      const [b, o, meRes] = await Promise.all([
        apiGet<Bootstrap>("/api/bootstrap"),
        apiGet<Order[]>("/api/orders?status=OPEN&mine=1"),
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

  useRealtime(() => void refresh());

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
    setSending(true);
    setError(null);
    try {
      await apiPost<Order>("/api/orders", {
        tableId: selectedTableId,
        lines: cart
      });
      setCart([]);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto grid max-w-5xl gap-6 p-4 md:grid-cols-2">
      {error ? (
        <div className="md:col-span-2 rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Select table</h2>
          <button
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
            type="button"
            onClick={() => void refresh()}
          >
            Refresh
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(bootstrap?.tables ?? []).filter((t) => t.active).map((t) => (
            <button
              key={t.id}
              className={[
                "rounded-xl px-4 py-3 text-left",
                selectedTableId === t.id ? "bg-slate-700" : "bg-slate-800 hover:bg-slate-700"
              ].join(" ")}
              type="button"
              onClick={() => setSelectedTableId(t.id)}
            >
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-slate-400">{selectedTableId === t.id ? "Selected" : "Tap to start"}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">My open orders</h2>
          <div className="text-xs text-slate-400">{me?.name ?? ""}</div>
        </div>
        <div className="mt-3 space-y-3">
          {myOpenOrders.length === 0 ? (
            <div className="text-sm text-slate-400">No open orders.</div>
          ) : (
            myOpenOrders.map((o) => (
              <div key={o.id} className="rounded-xl bg-slate-800/60 p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {o.table?.name ?? o.tableId}
                  </div>
                  <div className="text-xs text-slate-300">{minutesSinceIso(o.createdAt)}m</div>
                </div>
                <ul className="mt-2 space-y-1 text-sm text-slate-200">
                  {o.lines.map((l) => {
                    return (
                      <li key={l.id} className="flex items-start justify-between gap-3">
                        <div>
                          <span className="font-medium">
                            {l.qty}× {l.menuItem?.name ?? l.menuItemId}
                          </span>
                          {l.note ? (
                            <div className="text-xs text-slate-400">Note: {l.note}</div>
                          ) : null}
                        </div>
                        <div className="text-xs text-slate-400">{l.status.toLowerCase().replace("_", " ")}</div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 md:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Menu</h2>
          <div className="text-sm text-slate-300">
            Cart total: {formatPrice(cartTotalCents)}
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
            {categories.map((c: MenuCategory) => (
              <div key={c.id} className="rounded-xl bg-slate-800/40 p-3">
                <div className="font-medium">{c.name}</div>
                <div className="mt-2 grid gap-2">
                  {(itemsByCategory.get(c.id) ?? []).map((item) => (
                    <button
                      key={item.id}
                      className="rounded-xl bg-slate-800 px-4 py-3 text-left hover:bg-slate-700"
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
                        <div className="text-sm text-slate-300">{formatPrice(item.priceCents)}</div>
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        Station: {item.station?.name ?? item.stationId}
                      </div>
                    </button>
                  ))}
                  {(itemsByCategory.get(c.id) ?? []).length === 0 ? (
                    <div className="text-sm text-slate-500">No items.</div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <aside className="rounded-xl bg-slate-800/40 p-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">Cart</div>
              <button
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                type="button"
                onClick={() => setCart([])}
                disabled={cart.length === 0}
              >
                Clear
              </button>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Table: {selectedTableId ? (bootstrap?.tables.find((t) => t.id === selectedTableId)?.name ?? selectedTableId) : "—"}
            </div>

            <ul className="mt-3 space-y-2">
              {cart.map((l, idx) => {
                const item = bootstrap?.items.find((i) => i.id === l.menuItemId);
                return (
                  <li key={`${l.menuItemId}-${idx}`} className="rounded-xl bg-slate-900/50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-medium">{item?.name ?? l.menuItemId}</div>
                      <div className="text-sm text-slate-300">{item ? formatPrice(item.priceCents * l.qty) : ""}</div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        className="rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
                        type="button"
                        onClick={() => setCart((prev) => prev.map((x, i) => (i === idx ? { ...x, qty: Math.max(1, x.qty - 1) } : x)))}
                      >
                        −
                      </button>
                      <div className="min-w-10 text-center text-sm">{l.qty}</div>
                      <button
                        className="rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
                        type="button"
                        onClick={() => setCart((prev) => prev.map((x, i) => (i === idx ? { ...x, qty: x.qty + 1 } : x)))}
                      >
                        +
                      </button>
                      <button
                        className="ml-auto rounded-lg bg-slate-900 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                        type="button"
                        onClick={() => setCart((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      className="mt-2 w-full rounded-lg bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500"
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
              {cart.length === 0 ? <div className="text-sm text-slate-500">Empty.</div> : null}
            </ul>

            <button
              className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-emerald-50 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-200"
              type="button"
              disabled={!selectedTableId || cart.length === 0 || sending}
              onClick={() => void sendOrder()}
            >
              {sending ? "Sending…" : "Send order"}
            </button>
          </aside>
        </div>
      </section>
    </main>
  );
}

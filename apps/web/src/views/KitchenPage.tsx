import { useEffect, useState } from "react";
import { apiGet, apiPatch } from "../api/client";
import type { Order, OrderLineStatus } from "../api/types";
import { useRealtime } from "../api/useRealtime";

export function KitchenPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setError(null);
      setOrders(await apiGet<Order[]>("/api/board?stationType=KITCHEN"));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useRealtime(() => void refresh());

  async function setLineStatus(lineId: string, status: OrderLineStatus) {
    try {
      await apiPatch(`/api/order-lines/${lineId}/status`, { status });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-semibold">Kitchen board</h2>
        <div className="text-sm text-slate-400">{orders?.length ?? 0} active</div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {error ? (
          <div className="md:col-span-2 rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {!orders || orders.length === 0 ? (
          <div className="text-sm text-slate-400">No kitchen items.</div>
        ) : (
          orders.map((order) => (
            <section key={order.id} className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">
                    {order.table?.name ?? order.tableId}
                  </div>
                  <div className="text-xs text-slate-400">Order {order.id} · Waiter {order.createdByName}</div>
                </div>
                <div className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
                  {Math.max(0, Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60_000))}m
                </div>
              </div>

              <ul className="mt-3 space-y-2">
                {order.lines.map((l) => {
                  return (
                    <li key={l.id} className="rounded-xl bg-slate-800/60 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium">
                          {l.qty}× {l.menuItem?.name ?? l.menuItemId}
                        </div>
                        <div className="text-xs text-slate-400">{l.status.toLowerCase().replace("_", " ")}</div>
                      </div>
                      {l.note ? <div className="mt-1 text-xs text-slate-400">Note: {l.note}</div> : null}
                      <div className="mt-3 flex gap-2">
                        <button
                          className="rounded-lg bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600"
                          type="button"
                          onClick={() => void setLineStatus(l.id, "DONE")}
                        >
                          Mark done
                        </button>
                        <button
                          className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                          type="button"
                          onClick={() => void setLineStatus(l.id, "OPEN")}
                        >
                          Undo
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>
    </main>
  );
}

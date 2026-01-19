import { demo, minutesSince } from "../demo/demoData";

export function BarPage() {
  const openBarCards = demo.orders
    .filter((o) => o.status === "open")
    .map((o) => ({
      order: o,
      lines: o.lines.filter((l) => l.stationId === "bar" && l.status !== "done" && l.status !== "canceled")
    }))
    .filter((x) => x.lines.length > 0)
    .sort((a, b) => a.order.createdAtMs - b.order.createdAtMs);

  return (
    <main className="mx-auto max-w-5xl p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-semibold">Bar board</h2>
        <div className="text-sm text-slate-400">{openBarCards.length} active</div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {openBarCards.length === 0 ? (
          <div className="text-sm text-slate-400">No bar items.</div>
        ) : (
          openBarCards.map(({ order, lines }) => (
            <section key={order.id} className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">
                    {demo.tables.find((t) => t.id === order.tableId)?.name ?? order.tableId}
                  </div>
                  <div className="text-xs text-slate-400">Order {order.id} · Waiter {order.createdBy}</div>
                </div>
                <div className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
                  {minutesSince(order.createdAtMs)}m
                </div>
              </div>

              <ul className="mt-3 space-y-2">
                {lines.map((l) => {
                  const item = demo.items.find((i) => i.id === l.menuItemId);
                  return (
                    <li key={l.id} className="rounded-xl bg-slate-800/60 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium">
                          {l.qty}× {item?.name ?? l.menuItemId}
                        </div>
                        <div className="text-xs text-slate-400">{l.status.replace("_", " ")}</div>
                      </div>
                      {l.note ? <div className="mt-1 text-xs text-slate-400">Note: {l.note}</div> : null}
                      <div className="mt-3 flex gap-2">
                        <button
                          className="rounded-lg bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600"
                          type="button"
                        >
                          Mark done
                        </button>
                        <button
                          className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                          type="button"
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

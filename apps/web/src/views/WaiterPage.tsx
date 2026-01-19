import { demo, formatPrice, minutesSince } from "../demo/demoData";

const demoWaiterName = "Mia";

export function WaiterPage() {
  const myOpenOrders = demo.orders
    .filter((o) => o.status === "open" && o.createdBy === demoWaiterName)
    .sort((a, b) => b.createdAtMs - a.createdAtMs);

  const categories = [...demo.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  const itemsByCategory = new Map<string, typeof demo.items>();
  for (const item of demo.items) {
    const list = itemsByCategory.get(item.categoryId) ?? [];
    list.push(item);
    itemsByCategory.set(item.categoryId, list);
  }

  return (
    <main className="mx-auto grid max-w-5xl gap-6 p-4 md:grid-cols-2">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
        <h2 className="text-xl font-semibold">Select table</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {demo.tables.map((t) => (
            <button
              key={t.id}
              className="rounded-xl bg-slate-800 px-4 py-3 text-left hover:bg-slate-700"
              type="button"
            >
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-slate-400">Tap to start</div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">My open orders</h2>
          <div className="text-xs text-slate-400">{demoWaiterName}</div>
        </div>
        <div className="mt-3 space-y-3">
          {myOpenOrders.length === 0 ? (
            <div className="text-sm text-slate-400">No open orders.</div>
          ) : (
            myOpenOrders.map((o) => (
              <div key={o.id} className="rounded-xl bg-slate-800/60 p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {demo.tables.find((t) => t.id === o.tableId)?.name ?? o.tableId}
                  </div>
                  <div className="text-xs text-slate-300">{minutesSince(o.createdAtMs)}m</div>
                </div>
                <ul className="mt-2 space-y-1 text-sm text-slate-200">
                  {o.lines.map((l) => {
                    const item = demo.items.find((i) => i.id === l.menuItemId);
                    return (
                      <li key={l.id} className="flex items-start justify-between gap-3">
                        <div>
                          <span className="font-medium">
                            {l.qty}× {item?.name ?? l.menuItemId}
                          </span>
                          {l.note ? (
                            <div className="text-xs text-slate-400">Note: {l.note}</div>
                          ) : null}
                        </div>
                        <div className="text-xs text-slate-400">{l.status.replace("_", " ")}</div>
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
        <h2 className="text-xl font-semibold">Menu</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {categories.map((c) => (
            <div key={c.id} className="rounded-xl bg-slate-800/40 p-3">
              <div className="font-medium">{c.name}</div>
              <div className="mt-2 grid gap-2">
                {(itemsByCategory.get(c.id) ?? []).map((item) => (
                  <button
                    key={item.id}
                    className={[
                      "rounded-xl px-4 py-3 text-left",
                      item.soldOut ? "bg-slate-900 text-slate-500" : "bg-slate-800 hover:bg-slate-700"
                    ].join(" ")}
                    type="button"
                    disabled={item.soldOut}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-slate-300">{formatPrice(item.priceCents)}</div>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {item.soldOut ? "Sold out" : `Station: ${item.stationId}`}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

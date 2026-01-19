import { demo, formatPrice } from "../demo/demoData";

export function AdminPage() {
  const openOrders = demo.orders.filter((o) => o.status === "open");
  const openKitchenLines = openOrders.flatMap((o) => o.lines).filter((l) => l.stationId === "kitchen" && l.status !== "done" && l.status !== "canceled");
  const openBarLines = openOrders.flatMap((o) => o.lines).filter((l) => l.stationId === "bar" && l.status !== "done" && l.status !== "canceled");

  const categories = [...demo.categories].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <main className="mx-auto max-w-5xl p-4">
      <h2 className="text-2xl font-semibold">Admin</h2>

      <section className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
          <div className="text-sm text-slate-400">Open orders</div>
          <div className="mt-1 text-3xl font-semibold">{openOrders.length}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
          <div className="text-sm text-slate-400">Kitchen backlog</div>
          <div className="mt-1 text-3xl font-semibold">{openKitchenLines.length}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
          <div className="text-sm text-slate-400">Bar backlog</div>
          <div className="mt-1 text-3xl font-semibold">{openBarLines.length}</div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Stations</h3>
            <button className="rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700" type="button">
              Add station
            </button>
          </div>
          <ul className="mt-3 space-y-2">
            {demo.stations.map((s) => (
              <li key={s.id} className="rounded-xl bg-slate-800/60 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-slate-400">{s.id}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Tables</h3>
            <button className="rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700" type="button">
              Add table
            </button>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {demo.tables.map((t) => (
              <li key={t.id} className="rounded-xl bg-slate-800/60 px-3 py-2">
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-slate-400">{t.id}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Menu</h3>
          <div className="flex gap-2">
            <button className="rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700" type="button">
              Add category
            </button>
            <button className="rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700" type="button">
              Add item
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {categories.map((c) => {
            const items = demo.items.filter((i) => i.categoryId === c.id);
            return (
              <div key={c.id} className="rounded-xl bg-slate-800/40 p-3">
                <div className="font-medium">{c.name}</div>
                <ul className="mt-2 space-y-2">
                  {items.map((item) => (
                    <li key={item.id} className="rounded-xl bg-slate-800/60 px-3 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">
                            {item.name}{" "}
                            {item.soldOut ? (
                              <span className="ml-2 rounded-full bg-slate-900 px-2 py-0.5 text-xs text-slate-400">
                                sold out
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs text-slate-400">Station: {item.stationId}</div>
                        </div>
                        <div className="text-sm text-slate-200">{formatPrice(item.priceCents)}</div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button
                          className="rounded-lg bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600"
                          type="button"
                        >
                          Toggle sold out
                        </button>
                        <button
                          className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                          type="button"
                        >
                          Edit
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

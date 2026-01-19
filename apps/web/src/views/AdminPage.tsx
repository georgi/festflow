import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPatch, apiPost } from "../api/client";
import type { Bootstrap, MenuCategory, MenuItem, Order, StationType } from "../api/types";
import { useRealtime } from "../api/useRealtime";

function formatPrice(priceCents: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(priceCents / 100);
}

export function AdminPage() {
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
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

  async function refresh() {
    try {
      setError(null);
      const [b, o] = await Promise.all([
        apiGet<Bootstrap>("/api/bootstrap"),
        apiGet<Order[]>("/api/orders?status=OPEN")
      ]);
      setBootstrap(b);
      setOrders(o);
      setNewItemCategoryId((prev) => prev || b.categories[0]?.id || "");
      setNewItemStationId((prev) => prev || b.stations[0]?.id || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useRealtime(() => void refresh());

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

  return (
    <main className="mx-auto max-w-5xl p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Admin</h2>
        <button className="rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700" type="button" onClick={() => void refresh()}>
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

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
          <h3 className="text-lg font-semibold">Stations</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              className="flex-1 rounded-lg bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500"
              placeholder="Station name"
              value={newStationName}
              onChange={(e) => setNewStationName(e.target.value)}
            />
            <select
              className="rounded-lg bg-slate-950 px-3 py-2 text-sm text-slate-200"
              value={newStationType}
              onChange={(e) => setNewStationType(e.target.value as StationType)}
            >
              <option value="KITCHEN">KITCHEN</option>
              <option value="BAR">BAR</option>
              <option value="OTHER">OTHER</option>
            </select>
            <button className="rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700" type="button" onClick={() => void createStation()}>
              Add
            </button>
          </div>

          <ul className="mt-3 space-y-2">
            {(bootstrap?.stations ?? []).map((s) => (
              <li key={s.id} className="rounded-xl bg-slate-800/60 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-slate-400">{s.type}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
          <h3 className="text-lg font-semibold">Tables</h3>
          <div className="mt-3 flex gap-2">
            <input
              className="flex-1 rounded-lg bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500"
              placeholder="Table name"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
            />
            <button className="rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700" type="button" onClick={() => void createTable()}>
              Add
            </button>
          </div>

          <ul className="mt-3 grid grid-cols-2 gap-2">
            {(bootstrap?.tables ?? []).map((t) => (
              <li key={t.id} className="rounded-xl bg-slate-800/60 px-3 py-2">
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-slate-400">{t.active ? "active" : "disabled"}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold">Menu categories</h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <input
                className="col-span-2 rounded-lg bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500"
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <input
                className="rounded-lg bg-slate-950 px-3 py-2 text-sm text-slate-200"
                inputMode="numeric"
                value={newCategorySortOrder}
                onChange={(e) => setNewCategorySortOrder(e.target.value)}
                placeholder="Sort"
              />
              <button
                className="col-span-3 rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
                type="button"
                onClick={() => void createCategory()}
              >
                Add category
              </button>
            </div>
            <ul className="mt-3 space-y-2">
              {categories.map((c: MenuCategory) => (
                <li key={c.id} className="rounded-xl bg-slate-800/60 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-slate-400">sort {c.sortOrder}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Menu item</h3>
            <div className="mt-3 grid gap-2">
              <input
                className="rounded-lg bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500"
                placeholder="Item name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
              <input
                className="rounded-lg bg-slate-950 px-3 py-2 text-sm text-slate-200"
                inputMode="numeric"
                value={newItemPriceCents}
                onChange={(e) => setNewItemPriceCents(e.target.value)}
                placeholder="Price cents"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="rounded-lg bg-slate-950 px-3 py-2 text-sm text-slate-200"
                  value={newItemCategoryId}
                  onChange={(e) => setNewItemCategoryId(e.target.value)}
                >
                  {(bootstrap?.categories ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-lg bg-slate-950 px-3 py-2 text-sm text-slate-200"
                  value={newItemStationId}
                  onChange={(e) => setNewItemStationId(e.target.value)}
                >
                  {(bootstrap?.stations ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <button className="rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700" type="button" onClick={() => void createItem()}>
                Add item
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {categories.map((c) => {
            const items = (bootstrap?.items ?? []).filter((i) => i.categoryId === c.id);
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
                          <div className="text-xs text-slate-400">Station: {item.station?.name ?? item.stationId}</div>
                        </div>
                        <div className="text-sm text-slate-200">{formatPrice(item.priceCents)}</div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button
                          className="rounded-lg bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600"
                          type="button"
                          onClick={() => void toggleSoldOut(item)}
                        >
                          Toggle sold out
                        </button>
                      </div>
                    </li>
                  ))}
                  {items.length === 0 ? <div className="text-sm text-slate-500">No items.</div> : null}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

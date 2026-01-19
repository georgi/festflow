export type Role = "waiter" | "kitchen" | "bar" | "admin";
export type StationId = "kitchen" | "bar";

export type Table = {
  id: string;
  name: string;
};

export type Station = {
  id: StationId;
  name: string;
};

export type MenuCategory = {
  id: string;
  name: string;
  sortOrder: number;
};

export type MenuItem = {
  id: string;
  name: string;
  priceCents: number;
  categoryId: string;
  stationId: StationId;
  soldOut: boolean;
};

export type OrderStatus = "open" | "done" | "canceled";
export type OrderLineStatus = "open" | "in_progress" | "done" | "canceled";

export type OrderLine = {
  id: string;
  menuItemId: string;
  qty: number;
  note?: string;
  stationId: StationId;
  status: OrderLineStatus;
};

export type Order = {
  id: string;
  tableId: string;
  createdBy: string;
  createdAtMs: number;
  status: OrderStatus;
  lines: OrderLine[];
};

const now = Date.now();

export const demo = {
  stations: [
    { id: "kitchen", name: "Kitchen" },
    { id: "bar", name: "Bar" }
  ] satisfies Station[],
  tables: [
    { id: "t-1", name: "Table 1" },
    { id: "t-2", name: "Table 2" },
    { id: "t-3", name: "Table 3" },
    { id: "t-4", name: "Table 4" }
  ] satisfies Table[],
  categories: [
    { id: "cat-food", name: "Food", sortOrder: 1 },
    { id: "cat-drinks", name: "Drinks", sortOrder: 2 }
  ] satisfies MenuCategory[],
  items: [
    {
      id: "m-burger",
      name: "Burger",
      priceCents: 950,
      categoryId: "cat-food",
      stationId: "kitchen",
      soldOut: false
    },
    {
      id: "m-fries",
      name: "Fries",
      priceCents: 350,
      categoryId: "cat-food",
      stationId: "kitchen",
      soldOut: false
    },
    {
      id: "m-salad",
      name: "Salad",
      priceCents: 600,
      categoryId: "cat-food",
      stationId: "kitchen",
      soldOut: true
    },
    {
      id: "m-beer",
      name: "Beer",
      priceCents: 450,
      categoryId: "cat-drinks",
      stationId: "bar",
      soldOut: false
    },
    {
      id: "m-water",
      name: "Water",
      priceCents: 200,
      categoryId: "cat-drinks",
      stationId: "bar",
      soldOut: false
    }
  ] satisfies MenuItem[],
  orders: [
    {
      id: "o-1001",
      tableId: "t-2",
      createdBy: "Mia",
      createdAtMs: now - 11 * 60_000,
      status: "open",
      lines: [
        {
          id: "ol-1",
          menuItemId: "m-burger",
          qty: 2,
          note: "No onions",
          stationId: "kitchen",
          status: "open"
        },
        {
          id: "ol-2",
          menuItemId: "m-beer",
          qty: 2,
          stationId: "bar",
          status: "in_progress"
        }
      ]
    },
    {
      id: "o-1002",
      tableId: "t-1",
      createdBy: "Noah",
      createdAtMs: now - 4 * 60_000,
      status: "open",
      lines: [
        {
          id: "ol-3",
          menuItemId: "m-fries",
          qty: 1,
          stationId: "kitchen",
          status: "in_progress"
        },
        {
          id: "ol-4",
          menuItemId: "m-water",
          qty: 3,
          stationId: "bar",
          status: "open"
        }
      ]
    }
  ] satisfies Order[]
};

export function formatPrice(priceCents: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD"
  }).format(priceCents / 100);
}

export function minutesSince(tsMs: number) {
  return Math.max(0, Math.floor((Date.now() - tsMs) / 60_000));
}


export type Table = { id: string; name: string; active: boolean };

export type StationType = "KITCHEN" | "BAR" | "OTHER";
export type Station = { id: string; name: string; type: StationType; active: boolean };

export type MenuCategory = { id: string; name: string; sortOrder: number; active: boolean };

export type MenuItem = {
  id: string;
  name: string;
  priceCents: number;
  soldOut: boolean;
  active: boolean;
  categoryId: string;
  stationId: string;
  category?: MenuCategory;
  station?: Station;
};

export type OrderStatus = "OPEN" | "DONE" | "CANCELED";
export type OrderLineStatus = "OPEN" | "IN_PROGRESS" | "DONE" | "CANCELED";

export type OrderLine = {
  id: string;
  qty: number;
  note?: string | null;
  status: OrderLineStatus;
  menuItemId: string;
  stationId: string;
  menuItem?: MenuItem;
  station?: Station;
};

export type Order = {
  id: string;
  status: OrderStatus;
  createdAt: string;
  createdByName: string;
  tableId: string;
  table?: Table;
  lines: OrderLine[];
};

export type Bootstrap = {
  tables: Table[];
  stations: Station[];
  categories: MenuCategory[];
  items: MenuItem[];
};

export type Me = { user: { id: string; name: string; role: "WAITER" | "KITCHEN" | "BAR" | "ADMIN" } };

import express from "express";
import { z } from "zod";
import { prisma } from "../db";
import { asyncHandler, sendBadRequest, sendNotFound } from "../lib/http";
import type { RealtimeEvent } from "../realtime";
import { requireAuth, requireRole } from "../auth/middleware";
import { hashPin, verifyPin } from "../auth/pin";
import { clearSessionCookie, setSessionCookie } from "../auth/session";

export function createApiRouter(opts: { broadcast: (event: RealtimeEvent) => void }) {
  const router = express.Router();

  router.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  router.get(
    "/auth/me",
    asyncHandler(async (req, res) => {
      const user = await requireAuth(req, res);
      if (!user) return;
      res.json({ user });
    })
  );

  router.post(
    "/auth/login",
    asyncHandler(async (req, res) => {
      const body = z
        .object({
          name: z.string().min(1),
          pin: z.string().min(3).max(12)
        })
        .safeParse(req.body);
      if (!body.success) return sendBadRequest(res, "Invalid login payload");

      const user = await prisma.user.findUnique({ where: { name: body.data.name } });
      if (!user || !user.active || !user.pinHash) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      if (!verifyPin(body.data.pin, user.pinHash)) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      setSessionCookie(res, { id: user.id });
      res.json({ user: { id: user.id, name: user.name, role: user.role } });
    })
  );

  router.post(
    "/auth/logout",
    asyncHandler(async (_req, res) => {
      clearSessionCookie(res);
      res.json({ ok: true });
    })
  );

  // Users (admin only)
  router.get(
    "/users",
    asyncHandler(async (req, res) => {
      const user = await requireRole(req, res, ["ADMIN"]);
      if (!user) return;
      res.json(await prisma.user.findMany({ orderBy: { name: "asc" } }));
    })
  );

  router.post(
    "/users",
    asyncHandler(async (req, res) => {
      const user = await requireRole(req, res, ["ADMIN"]);
      if (!user) return;
      const body = z
        .object({
          name: z.string().min(1),
          role: z.enum(["WAITER", "KITCHEN", "BAR", "ADMIN"]),
          pin: z.string().min(3).max(12)
        })
        .safeParse(req.body);
      if (!body.success) return sendBadRequest(res, "Invalid user payload");

      const created = await prisma.user.create({
        data: {
          name: body.data.name,
          role: body.data.role,
          pinHash: hashPin(body.data.pin)
        }
      });

      res.status(201).json(created);
    })
  );

  router.get(
    "/bootstrap",
    asyncHandler(async (req, res) => {
      const user = await requireAuth(req, res);
      if (!user) return;
      const [tables, stations, categories, items] = await Promise.all([
        prisma.table.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
        prisma.station.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
        prisma.menuCategory.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
        prisma.menuItem.findMany({
          where: { active: true },
          orderBy: { name: "asc" },
          include: { station: true, category: true }
        })
      ]);

      res.json({ tables, stations, categories, items });
    })
  );

  // Tables
  router.get(
    "/tables",
    asyncHandler(async (_req, res) => {
      const user = await requireRole(_req, res, ["ADMIN"]);
      if (!user) return;
      res.json(await prisma.table.findMany({ orderBy: { name: "asc" } }));
    })
  );

  router.post(
    "/tables",
    asyncHandler(async (req, res) => {
      const user = await requireRole(req, res, ["ADMIN"]);
      if (!user) return;
      const body = z.object({ name: z.string().min(1) }).safeParse(req.body);
      if (!body.success) return sendBadRequest(res, "Invalid table payload");
      const table = await prisma.table.create({ data: { name: body.data.name } });
      opts.broadcast({ type: "db.change", ts: Date.now(), entity: "table", id: table.id });
      res.status(201).json(table);
    })
  );

  router.patch(
    "/tables/:id",
    asyncHandler(async (req, res) => {
      const user = await requireRole(req, res, ["ADMIN"]);
      if (!user) return;
      const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
      const body = z.object({ name: z.string().min(1).optional(), active: z.boolean().optional() }).safeParse(req.body);
      if (!body.success) return sendBadRequest(res, "Invalid table payload");
      const table = await prisma.table.update({ where: { id }, data: body.data });
      opts.broadcast({ type: "db.change", ts: Date.now(), entity: "table", id: table.id });
      res.json(table);
    })
  );

  // Stations
  router.get(
    "/stations",
    asyncHandler(async (_req, res) => {
      const user = await requireRole(_req, res, ["ADMIN"]);
      if (!user) return;
      res.json(await prisma.station.findMany({ orderBy: { name: "asc" } }));
    })
  );

  router.post(
    "/stations",
    asyncHandler(async (req, res) => {
      const user = await requireRole(req, res, ["ADMIN"]);
      if (!user) return;
      const body = z
        .object({
          name: z.string().min(1),
          type: z.enum(["KITCHEN", "BAR", "OTHER"])
        })
        .safeParse(req.body);
      if (!body.success) return sendBadRequest(res, "Invalid station payload");
      const station = await prisma.station.create({ data: body.data });
      opts.broadcast({ type: "db.change", ts: Date.now(), entity: "station", id: station.id });
      res.status(201).json(station);
    })
  );

  router.patch(
    "/stations/:id",
    asyncHandler(async (req, res) => {
      const user = await requireRole(req, res, ["ADMIN"]);
      if (!user) return;
      const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
      const body = z
        .object({
          name: z.string().min(1).optional(),
          type: z.enum(["KITCHEN", "BAR", "OTHER"]).optional(),
          active: z.boolean().optional()
        })
        .safeParse(req.body);
      if (!body.success) return sendBadRequest(res, "Invalid station payload");
      const station = await prisma.station.update({ where: { id }, data: body.data });
      opts.broadcast({ type: "db.change", ts: Date.now(), entity: "station", id: station.id });
      res.json(station);
    })
  );

  // Menu categories
  router.get(
    "/menu/categories",
    asyncHandler(async (_req, res) => {
      const user = await requireRole(_req, res, ["ADMIN"]);
      if (!user) return;
      res.json(await prisma.menuCategory.findMany({ orderBy: { sortOrder: "asc" } }));
    })
  );

  router.post(
    "/menu/categories",
    asyncHandler(async (req, res) => {
      const user = await requireRole(req, res, ["ADMIN"]);
      if (!user) return;
      const body = z
        .object({ name: z.string().min(1), sortOrder: z.number().int().optional() })
        .safeParse(req.body);
      if (!body.success) return sendBadRequest(res, "Invalid category payload");
      const category = await prisma.menuCategory.create({
        data: { name: body.data.name, sortOrder: body.data.sortOrder ?? 0 }
      });
      opts.broadcast({ type: "db.change", ts: Date.now(), entity: "menuCategory", id: category.id });
      res.status(201).json(category);
    })
  );

  router.patch(
    "/menu/categories/:id",
    asyncHandler(async (req, res) => {
      const user = await requireRole(req, res, ["ADMIN"]);
      if (!user) return;
      const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
      const body = z
        .object({
          name: z.string().min(1).optional(),
          sortOrder: z.number().int().optional(),
          active: z.boolean().optional()
        })
        .safeParse(req.body);
      if (!body.success) return sendBadRequest(res, "Invalid category payload");
      const category = await prisma.menuCategory.update({ where: { id }, data: body.data });
      opts.broadcast({ type: "db.change", ts: Date.now(), entity: "menuCategory", id: category.id });
      res.json(category);
    })
  );

  // Menu items
  router.get(
    "/menu/items",
    asyncHandler(async (req, res) => {
      const user = await requireRole(req, res, ["ADMIN"]);
      if (!user) return;
      const includeSoldOut = req.query.includeSoldOut === "1";
      const items = await prisma.menuItem.findMany({
        where: { active: true, ...(includeSoldOut ? {} : { soldOut: false }) },
        orderBy: { name: "asc" },
        include: { station: true, category: true }
      });
      res.json(items);
    })
  );

  router.post(
    "/menu/items",
    asyncHandler(async (req, res) => {
      const user = await requireRole(req, res, ["ADMIN"]);
      if (!user) return;
      const body = z
        .object({
          name: z.string().min(1),
          priceCents: z.number().int().min(0),
          categoryId: z.string().min(1),
          stationId: z.string().min(1)
        })
        .safeParse(req.body);
      if (!body.success) return sendBadRequest(res, "Invalid menu item payload");

      const [category, station] = await Promise.all([
        prisma.menuCategory.findUnique({ where: { id: body.data.categoryId } }),
        prisma.station.findUnique({ where: { id: body.data.stationId } })
      ]);
      if (!category) return sendBadRequest(res, "Unknown categoryId");
      if (!station) return sendBadRequest(res, "Unknown stationId");

      const item = await prisma.menuItem.create({
        data: {
          name: body.data.name,
          priceCents: body.data.priceCents,
          categoryId: category.id,
          stationId: station.id
        },
        include: { station: true, category: true }
      });
      opts.broadcast({ type: "db.change", ts: Date.now(), entity: "menuItem", id: item.id });
      res.status(201).json(item);
    })
  );

  router.patch(
    "/menu/items/:id",
    asyncHandler(async (req, res) => {
      const user = await requireRole(req, res, ["ADMIN"]);
      if (!user) return;
      const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
      const body = z
        .object({
          name: z.string().min(1).optional(),
          priceCents: z.number().int().min(0).optional(),
          soldOut: z.boolean().optional(),
          active: z.boolean().optional(),
          categoryId: z.string().min(1).optional(),
          stationId: z.string().min(1).optional()
        })
        .safeParse(req.body);
      if (!body.success) return sendBadRequest(res, "Invalid menu item payload");

      const item = await prisma.menuItem.update({
        where: { id },
        data: body.data,
        include: { station: true, category: true }
      });
      opts.broadcast({ type: "db.change", ts: Date.now(), entity: "menuItem", id: item.id });
      res.json(item);
    })
  );

  // Orders
  router.get(
    "/orders",
    asyncHandler(async (req, res) => {
      const user = await requireAuth(req, res);
      if (!user) return;
      
      // Support single status or comma-separated list of statuses
      const statusParam = req.query.status;
      let statusWhere: { status?: { in: string[] } | string } = {};
      if (typeof statusParam === "string" && statusParam.length > 0) {
        const statuses = statusParam.split(",").map(s => s.trim());
        const validStatuses = statuses.filter(s => ["OPEN", "DONE", "CANCELED"].includes(s));
        if (validStatuses.length === 1) {
          statusWhere = { status: validStatuses[0] };
        } else if (validStatuses.length > 1) {
          statusWhere = { status: { in: validStatuses } };
        }
      }

      const mine = req.query.mine === "1";
      const mineWhere = mine ? { createdById: user.id } : {};

      const orders = await prisma.order.findMany({
        where: { ...statusWhere, ...mineWhere },
        orderBy: { createdAt: "desc" },
        include: {
          table: true,
          lines: {
            orderBy: { createdAt: "asc" },
            include: { menuItem: true, station: true }
          }
        }
      });
      res.json(orders);
    })
  );

  router.post(
    "/orders",
    asyncHandler(async (req, res) => {
      const user = await requireRole(req, res, ["WAITER"]);
      if (!user) return;
      const body = z
        .object({
          tableId: z.string().min(1),
          lines: z
            .array(
              z.object({
                menuItemId: z.string().min(1),
                qty: z.number().int().min(1),
                note: z.string().max(200).optional()
              })
            )
            .min(1)
        })
        .safeParse(req.body);
      if (!body.success) return sendBadRequest(res, "Invalid order payload");

      const table = await prisma.table.findUnique({ where: { id: body.data.tableId } });
      if (!table) return sendBadRequest(res, "Unknown tableId");

      const menuItemIds = [...new Set(body.data.lines.map((l) => l.menuItemId))];
      const menuItems = await prisma.menuItem.findMany({
        where: { id: { in: menuItemIds }, active: true },
        include: { station: true }
      });
      const menuItemsById = new Map(menuItems.map((m) => [m.id, m]));

      for (const line of body.data.lines) {
        const item = menuItemsById.get(line.menuItemId);
        if (!item) return sendBadRequest(res, `Unknown menuItemId: ${line.menuItemId}`);
        if (item.soldOut) return sendBadRequest(res, `Sold out: ${item.name}`);
      }

      const order = await prisma.order.create({
        data: {
          tableId: table.id,
          createdByName: user.name,
          createdById: user.id,
          lines: {
            create: body.data.lines.map((l) => {
              const item = menuItemsById.get(l.menuItemId)!;
              return {
                menuItemId: item.id,
                qty: l.qty,
                note: l.note,
                stationId: item.stationId
              };
            })
          }
        },
        include: {
          table: true,
          lines: { include: { menuItem: true, station: true }, orderBy: { createdAt: "asc" } }
        }
      });

      opts.broadcast({ type: "db.change", ts: Date.now(), entity: "order", id: order.id });
      res.status(201).json(order);
    })
  );

  router.patch(
    "/orders/:id/cancel",
    asyncHandler(async (req, res) => {
      const user = await requireRole(req, res, ["WAITER", "ADMIN"]);
      if (!user) return;
      const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
      const body = z.object({ reason: z.string().max(200).optional() }).safeParse(req.body);
      if (!body.success) return sendBadRequest(res, "Invalid cancel payload");

      const existing = await prisma.order.findUnique({ where: { id } });
      if (!existing) return sendNotFound(res, "Order not found");

      const order = await prisma.order.update({
        where: { id },
        data: { status: "CANCELED", canceledReason: body.data.reason ?? "canceled" }
      });
      await prisma.orderLine.updateMany({ where: { orderId: id }, data: { status: "CANCELED" } });

      opts.broadcast({ type: "db.change", ts: Date.now(), entity: "order", id: order.id });
      res.json(order);
    })
  );

  router.patch(
    "/order-lines/:id/status",
    asyncHandler(async (req, res) => {
      const user = await requireRole(req, res, ["KITCHEN", "BAR", "ADMIN"]);
      if (!user) return;
      const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
      const body = z
        .object({
          status: z.enum(["OPEN", "IN_PROGRESS", "DONE", "CANCELED"])
        })
        .safeParse(req.body);
      if (!body.success) return sendBadRequest(res, "Invalid status payload");

      const lineWithStation = await prisma.orderLine.findUnique({
        where: { id },
        include: { station: true }
      });
      if (!lineWithStation) return sendNotFound(res, "Order line not found");
      if (user.role === "KITCHEN" && lineWithStation.station.type !== "KITCHEN") {
        return res.status(403).json({ error: "Forbidden" });
      }
      if (user.role === "BAR" && lineWithStation.station.type !== "BAR") {
        return res.status(403).json({ error: "Forbidden" });
      }

      const line = await prisma.orderLine.update({
        where: { id },
        data: { status: body.data.status },
        include: { order: { include: { lines: true } } }
      });

      // Auto-close order when all lines are DONE (ignore canceled lines).
      const allDone = line.order.lines.every((l) => l.status === "DONE" || l.status === "CANCELED");
      if (allDone && line.order.status === "OPEN") {
        await prisma.order.update({ where: { id: line.orderId }, data: { status: "DONE" } });
      }

      opts.broadcast({ type: "db.change", ts: Date.now(), entity: "orderLine", id: line.id });
      res.json(line);
    })
  );

  // Station boards (kitchen/bar)
  router.get(
    "/board",
    asyncHandler(async (req, res) => {
      const parsed = z.object({ stationType: z.enum(["KITCHEN", "BAR"]) }).safeParse(req.query);
      if (!parsed.success) return sendBadRequest(res, "Missing stationType");

      const stationType = parsed.data.stationType;
      const user = await requireRole(req, res, stationType === "KITCHEN" ? ["KITCHEN", "ADMIN"] : ["BAR", "ADMIN"]);
      if (!user) return;
      const orders = await prisma.order.findMany({
        where: { status: "OPEN" },
        orderBy: { createdAt: "asc" },
        include: {
          table: true,
          lines: {
            where: {
              station: { type: stationType },
              status: { in: ["OPEN", "IN_PROGRESS"] }
            },
            orderBy: { createdAt: "asc" },
            include: { menuItem: true, station: true }
          }
        }
      });

      res.json(orders.filter((o) => o.lines.length > 0));
    })
  );

  router.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  return router;
}

import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet
} from "@tanstack/react-router";
import { RoleBadgeHeader } from "./ui/RoleBadgeHeader";
import { AdminPage } from "./views/AdminPage";
import { BarPage } from "./views/BarPage";
import { KitchenPage } from "./views/KitchenPage";
import { WaiterPage } from "./views/WaiterPage";

const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-dvh">
      <Outlet />
    </div>
  )
});

const waiterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/waiter",
  component: () => (
    <>
      <RoleBadgeHeader role="Waiter" />
      <WaiterPage />
    </>
  )
});

const kitchenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/kitchen",
  component: () => (
    <>
      <RoleBadgeHeader role="Kitchen" />
      <KitchenPage />
    </>
  )
});

const barRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/bar",
  component: () => (
    <>
      <RoleBadgeHeader role="Bar" />
      <BarPage />
    </>
  )
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: () => (
    <>
      <RoleBadgeHeader role="Admin" />
      <AdminPage />
    </>
  )
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-semibold">FestFlow</h1>
      <p className="mt-2 text-slate-300">
        Choose a role:
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link className="rounded-xl bg-slate-800 p-4 hover:bg-slate-700" to="/waiter">
          Waiter
        </Link>
        <Link className="rounded-xl bg-slate-800 p-4 hover:bg-slate-700" to="/kitchen">
          Kitchen
        </Link>
        <Link className="rounded-xl bg-slate-800 p-4 hover:bg-slate-700" to="/bar">
          Bar
        </Link>
        <Link className="rounded-xl bg-slate-800 p-4 hover:bg-slate-700" to="/admin">
          Admin
        </Link>
      </div>
    </div>
  )
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  waiterRoute,
  kitchenRoute,
  barRoute,
  adminRoute
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

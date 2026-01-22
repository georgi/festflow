import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  redirect,
  Outlet
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RoleBadgeHeader } from "./ui/RoleBadgeHeader";
import { AdminPage } from "./views/AdminPage";
import { BarPage } from "./views/BarPage";
import { CashierPage } from "./views/CashierPage";
import { KitchenPage } from "./views/KitchenPage";
import { LoginPage } from "./views/LoginPage";
import { WaiterPage } from "./views/WaiterPage";
import { LanguageSwitcher } from "./components/LanguageSwitcher";

type Role = "WAITER" | "KITCHEN" | "BAR" | "CASHIER" | "ADMIN";

// Check if user's roles intersect with allowed roles
function canRolesAccessRoute(userRoles: Role[], allowedRoles: Role[]): boolean {
  return userRoles.some((role) => allowedRoles.includes(role));
}

async function requireRole(allowedRoles: Role[], nextPath: string) {
  const res = await fetch("/api/auth/me", { headers: { Accept: "application/json" } });
  if (!res.ok) {
    // Not authenticated - redirect to login with next path (no role param)
    throw redirect({ to: "/login", search: { next: nextPath } });
  }
  const data = (await res.json()) as { user: { roles: Role[] } };
  
  // Check if user's roles allow access to this route
  if (!canRolesAccessRoute(data.user.roles, allowedRoles)) {
    throw redirect({ to: "/login", search: { next: nextPath } });
  }
  
  return data.user;
}

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
  beforeLoad: async ({ location }) => {
    await requireRole(["WAITER"], location.pathname);
  },
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
  beforeLoad: async ({ location }) => {
    await requireRole(["KITCHEN", "ADMIN"], location.pathname);
  },
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
  beforeLoad: async ({ location }) => {
    await requireRole(["BAR", "ADMIN"], location.pathname);
  },
  component: () => (
    <>
      <RoleBadgeHeader role="Bar" />
      <BarPage />
    </>
  )
});

const cashierRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cashier",
  beforeLoad: async ({ location }) => {
    await requireRole(["CASHIER"], location.pathname);
  },
  component: () => (
    <>
      <RoleBadgeHeader role="Cashier" />
      <CashierPage />
    </>
  )
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  beforeLoad: async ({ location }) => {
    await requireRole(["ADMIN"], location.pathname);
  },
  component: () => (
    <>
      <RoleBadgeHeader role="Admin" />
      <AdminPage />
    </>
  )
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: () => <LoginPage />
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => {
    const { t } = useTranslation();
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-semibold">{t('app.title')}</h1>
          <LanguageSwitcher />
        </div>
        <p className="mt-2 text-muted-foreground">
          {t('app.chooseRole')}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link className="rounded-xl border border-border bg-card p-4 hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow" to="/waiter">
            {t('roles.waiter')}
          </Link>
          <Link className="rounded-xl border border-border bg-card p-4 hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow" to="/kitchen">
            {t('roles.kitchen')}
          </Link>
          <Link className="rounded-xl border border-border bg-card p-4 hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow" to="/bar">
            {t('roles.bar')}
          </Link>
          <Link className="rounded-xl border border-border bg-card p-4 hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow" to="/cashier">
            {t('roles.cashier')}
          </Link>
          <Link className="rounded-xl border border-border bg-card p-4 hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow col-span-2" to="/admin">
            {t('roles.admin')}
          </Link>
        </div>
      </div>
    );
  }
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  waiterRoute,
  kitchenRoute,
  barRoute,
  cashierRoute,
  adminRoute
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

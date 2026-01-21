import { useEffect, useState } from "react";
import { apiGet, apiPatch } from "../api/client";
import type { Order, OrderLineStatus } from "../api/types";
import { useRealtime } from "../api/useRealtime";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageShell } from "@/components/layout/PageShell";
import { AlertCircle } from "lucide-react";

export function BarPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setError(null);
      setOrders(await apiGet<Order[]>("/api/board?stationType=BAR"));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const realtimeStatus = useRealtime(() => void refresh());

  async function setLineStatus(lineId: string, status: OrderLineStatus) {
    try {
      await apiPatch(`/api/order-lines/${lineId}/status`, { status });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <PageShell
      title="Bar"
      subtitle="Drinks queue and live status."
      actions={
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
            {realtimeStatus}
          </Badge>
          <span>{orders?.length ?? 0} active</span>
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        {error ? (
          <Alert variant="destructive" className="md:col-span-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {!orders || orders.length === 0 ? (
          <div className="text-sm text-muted-foreground">No bar items.</div>
        ) : (
          orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">{order.table?.name ?? order.tableId}</CardTitle>
                  <div className="text-xs text-muted-foreground">Order {order.id} · Waiter {order.createdByName}</div>
                </div>
                <div className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  {Math.max(0, Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60_000))}m
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {order.lines.map((l) => (
                    <li key={l.id} className="rounded-xl border bg-muted/40 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium">
                          {l.qty}× {l.menuItem?.name ?? l.menuItemId}
                        </div>
                        <div className="text-xs text-muted-foreground">{l.status.toLowerCase().replace("_", " ")}</div>
                      </div>
                      {l.note ? <div className="mt-1 text-xs text-muted-foreground">Note: {l.note}</div> : null}
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => void setLineStatus(l.id, "IN_PROGRESS")}>
                          In progress
                        </Button>
                        <Button size="sm" onClick={() => void setLineStatus(l.id, "DONE")}>
                          Mark done
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => void setLineStatus(l.id, "OPEN")}>
                          Undo
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </PageShell>
  );
}

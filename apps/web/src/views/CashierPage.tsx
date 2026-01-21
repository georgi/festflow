import { useCallback, useEffect, useState } from "react";
import { useRealtime } from "../api/useRealtime";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface OrderLine {
  id: string;
  qty: number;
  note: string | null;
  status: string;
  menuItem: {
    id: string;
    name: string;
    priceCents: number;
  };
  station: {
    id: string;
    name: string;
  };
}

interface Order {
  id: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  table: {
    id: string;
    name: string;
  };
  createdByName: string;
  lines: OrderLine[];
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(cents / 100);
}

function calculateOrderTotal(lines: OrderLine[]): number {
  return lines.reduce((sum, line) => {
    if (line.status === "CANCELED") return sum;
    return sum + line.qty * line.menuItem.priceCents;
  }, 0);
}

export function CashierPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      // Fetch orders that are DONE (prepared) but UNPAID
      const res = await fetch("/api/orders?status=OPEN,DONE");
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      // Filter to only show unpaid orders
      const unpaidOrders = data.filter((o: Order) => o.paymentStatus === "UNPAID" || !o.paymentStatus);
      setOrders(unpaidOrders);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Subscribe to realtime updates
  const realtimeStatus = useRealtime(() => void fetchOrders());

  const handleMarkPaid = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/pay`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to mark as paid");
      }
      await fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-semibold">Open Orders</h1>
      
      {orders.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-lg text-muted-foreground">No open orders pending payment</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => {
            const total = calculateOrderTotal(order.lines);
            const activeLines = order.lines.filter((l) => l.status !== "CANCELED");
            
            return (
              <Card key={order.id} className="flex flex-col">
                <div className="flex items-center justify-between border-b border-border p-4">
                  <div>
                    <span className="text-lg font-semibold">{order.table.name}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      by {order.createdByName}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                      order.status === "DONE" 
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    }`}>
                      {order.status === "DONE" ? "Ready" : "In Progress"}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 p-4">
                  <ul className="space-y-2">
                    {activeLines.map((line) => (
                      <li key={line.id} className="flex justify-between text-sm">
                        <span>
                          {line.qty}× {line.menuItem.name}
                          {line.note && (
                            <span className="ml-1 text-muted-foreground">({line.note})</span>
                          )}
                        </span>
                        <span className="font-medium">
                          {formatCents(line.qty * line.menuItem.priceCents)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="border-t border-border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-xl font-bold">{formatCents(total)}</span>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => handleMarkPaid(order.id)}
                    disabled={processingId === order.id}
                  >
                    {processingId === order.id ? "Processing..." : "Mark as Paid"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

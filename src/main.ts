import { open } from "sqlite";
import sqlite3 from "sqlite3";

import { createSchema } from "./schema";
import { getPendingOrders } from "./queries/order_queries";
import { sendSlackMessage } from "./slack";

async function main() {
  const db = await open({
    filename: "ecommerce.db",
    driver: sqlite3.Database,
  });

  await createSchema(db, true);

  const staleOrders = await getPendingOrders(db, 3);

  if (staleOrders.length === 0) {
    console.log("No stale pending orders found.");
    return;
  }

  const lines = staleOrders.map(
    (o) =>
      `• Order #${o.order_id} — *${o.customer_name}* | Phone: ${o.phone ?? "N/A"} | Pending ${o.days_since_created} day(s)`
  );

  const message =
    `:warning: *${staleOrders.length} order(s) have been pending for more than 3 days:*\n` +
    lines.join("\n");

  await sendSlackMessage("#order-alerts", message);
  console.log(`Sent alert for ${staleOrders.length} stale order(s).`);
}

main();

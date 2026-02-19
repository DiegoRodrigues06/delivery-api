export const STATUS = ["RECEIVED", "CONFIRMED", "DISPATCHED", "DELIVERED", "CANCELED"];

export function withOrderId(path, order_id) {
  return path.replace(":order_id", encodeURIComponent(String(order_id)));
}

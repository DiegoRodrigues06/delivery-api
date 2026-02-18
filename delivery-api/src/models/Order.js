import { randomUUID } from "crypto";
// para gerar IDs dos pedidos.

class Order { // recebe os dados e retorna um objeto de pedido já formatado.
  static create({ store_id, customer, items, payments, delivery_address }) {
    const orderId = randomUUID();
    const createdAt = Date.now();

    const totalPrice = items.reduce((acc, item) => {
      return acc + (item.total_price || item.price * item.quantity);
    }, 0);

    return {
      store_id,
      order_id: orderId,
      order: {
        payments,
        last_status_name: "RECEIVED",
        store: {
          id: store_id,
          name: "Coco bambu" 
        },
        total_price: totalPrice,
        order_id: orderId,
        items,
        created_at: createdAt,
        statuses: [
          {
            created_at: createdAt,
            name: "RECEIVED",
            order_id: orderId,
            origin: "STORE"
          }
        ],
        customer,
        delivery_address
      }
    };
  }
}

export default Order;

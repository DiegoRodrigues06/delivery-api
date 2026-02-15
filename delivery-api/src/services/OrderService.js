import OrderRepository from '../repositories/OrderRepository.js';
import Order from '../models/Order.js';
import { randomUUID } from 'crypto';

class OrderService {

// --- Listar Pedidos ---
  async listOrders() {
    return await OrderRepository.readAll();
  }

  async getOrderById(orderId) {
    const order = await OrderRepository.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  async createOrder(data) {
    const newOrder = Order.create(data);

    const orders = await OrderRepository.readAll();
    orders.push(newOrder);

    await OrderRepository.saveAll(orders);

    return newOrder;
  }


  // --- Criar Pedido ---
  async createOrder(data) {
    const orders = await OrderRepository.readAll();

    const orderId = randomUUID();
    const now = Date.now();

    const newOrder = {
      store_id: data.store_id,
      order_id: orderId,
      order: {
        payments: data.payments || [],
        last_status_name: "RECEIVED",
        store: data.store,
        total_price: this.calculateTotal(data.items),
        order_id: orderId,
        items: data.items,
        created_at: now,
        statuses: [
          {
            created_at: now,
            name: "RECEIVED",
            order_id: orderId,
            origin: "STORE"
          }
        ],
        customer: data.customer,
        delivery_address: data.delivery_address
      }
    };

    orders.push(newOrder);

    await OrderRepository.saveAll(orders);

    return newOrder;
  }

  calculateTotal(items) {
    return items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }


  // --- Atualizar Pedido ---
  async update(orderId, updatedData) {
  const orders = await OrderRepository.readAll();

  const index = orders.findIndex(o => String(o.order_id) === String(orderId));
  if (index === -1) {
    throw new Error('Pedido não encontrado');
  }

  // Só aceitamos patch dentro de "order"
  const patchOrder = updatedData?.order;
  if (!patchOrder || typeof patchOrder !== 'object') {
    throw new Error('Body inválido: esperado { "order": { ... } }');
  }

  // Bloquear alterações que devem ser feitas em endpoints próprios
  const safePatch = { ...patchOrder };
  delete safePatch.order_id;
  delete safePatch.last_status_name;
  delete safePatch.statuses;

  const current = orders[index];

  const merged = {
    ...current, // mantém store_id e order_id do topo
    order: {
      ...current.order,
      ...safePatch
    }
  };

  // Se atualizar items, recalcula total_price
  if (safePatch.items) {
    merged.order.total_price = this.calculateTotal(safePatch.items);
  }

  // Garantia: remove lixo no topo se já tiver sido criado
  delete merged.customer;
  delete merged.items;

  orders[index] = merged;
  await OrderRepository.saveAll(orders);

  return merged;
}


// --- Deletar Pedido ---
async delete(id) {
    const orders = await OrderRepository.readAll();

    const index = orders.findIndex(o => {
      const orderId = o.order_id || o.id;
      return String(orderId) === String(id);
    });

    if (index === -1) {
      throw new Error('Pedido não encontrado');
    }

    const deleted = orders.splice(index, 1);

    await OrderRepository.saveAll(orders);

    return deleted[0];
  }



}

export default new OrderService();

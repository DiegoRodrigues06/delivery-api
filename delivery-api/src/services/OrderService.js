import { randomUUID } from 'crypto';
import OrderRepository from '../repositories/OrderRepository.js';

class OrderService {
  constructor(repo = OrderRepository) {
    this.repo = repo;
  }

  async listOrders() {
    return await this.repo.readAll();
    // listagem
  }

  async getOrderById(orderId) {
    const order = await this.repo.findById(orderId);
    if (!order) throw new Error('Order not found');
    return order;
  }

  async createOrder(data) {
    const orders = await this.repo.readAll();
    const orderId = randomUUID();
    const now = Date.now();

    const newOrder = {
      store_id: data.store_id,
      order_id: orderId,
      order: {
        payments: data.payments || [],
        last_status_name: 'RECEIVED',
        store: data.store,
        total_price: this.calculateTotal(data.items),
        order_id: orderId,
        items: data.items,
        created_at: now,
        statuses: [{ created_at: now, name: 'RECEIVED', order_id: orderId, origin: 'STORE' }],
        customer: data.customer,
        delivery_address: data.delivery_address
      }
    };

    orders.push(newOrder);
    await this.repo.saveAll(orders);
    return newOrder;
  }

  calculateTotal(items) {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  async update(order_Id, updatedData) {
    const orders = await this.repo.readAll();
    const index = orders.findIndex(o => String(o.order_id) === String(order_Id));
    if (index === -1) throw new Error('Pedido não encontrado');

    const patchOrder = updatedData?.order;
    if (!patchOrder || typeof patchOrder !== 'object') throw new Error('Body inválido');

    const safePatch = { ...patchOrder };
    delete safePatch.order_id;
    delete safePatch.last_status_name;
    delete safePatch.statuses;

    const current = orders[index];
    const merged = { ...current, order: { ...current.order, ...safePatch } };
    if (safePatch.items) merged.order.total_price = this.calculateTotal(safePatch.items);
    delete merged.customer;
    delete merged.items;

    orders[index] = merged;
    await this.repo.saveAll(orders);
    return merged;
  }

  async delete(order_id) {
    const orders = await this.repo.readAll();
    const index = orders.findIndex(o => String(o.order_id) === String(order_id));
    if (index === -1) throw new Error('Pedido não encontrado');
    const deleted = orders.splice(index, 1);
    await this.repo.saveAll(orders);
    return deleted[0];
  }
}

export default new OrderService();
export { OrderService };
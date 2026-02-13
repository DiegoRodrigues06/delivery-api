import OrderRepository from '../repositories/OrderRepository.js';
import Order from '../models/Order.js';

class OrderService {

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

  async deleteOrder(orderId) {
    const deleted = await OrderRepository.deleteById(orderId);

    if (!deleted) {
      throw new Error('Order not found');
    }

    return { message: 'Order deleted successfully' };
  }

}

export default new OrderService();

import OrderService from '../services/OrderService.js';

class OrderController {

  async listOrders(req, res) {
    try {
      const orders = await OrderService.listOrders();
      res.status(200).json(orders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

}

export default new OrderController();

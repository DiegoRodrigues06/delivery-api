import OrderService from '../services/OrderService.js';
import StatusMachineService from '../services/StatusMachineService.js';

class OrderController {

    //  --- Listar Pedidos ---
  async listOrders(req, res) {
    try {
      const orders = await OrderService.listOrders();
      res.status(200).json(orders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }


  //  --- Criar Pedido ---
  async createOrder(req, res) {
  try {
    const order = await OrderService.createOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}


async deleteOrder(req, res) {
    try {
        const { id } = req.params;
        
        const deletedOrder = await OrderService.delete(id);
        
        res.status(200).json(deletedOrder);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

async updateOrder(req, res) {
  try {
    const { id } = req.params;
    const updatedOrder = await OrderService.update(id, req.body);

    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async updateStatus(req, res) {
  try {
    const { order_id } = req.params;
    const { status } = req.body;

    const updated = await StatusMachineService.updateStatus(order_id, status);
    res.status(200).json(updated);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}


}

export default new OrderController();

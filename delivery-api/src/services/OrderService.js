import OrderRepository from '../repositories/OrderRepository.js';

class OrderService {
  constructor(repo = OrderRepository) {
    this.repo = repo; // injeta as dependencias para facilitar os testes unitários.
  }

    // ---- SERVICE PARA LISTAR PEDIDOS / BUSCAR PELO ID----
    async listOrders() {
        return await this.repo.readAll();  
    }
    
    async getOrderById(orderId) { // order ID vem do controller
        const order = await this.repo.findById(orderId);
        if (!order) throw new Error('Order not found');
        return order;
    }
    

    // ---- SERVICE PARA CRIAR PEDIDO ----
    async createOrder(data) { // os dados passado no body da requisição
        // importar o modelo apenas dentro do serviço para evitar conflito de dependencia circular
        const { default: Order } = await import('../models/Order.js'); 
        const orders = await this.repo.readAll();
        const newOrder = Order.create(data);
        
        orders.push(newOrder); 
        await this.repo.saveAll(orders);
        return newOrder; 
    }
    
    
    // ---- SERVICE PARA ATUALIZAR PARCIALMENTE ----
    async update(order_Id, updatedData) { 
        const orders = await this.repo.readAll();
        const index = orders.findIndex(o => String(o.order_id) === String(order_Id));
        if (index === -1) throw new Error('Pedido não encontrado'); // o findIndex retorna -1 se n achar nada
        
        const patchOrder = updatedData?.order;
        if (!patchOrder || typeof patchOrder !== 'object') throw new Error('Body inválido');
        
        // copia o patch e remove os campos que não podem ser sobrescritos
        const safePatch = { ...patchOrder };
        delete safePatch.order_id;
        delete safePatch.last_status_name;
        delete safePatch.statuses;
        
        // mescla o pedido atual com o patch e sobrescreve os campos, e remove os campos que não pertencem a order
        const current = orders[index];
        const merged = { ...current, order: { ...current.order, ...safePatch } };
        if (safePatch.items) merged.order.total_price = this._calculateTotal(safePatch.items);
        delete merged.customer;
        delete merged.items;
        
        // sobrescreve o pedido antigo pelo novo, salva e retorna o pedido atualizado
        orders[index] = merged;
        await this.repo.saveAll(orders);
        return merged;
    }
    // função para calcular o preço total dos pedidos apos a atualização
    _calculateTotal(items) {
      return items.reduce((total, item) => total + item.price * item.quantity, 0);
    }


    // ---- SERVICE PARA DELETAR PEDIDO ----
    async delete(order_id) {
        const orders = await this.repo.readAll();
        const index = orders.findIndex(o => String(o.order_id) === String(order_id));
        if (index === -1) throw new Error('Pedido não encontrado');

        const deleted = orders.splice(index, 1);
        await this.repo.saveAll(orders);
        return deleted[0];
    }
}

export default new OrderService(); // exporta as instâncias para serem usadas nos controllers
export { OrderService }; // exporta a classe para os testes unitários
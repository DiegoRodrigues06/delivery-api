import OrderRepository from '../repositories/OrderRepository.js';

const STATUSES = Object.freeze({
  RECEIVED: 'RECEIVED',
  CONFIRMED: 'CONFIRMED',
  DISPATCHED: 'DISPATCHED',
  DELIVERED: 'DELIVERED',
  CANCELED: 'CANCELED',
});

const ALLOWED_TRANSITIONS = Object.freeze({
  [STATUSES.RECEIVED]:   [STATUSES.CONFIRMED, STATUSES.CANCELED],
  [STATUSES.CONFIRMED]:  [STATUSES.DISPATCHED, STATUSES.CANCELED],
  [STATUSES.DISPATCHED]: [STATUSES.DELIVERED, STATUSES.CANCELED],
  [STATUSES.DELIVERED]:  [],
  [STATUSES.CANCELED]:   [],
});

class StatusMachineService {
  async updateStatus(orderId, newStatus) {
    if (!newStatus || typeof newStatus !== 'string') { // garante que veio status
      const err = new Error('Body inválido: esperado { "status": "..." }');
      err.status = 400;
      throw err;
    }

    const normalized = newStatus.trim().toUpperCase();

    // garante que o status é válido
    if (!Object.values(STATUSES).includes(normalized)) {
      const err = new Error(
        `Status inválido. Use: ${Object.values(STATUSES).join(', ')}`
      );
      err.status = 400;
      throw err;
    }

    const orders = await OrderRepository.readAll();

    const index = orders.findIndex(o => String(o.order_id) === String(orderId));
    if (index === -1) {
      const err = new Error('Pedido não encontrado');
      err.status = 404;
      throw err;
    }

    const current = orders[index];
    const currentStatus =
      (current?.order?.last_status_name || '').toString().trim().toUpperCase();

    if (!Object.values(STATUSES).includes(currentStatus)) {
    // validada se o status atual no arquivo é valido
      const err = new Error('Pedido com status atual inválido/corrompido'); 
      err.status = 409;
      throw err;
    }

    if (currentStatus === normalized) { // se o status for o mesmo, não faz nada
      return current;
    }

    // pega os status permitidos para o status atual
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || []; 
    if (!allowed.includes(normalized)) { // se dentro dos permitidos não tiver o novo status da erro
      const err = new Error(
        `Transição inválida: ${currentStatus} → ${normalized}`
      );
      err.status = 409;
      throw err;
    }

    const now = Date.now();
    
    // atualiza o status do pedido
    current.order.last_status_name = normalized;

    // validad se status é um array
    if (!Array.isArray(current.order.statuses)) current.order.statuses = [];
    current.order.statuses.push({ // adiciona o novo status ao historico
      created_at: now,
      name: normalized,
      order_id: current.order.order_id || current.order_id,
      origin: 'STORE', 
    });

    // remove os campos soltos e sobrescreve o pedido no arquivo dps salva
    delete current.customer;
    delete current.items;
    orders[index] = current;
    await OrderRepository.saveAll(orders);

    return current; // retorna o pedido atualizado
  }
}

export default new StatusMachineService();

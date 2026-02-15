import OrderRepository from '../repositories/OrderRepository.js';

const STATUSES = Object.freeze({
  RECEIVED: 'RECEIVED',
  CONFIRMED: 'CONFIRMED',
  DISPATCHED: 'DISPATCHED',
  DELIVERED: 'DELIVERED',
  CANCELED: 'CANCELED',
});

// Transições permitidas (conforme enunciado)
const ALLOWED_TRANSITIONS = Object.freeze({
  [STATUSES.RECEIVED]:   [STATUSES.CONFIRMED, STATUSES.CANCELED],
  [STATUSES.CONFIRMED]:  [STATUSES.DISPATCHED, STATUSES.CANCELED],
  [STATUSES.DISPATCHED]: [STATUSES.DELIVERED, STATUSES.CANCELED],
  [STATUSES.DELIVERED]:  [],
  [STATUSES.CANCELED]:   [],
});

class StatusMachineService {
  // --- Atualizar Status (Máquina de Estados) ---
  async updateStatus(orderId, newStatus) {
    if (!newStatus || typeof newStatus !== 'string') {
      const err = new Error('Body inválido: esperado { "status": "..." }');
      err.status = 400;
      throw err;
    }

    const normalized = newStatus.trim().toUpperCase();

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
      const err = new Error('Pedido com status atual inválido/corrompido');
      err.status = 409;
      throw err;
    }

    // Se tentar setar o mesmo status, você pode decidir:
    // - retornar o mesmo sem mudar (idempotente)
    // - ou bloquear
    // Vou deixar idempotente (mais suave pra testes)
    if (currentStatus === normalized) {
      return current;
    }

    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(normalized)) {
      const err = new Error(
        `Transição inválida: ${currentStatus} → ${normalized}`
      );
      err.status = 409;
      throw err;
    }

    const now = Date.now();

    // Atualiza status atual
    current.order.last_status_name = normalized;

    // Adiciona no histórico
    if (!Array.isArray(current.order.statuses)) current.order.statuses = [];
    current.order.statuses.push({
      created_at: now,
      name: normalized,
      order_id: current.order.order_id || current.order_id,
      origin: 'STORE', // pode manter fixo
    });

    // Garantia: remove lixo do topo se existir por testes antigos
    delete current.customer;
    delete current.items;

    orders[index] = current;
    await OrderRepository.saveAll(orders);

    return current;
  }
}

export default new StatusMachineService();

import { createOrderService } from '../OrderService.js';

const makeRepo = (initial = []) => {
  let data = initial;
  return {
    readAll: jest.fn(async () => data),
    saveAll: jest.fn(async (arr) => { data = arr; }),
    findById: jest.fn(async (id) => data.find(o => String(o.order_id) === String(id)) || null),
  };
};

const baseOrder = (status = 'RECEIVED') => ({
  store_id: 'store-1',
  order_id: 'order-uuid-1',
  order: {
    order_id: 'order-uuid-1',
    last_status_name: status,
    statuses: [{ created_at: 1, name: status, order_id: 'order-uuid-1', origin: 'STORE' }],
    items: [{ code: 1, price: 10, quantity: 2, discount: 0, name: 'Item', condiments: [] }],
    customer: { name: 'Cliente', temporary_phone: '+55' },
    delivery_address: { city: 'Brasília', street_name: 'Rua X' },
    total_price: 20
  }
});

describe('OrderService CRUD (sem mock ESM)', () => {
  test('listOrders', async () => {
    const repo = makeRepo([baseOrder()]);
    const service = createOrderService(repo);

    const result = await service.listOrders();
    expect(result).toHaveLength(1);
    expect(repo.readAll).toHaveBeenCalledTimes(1);
  });

  test('getOrderById ok', async () => {
    const repo = makeRepo([baseOrder()]);
    const service = createOrderService(repo);

    const result = await service.getOrderById('order-uuid-1');
    expect(result.order_id).toBe('order-uuid-1');
  });

  test('getOrderById not found', async () => {
    const repo = makeRepo([]);
    const service = createOrderService(repo);

    await expect(service.getOrderById('x')).rejects.toThrow('Order not found');
  });

  test('createOrder salva e retorna', async () => {
    const repo = makeRepo([]);
    const service = createOrderService(repo);

    const payload = {
      store_id: 'store-1',
      store: { name: 'Loja', id: 'store-1' },
      items: [{ code: 1, price: 10, quantity: 2, discount: 0, name: 'Item', condiments: [] }],
      payments: [],
      customer: { name: 'Novo', temporary_phone: '+55' },
      delivery_address: { city: 'Brasília' }
    };

    const created = await service.createOrder(payload);

    expect(created.order.last_status_name).toBe('RECEIVED');
    expect(created.order.statuses.at(-1).name).toBe('RECEIVED');
    expect(repo.saveAll).toHaveBeenCalledTimes(1);
  });

  test('update (PATCH normal) atualiza dentro de order e não cria lixo no topo', async () => {
    const repo = makeRepo([baseOrder()]);
    const service = createOrderService(repo);

    const patch = {
      order: {
        customer: { name: 'Cliente Atualizado' },
        delivery_address: { city: 'São Paulo' }
      },
      customer: 'LIXO',
      items: [{ name: 'LIXO', quantity: 999 }]
    };

    const updated = await service.update('order-uuid-1', patch);

    expect(updated.order.customer.name).toBe('Cliente Atualizado');
    expect(updated.order.delivery_address.city).toBe('São Paulo');
    expect(updated.customer).toBeUndefined();
    expect(updated.items).toBeUndefined();
  });

  test('delete remove e salva', async () => {
    const repo = makeRepo([baseOrder()]);
    const service = createOrderService(repo);

    const deleted = await service.delete('order-uuid-1');
    expect(deleted.order_id).toBe('order-uuid-1');

    const after = await service.listOrders();
    expect(after).toHaveLength(0);
  });
});

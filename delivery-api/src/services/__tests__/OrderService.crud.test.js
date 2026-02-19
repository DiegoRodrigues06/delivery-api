import { jest } from '@jest/globals'; // framework de testes para javascript
import { OrderService } from '../OrderService.js'; // classe que implementa a lógica pra serem simuladas nos testes

// cria um repositorio falso falso que trabalha com dados em memoria ao inves do arquivo .json/banco de dados
const makeRepo = (initial = []) => { // recebe os dados iniciais, ou vazio se nada for passado
  let data = [...initial]; // atribui uma copia dos dados a data para não mudar o array original
  return {
    // simulam as funções do repositório real, mas operando sobre o array em memória
    readAll: jest.fn(async () => data), 
    saveAll: jest.fn(async (arr) => { data = arr; }),
    findById: jest.fn(async (id) => data.find(o => String(o.order_id) === String(id)) || null),
  };
};

// Pedido predefinido para usar nos testes
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

describe('OrderService CRUD', () => {
  test('listOrders retorna todos os pedidos', async () => {
    const repo = makeRepo([baseOrder()]);
    // cria uma instacia do serviço e passa o baseOrder pra testar o funcionamento dos metodos
    const service = new OrderService(repo); 

    const result = await service.listOrders();
    expect(result).toHaveLength(1); 
    expect(repo.readAll).toHaveBeenCalledTimes(1);
  });

  test('getOrderById retorna pedido pelo id', async () => {
    const repo = makeRepo([baseOrder()]);
    const service = new OrderService(repo);

    const result = await service.getOrderById('order-uuid-1');
    expect(result.order_id).toBe('order-uuid-1');
  });

  test('getOrderById lança erro se não encontrado', async () => {
    const repo = makeRepo([]);
    const service = new OrderService(repo);

    await expect(service.getOrderById('x')).rejects.toThrow('Order not found');
  });

  test('createOrder cria com status RECEIVED e salva', async () => {
    const repo = makeRepo([]);
    const service = new OrderService(repo);

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

  test('update aplica patch só dentro de order e ignora campos no topo', async () => {
    const repo = makeRepo([baseOrder()]);
    const service = new OrderService(repo);

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

  test('delete remove o pedido e salva', async () => {
    const repo = makeRepo([baseOrder()]);
    const service = new OrderService(repo);

    const deleted = await service.delete('order-uuid-1');
    expect(deleted.order_id).toBe('order-uuid-1');

    const after = await service.listOrders();
    expect(after).toHaveLength(0);
  });
});
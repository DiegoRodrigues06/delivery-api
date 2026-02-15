import { jest } from '@jest/globals';

const makeOrder = (status = 'RECEIVED') => ({
  store_id: 'store-1',
  order_id: 'order-uuid-1',
  order: {
    order_id: 'order-uuid-1',
    last_status_name: status,
    statuses: [
      { created_at: 1, name: status, order_id: 'order-uuid-1', origin: 'STORE' }
    ]
  }
});

describe('StatusMachineService.updateStatus (ESM)', () => {
  let StatusMachineService;
  let OrderRepository;

  beforeAll(async () => {
    // ✅ Mock ANTES de importar os módulos reais
    jest.unstable_mockModule('../../repositories/OrderRepository.js', () => ({
      default: {
        readAll: jest.fn(),
        saveAll: jest.fn()
      }
    }));

    // Agora sim importa (já com mock aplicado)
    OrderRepository = (await import('../../repositories/OrderRepository.js')).default;
    StatusMachineService = (await import('../StatusMachineService.js')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve permitir RECEIVED -> CONFIRMED e salvar', async () => {
    const order = makeOrder('RECEIVED');
    OrderRepository.readAll.mockResolvedValue([order]);

    const updated = await StatusMachineService.updateStatus('order-uuid-1', 'CONFIRMED');

    expect(updated.order.last_status_name).toBe('CONFIRMED');
    expect(updated.order.statuses.at(-1).name).toBe('CONFIRMED');

    expect(OrderRepository.saveAll).toHaveBeenCalledTimes(1);
  });

  test('deve bloquear CONFIRMED -> RECEIVED com 409', async () => {
    const order = makeOrder('CONFIRMED');
    OrderRepository.readAll.mockResolvedValue([order]);

    await expect(
      StatusMachineService.updateStatus('order-uuid-1', 'RECEIVED')
    ).rejects.toMatchObject({ status: 409 });

    expect(OrderRepository.saveAll).not.toHaveBeenCalled();
  });

  test('deve bloquear DISPATCHED -> CONFIRMED com 409', async () => {
    const order = makeOrder('DISPATCHED');
    OrderRepository.readAll.mockResolvedValue([order]);

    await expect(
        StatusMachineService.updateStatus('order-uuid-1', 'CONFIRMED')
    ).rejects.toMatchObject({ status: 409 });

    expect(OrderRepository.saveAll).not.toHaveBeenCalled();
    });

    test('deve bloquear DISPATCHED -> RECEIVED com 409', async () => {
    const order = makeOrder('DISPATCHED');
    OrderRepository.readAll.mockResolvedValue([order]);

    await expect(
        StatusMachineService.updateStatus('order-uuid-1', 'RECEIVED')
    ).rejects.toMatchObject({ status: 409 });

    expect(OrderRepository.saveAll).not.toHaveBeenCalled();
 });

  test('deve retornar 404 quando pedido não existe', async () => {
    OrderRepository.readAll.mockResolvedValue([]);

    await expect(
      StatusMachineService.updateStatus('nao-existe', 'CONFIRMED')
    ).rejects.toMatchObject({ status: 404 });

    expect(OrderRepository.saveAll).not.toHaveBeenCalled();
  });

  test('deve bloquear mudanças após DELIVERED', async () => {
    const order = makeOrder('DELIVERED');
    OrderRepository.readAll.mockResolvedValue([order]);

    await expect(
      StatusMachineService.updateStatus('order-uuid-1', 'CANCELED')
    ).rejects.toMatchObject({ status: 409 });

    expect(OrderRepository.saveAll).not.toHaveBeenCalled();
  });

  test('deve bloquear status inválido com 400', async () => {
    const order = makeOrder('RECEIVED');
    OrderRepository.readAll.mockResolvedValue([order]);

    await expect(
      StatusMachineService.updateStatus('order-uuid-1', 'BANANA')
    ).rejects.toMatchObject({ status: 400 });

    expect(OrderRepository.saveAll).not.toHaveBeenCalled();
  });
});

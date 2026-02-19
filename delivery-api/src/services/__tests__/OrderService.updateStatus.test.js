import { jest } from "@jest/globals";

const ORDER_ID = "order-uuid-1";

// Pedido base reutilizado nos testes, aceita status customizado
const baseOrder = (status = "RECEIVED") => ({
  store_id: "store-1",
  order_id: ORDER_ID,
  order: {
    order_id: ORDER_ID,
    last_status_name: status,
    statuses: [{ created_at: 1, name: status, order_id: ORDER_ID, origin: "STORE" }],
  },
});

describe("StatusMachineService Update Status", () => {
  let StatusMachineService;
  let OrderRepository;

  beforeAll(async () => {
    // Intercepta o módulo antes de qualquer import para substituir pelo mock
    jest.unstable_mockModule("../../repositories/OrderRepository.js", () => ({
      default: {
        readAll: jest.fn(),
        saveAll: jest.fn(),
      },
    }));

    // garante que o mock já está registrado quando os módulos carregam
    OrderRepository = (await import("../../repositories/OrderRepository.js")).default;
    StatusMachineService = (await import("../StatusMachineService.js")).default;
  });

  // Limpa o histórico de chamadas entre cada teste para não haver interferência
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Simula um repositório stateful — cada teste tem seu próprio "banco" isolado
  function mockRepoWithOrder(initialOrder) {
    let db = [structuredClone(initialOrder)]; // structuredClone evita que testes compartilhem referências

    OrderRepository.readAll.mockImplementation(async () => structuredClone(db));
    OrderRepository.saveAll.mockImplementation(async (next) => {
      db = structuredClone(next);
    });

    return {
      // Permite verificar o estado final do "banco" após as operações
      getOrder() {
        return db.find((o) => o.order_id === ORDER_ID);
      },
    };
  }

  // Atalho para chamar updateStatus sem repetir o ORDER_ID em todo teste
  async function goTo(nextStatus) {
    return StatusMachineService.updateStatus(ORDER_ID, nextStatus);
  }

  test("caminho verde: RECEIVED -> CONFIRMED -> DISPATCHED -> DELIVERED", async () => {
    const store = mockRepoWithOrder(baseOrder("RECEIVED"));

    // Cada transição deve atualizar last_status_name e adicionar ao histórico
    const u1 = await goTo("CONFIRMED");
    expect(u1.order.last_status_name).toBe("CONFIRMED");
    expect(u1.order.statuses.at(-1).name).toBe("CONFIRMED");

    const u2 = await goTo("DISPATCHED");
    expect(u2.order.last_status_name).toBe("DISPATCHED");
    expect(u2.order.statuses.at(-1).name).toBe("DISPATCHED");

    const u3 = await goTo("DELIVERED");
    expect(u3.order.last_status_name).toBe("DELIVERED");
    expect(u3.order.statuses.at(-1).name).toBe("DELIVERED");

    // Deve salvar uma vez por transição válida
    expect(OrderRepository.saveAll).toHaveBeenCalledTimes(3);

    // Verifica o estado final persistido no "banco"
    const final = store.getOrder();
    expect(final.order.last_status_name).toBe("DELIVERED");
    expect(final.order.statuses.map((s) => s.name)).toEqual([
      "RECEIVED",
      "CONFIRMED",
      "DISPATCHED",
      "DELIVERED",
    ]);
  });

  test("bloqueios: DISPATCHED -> RECEIVED / CONFIRMED e CONFIRMED -> RECEIVED", async () => {
    // Transições retroativas devem ser bloqueadas com 409
    mockRepoWithOrder(baseOrder("DISPATCHED"));
    await expect(goTo("RECEIVED")).rejects.toMatchObject({ status: 409 });

    jest.clearAllMocks();
    mockRepoWithOrder(baseOrder("DISPATCHED"));
    await expect(goTo("CONFIRMED")).rejects.toMatchObject({ status: 409 });

    jest.clearAllMocks();
    mockRepoWithOrder(baseOrder("CONFIRMED"));
    await expect(goTo("RECEIVED")).rejects.toMatchObject({ status: 409 });

    // Nenhuma transição inválida deve persistir dados
    expect(OrderRepository.saveAll).not.toHaveBeenCalled();
  });

  test("cancelamento: deve permitir cancelar a partir de RECEIVED/CONFIRMED/DISPATCHED e bloquear após DELIVERED", async () => {
    // RECEIVED -> CANCELED (válido)
    let store = mockRepoWithOrder(baseOrder("RECEIVED"));
    const r1 = await goTo("CANCELED");
    expect(r1.order.last_status_name).toBe("CANCELED");
    expect(r1.order.statuses.at(-1).name).toBe("CANCELED");
    expect(OrderRepository.saveAll).toHaveBeenCalledTimes(1);
    expect(store.getOrder().order.last_status_name).toBe("CANCELED");

    // CONFIRMED -> CANCELED (válido)
    jest.clearAllMocks();
    store = mockRepoWithOrder(baseOrder("CONFIRMED"));
    const r2 = await goTo("CANCELED");
    expect(r2.order.last_status_name).toBe("CANCELED");
    expect(r2.order.statuses.at(-1).name).toBe("CANCELED");
    expect(OrderRepository.saveAll).toHaveBeenCalledTimes(1);

    // DISPATCHED -> CANCELED (válido)
    jest.clearAllMocks();
    store = mockRepoWithOrder(baseOrder("DISPATCHED"));
    const r3 = await goTo("CANCELED");
    expect(r3.order.last_status_name).toBe("CANCELED");
    expect(r3.order.statuses.at(-1).name).toBe("CANCELED");
    expect(OrderRepository.saveAll).toHaveBeenCalledTimes(1);

    // DELIVERED -> CANCELED (bloqueado — estado final não pode ser cancelado)
    jest.clearAllMocks();
    mockRepoWithOrder(baseOrder("DELIVERED"));
    await expect(goTo("CANCELED")).rejects.toMatchObject({ status: 409 });
    expect(OrderRepository.saveAll).not.toHaveBeenCalled();
  });

  test("404 quando pedido não existe", async () => {
    // Repo vazio simula pedido inexistente
    OrderRepository.readAll.mockResolvedValue([]);

    await expect(StatusMachineService.updateStatus("nao-existe", "CONFIRMED")).rejects.toMatchObject({
      status: 404,
    });

    expect(OrderRepository.saveAll).not.toHaveBeenCalled();
  });

  test("400 para status inválido", async () => {
    mockRepoWithOrder(baseOrder("RECEIVED"));

    // Status fora do enum deve ser rejeitado antes de qualquer operação
    await expect(goTo("BANANA")).rejects.toMatchObject({ status: 400 });

    expect(OrderRepository.saveAll).not.toHaveBeenCalled();
  });
});
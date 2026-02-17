import { jest } from "@jest/globals";

const ORDER_ID = "order-uuid-1";

const makeOrder = (status = "RECEIVED") => ({
  store_id: "store-1",
  order_id: ORDER_ID,
  order: {
    order_id: ORDER_ID,
    last_status_name: status,
    statuses: [{ created_at: 1, name: status, order_id: ORDER_ID, origin: "STORE" }],
  },
});

describe("StatusMachineService.updateStatus (ESM)", () => {
  let StatusMachineService;
  let OrderRepository;

  beforeAll(async () => {
    jest.unstable_mockModule("../../repositories/OrderRepository.js", () => ({
      default: {
        readAll: jest.fn(),
        saveAll: jest.fn(),
      },
    }));

    OrderRepository = (await import("../../repositories/OrderRepository.js")).default;
    StatusMachineService = (await import("../StatusMachineService.js")).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper: mantém o "repo stateful" ao longo do fluxo
  function mockRepoWithOrder(initialOrder) {
    let db = [structuredClone(initialOrder)];

    OrderRepository.readAll.mockImplementation(async () => structuredClone(db));
    OrderRepository.saveAll.mockImplementation(async (next) => {
      db = structuredClone(next);
    });

    return {
      getOrder() {
        return db.find((o) => o.order_id === ORDER_ID);
      },
    };
  }

  async function goTo(nextStatus) {
    return StatusMachineService.updateStatus(ORDER_ID, nextStatus);
  }

  test("caminho verde: RECEIVED -> CONFIRMED -> DISPATCHED -> DELIVERED", async () => {
    const store = mockRepoWithOrder(makeOrder("RECEIVED"));

    const u1 = await goTo("CONFIRMED");
    expect(u1.order.last_status_name).toBe("CONFIRMED");
    expect(u1.order.statuses.at(-1).name).toBe("CONFIRMED");

    const u2 = await goTo("DISPATCHED");
    expect(u2.order.last_status_name).toBe("DISPATCHED");
    expect(u2.order.statuses.at(-1).name).toBe("DISPATCHED");

    const u3 = await goTo("DELIVERED");
    expect(u3.order.last_status_name).toBe("DELIVERED");
    expect(u3.order.statuses.at(-1).name).toBe("DELIVERED");

    // salvou a cada transição válida (3 saves)
    expect(OrderRepository.saveAll).toHaveBeenCalledTimes(3);

    // estado final no "db"
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
    // 1) DISPATCHED -> RECEIVED
    mockRepoWithOrder(makeOrder("DISPATCHED"));
    await expect(goTo("RECEIVED")).rejects.toMatchObject({ status: 409 });

    // 2) DISPATCHED -> CONFIRMED
    jest.clearAllMocks();
    mockRepoWithOrder(makeOrder("DISPATCHED"));
    await expect(goTo("CONFIRMED")).rejects.toMatchObject({ status: 409 });

    // 3) CONFIRMED -> RECEIVED
    jest.clearAllMocks();
    mockRepoWithOrder(makeOrder("CONFIRMED"));
    await expect(goTo("RECEIVED")).rejects.toMatchObject({ status: 409 });

    expect(OrderRepository.saveAll).not.toHaveBeenCalled();
  });

  test("cancelamento: deve permitir cancelar a partir de RECEIVED/CONFIRMED/DISPATCHED e bloquear após DELIVERED", async () => {
    // RECEIVED -> CANCELED (válido)
    let store = mockRepoWithOrder(makeOrder("RECEIVED"));
    const r1 = await goTo("CANCELED");
    expect(r1.order.last_status_name).toBe("CANCELED");
    expect(r1.order.statuses.at(-1).name).toBe("CANCELED");
    expect(OrderRepository.saveAll).toHaveBeenCalledTimes(1);
    expect(store.getOrder().order.last_status_name).toBe("CANCELED");

    // CONFIRMED -> CANCELED (válido)
    jest.clearAllMocks();
    store = mockRepoWithOrder(makeOrder("CONFIRMED"));
    const r2 = await goTo("CANCELED");
    expect(r2.order.last_status_name).toBe("CANCELED");
    expect(r2.order.statuses.at(-1).name).toBe("CANCELED");
    expect(OrderRepository.saveAll).toHaveBeenCalledTimes(1);

    // DISPATCHED -> CANCELED (válido)
    jest.clearAllMocks();
    store = mockRepoWithOrder(makeOrder("DISPATCHED"));
    const r3 = await goTo("CANCELED");
    expect(r3.order.last_status_name).toBe("CANCELED");
    expect(r3.order.statuses.at(-1).name).toBe("CANCELED");
    expect(OrderRepository.saveAll).toHaveBeenCalledTimes(1);

    // DELIVERED -> CANCELED (bloqueado)
    jest.clearAllMocks();
    mockRepoWithOrder(makeOrder("DELIVERED"));
    await expect(goTo("CANCELED")).rejects.toMatchObject({ status: 409 });
    expect(OrderRepository.saveAll).not.toHaveBeenCalled();
  });

  test("404 quando pedido não existe", async () => {
    OrderRepository.readAll.mockResolvedValue([]);

    await expect(StatusMachineService.updateStatus("nao-existe", "CONFIRMED")).rejects.toMatchObject({
      status: 404,
    });

    expect(OrderRepository.saveAll).not.toHaveBeenCalled();
  });

  test("400 para status inválido", async () => {
    mockRepoWithOrder(makeOrder("RECEIVED"));

    await expect(goTo("BANANA")).rejects.toMatchObject({ status: 400 });

    expect(OrderRepository.saveAll).not.toHaveBeenCalled();
  });
});

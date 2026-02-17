import  { useEffect, useMemo, useState } from "react";
import HelpCard from "../components/HelpCard";

const STATUS = ["RECEIVED", "CONFIRMED", "DISPATCHED", "DELIVERED", "CANCELED"];

function withOrderId(path, order_id) {
  return path.replace(":order_id", encodeURIComponent(String(order_id)));
}

async function httpJson({ baseUrl, path, method, body }) {
  const url = `${baseUrl}${path}`;
  const init = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  if (body !== undefined && body !== null && method !== "GET") {
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url, init);
  const text = await res.text();

  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} ${res.statusText}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return { status: res.status, data };
}


export default function ApiTester() {
  const [baseUrl, setBaseUrl] = useState(import.meta.env.VITE_API_BASE_URL || "http://localhost:3000");

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const [createDraft, setCreateDraft] = useState(() => ({
    store_id: "store-1",
    store: {
        id: "store-1",
        name: "Loja Central"
    },
    customer: {
        name: "Cliente Teste",
        temporary_phone: "+55 11 90000-0000"
    },
    delivery_address: {
        street: "Rua X",
        number: "999",
        complement: "Casa",
        neighborhood: "Bairro Y",
        city: "São Paulo",
        state: "SP",
        zip_code: "01000-000",
        coordinates: { lat: -23.55052, lng: -46.63331 },
        reference: "Próximo ao mercado"
    },
    items: [
        { name: "Produto Teste", price: 10, quantity: 1 }
    ],
    payments: [
        { method: "PIX", amount: 10, status: "PENDING" }
    ]
    }));

  const [editDraft, setEditDraft] = useState(null);

  const [reqLog, setReqLog] = useState(null);
  const [resLog, setResLog] = useState(null);
  const [errLog, setErrLog] = useState(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return orders;
    const q = query.toLowerCase();
    return orders.filter((o) => JSON.stringify(o).toLowerCase().includes(q));
  }, [orders, query]);

  function notify(msg, type = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2200);
  }

  async function safeCall(label, fn, requestPreview) {
    setLoading(true);
    setErrLog(null);
    setReqLog(requestPreview || { label });
    setResLog(null);
    try {
      const res = await fn();
      setResLog(res);
      notify(`${label}: OK`, "ok");
      return res;
    } catch (e) {
      setErrLog({
        message: e?.message || "Erro",
        status: e?.status,
        data: e?.data,
      });
      notify(`${label}: erro`, "err");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrders() {
    await safeCall(
      "Listar pedidos",
      async () => {
        const res = await httpJson({ baseUrl, path: "/pedidos", method: "GET" });

        // swagger mostra array direto; mas deixo tolerante caso venha {data: []}
        const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        setOrders(list);

        // tenta manter selecionado
        if (selected?.order_id) {
          const found = list.find((x) => x.order_id === selected.order_id);
          setSelected(found || null);
          setEditDraft(found ? structuredClone(found) : null);
        }

        return res;
      },
      { method: "GET", url: `${baseUrl}/pedidos` }
    );
  }

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchOrderById(order_id) {
    const path = withOrderId("/pedidos/:order_id", order_id);

    await safeCall(
      "Buscar por ID",
      async () => {
        const res = await httpJson({ baseUrl, path, method: "GET" });
        setSelected(res.data);
        setEditDraft(structuredClone(res.data));
        return res;
      },
      { method: "GET", url: `${baseUrl}${path}` }
    );
  }

  function selectOrder(o) {
    setSelected(o);
    setEditDraft(structuredClone(o));
    if (o?.order_id) fetchOrderById(o.order_id);
  }

  async function createOrder() {
    await safeCall(
      "Criar pedido",
      async () => {
        const res = await httpJson({ baseUrl, path: "/pedidos", method: "POST", body: createDraft });
        await fetchOrders();
        return res;
      },
      { method: "POST", url: `${baseUrl}/pedidos`, body: createDraft }
    );
  }

  async function updateOrder() {
    if (!editDraft?.order_id) return notify("Pedido selecionado sem order_id", "err");

    const path = withOrderId("/pedidos/:order_id", editDraft.order_id);

    await safeCall(
      "Atualizar pedido (PATCH)",
      async () => {
        const res = await httpJson({ baseUrl, path, method: "PATCH", body: editDraft });
        await fetchOrders();
        return res;
      },
      { method: "PATCH", url: `${baseUrl}${path}`, body: editDraft }
    );
  }

  async function deleteOrder() {
    if (!selected?.order_id) return notify("Selecione um pedido com order_id", "err");

    const path = withOrderId("/pedidos/:order_id", selected.order_id);

    await safeCall(
      "Deletar pedido",
      async () => {
        const res = await httpJson({ baseUrl, path, method: "DELETE" });
        setSelected(null);
        setEditDraft(null);
        await fetchOrders();
        return res;
      },
      { method: "DELETE", url: `${baseUrl}${path}` }
    );
  }

  async function updateStatus(nextStatus) {
    if (!selected?.order_id) return notify("Selecione um pedido com order_id", "err");

    const path = withOrderId("/pedidos/:order_id/status", selected.order_id);
    const body = { status: nextStatus }; 

    await safeCall(
      `Atualizar status (${nextStatus})`,
      async () => {
        const res = await httpJson({ baseUrl, path, method: "PATCH", body });
        await fetchOrders();
        return res;
      },
      { method: "PATCH", url: `${baseUrl}${path}`, body }
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Delivery-API Tester</h1>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400">Ao carregar a página deve listar todos os pedidos</label>
              <input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full sm:w-[360px] rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                placeholder="http://localhost:3000"
              />
            </div>

            <button
              onClick={fetchOrders}
              disabled={loading}
              className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-white disabled:opacity-60"
            >
              {loading ? "Carregando..." : "Recarregar"}
            </button>
          </div>
        </header>

        {toast && (
          <div
            className={[
              "mt-4 rounded-xl border px-4 py-3 text-sm",
              toast.type === "ok"
                ? "border-emerald-900/60 bg-emerald-950/40 text-emerald-200"
                : "border-rose-900/60 bg-rose-950/40 text-rose-200",
            ].join(" ")}
          >
            {toast.msg}
          </div>
        )}

        <HelpCard />
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
          
          {/* LEFT: Orders */}
          <section className="lg:col-span-5 rounded-2xl border border-zinc-800 bg-zinc-900/40">
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <h2 className="text-sm font-semibold">Pedidos</h2>
              <span className="text-xs text-zinc-400">{orders.length} total</span>
            </div>

            <div className="p-4">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                placeholder="Buscar em qualquer campo..."
              />

              <div className="mt-3 max-h-[420px] overflow-auto rounded-xl border border-zinc-800">
                {filtered.length === 0 ? (
                  <div className="p-4 text-sm text-zinc-400">Nada encontrado.</div>
                ) : (
                  <ul className="divide-y divide-zinc-800">
                    {filtered.map((o) => {
                      const id = o.order_id;
                      const status = o?.order?.last_status_name ?? "—";
                      const isSel = selected?.order_id === id;

                      return (
                        <li
                          key={id}
                          onClick={() => selectOrder(o)}
                          className={[
                            "cursor-pointer px-4 py-3 hover:bg-zinc-800/40",
                            isSel ? "bg-zinc-800/50" : "",
                          ].join(" ")}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">{String(id)}</div>
                              <div className="truncate text-xs text-zinc-400">
                                store: {String(o.store_id ?? "—")}
                              </div>
                            </div>
                            <span className="shrink-0 rounded-full border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs">
                              {String(status)}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <p className="mt-3 text-xs text-zinc-400">
                Clique em um pedido para testar o endpoint de <code className="text-zinc-200">buscar pedido pelo ID</code>.
              </p>
            </div>
          </section>

          {/* RIGHT: Details + actions */}
          <section className="lg:col-span-7 rounded-2xl border border-zinc-800 bg-zinc-900/40">
            <div className="flex flex-col gap-2 border-b border-zinc-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold">Detalhes & Ações</h2>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={deleteOrder}
                  disabled={!selected?.order_id || loading}
                  className="rounded-xl border border-rose-900/70 bg-rose-950/30 px-3 py-2 text-xs text-rose-200 hover:bg-rose-950/45 disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
              {/* Selected */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-semibold text-zinc-300">Altere qualquer dado do pedido para testar o UPDATE</div>
                  <button
                    onClick={updateOrder}
                    disabled={!editDraft?.order_id || loading}
                    className="rounded-xl bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-950 hover:bg-white disabled:opacity-60"
                  >
                    Salvar
                  </button>
                </div>

                {!editDraft ? (
                  <div className="text-sm text-zinc-400">Ultilize os botões abaixo para testar a maquina de estados.</div>
                ) : (
                  <textarea
                    value={JSON.stringify(editDraft, null, 2)}
                    onChange={(e) => {
                      try {
                        setEditDraft(JSON.parse(e.target.value));
                      } catch {
                        // ignore
                      }
                    }}
                    className="h-[340px] w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs outline-none focus:border-zinc-600"
                    spellCheck={false}
                  />
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {STATUS.map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(s)}
                      disabled={!selected?.order_id || loading}
                      className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800/50 disabled:opacity-60"
                      title="PATCH /pedidos/:order_id/status"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Create */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-semibold text-zinc-300">Criar pedido novo pedido. Exemplo</div>
                  <button
                    onClick={createOrder}
                    disabled={loading}
                    className="rounded-xl bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-950 hover:bg-white disabled:opacity-60"
                  >
                    Criar
                  </button>
                </div>

                <textarea
                  value={JSON.stringify(createDraft, null, 2)}
                  onChange={(e) => {
                    try {
                      setCreateDraft(JSON.parse(e.target.value));
                    } catch {
                      // ignore
                    }
                  }}
                  className="h-[340px] w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs outline-none focus:border-zinc-600"
                  spellCheck={false}
                />

                
              </div>
            </div>

            {/* Logs */}
            <div className="border-t border-zinc-800 p-4">
              <h3 className="mb-2 text-sm font-semibold">Console</h3>

                <div
                    className={`grid gap-3 ${
                        resLog ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 lg:grid-cols-3"
                    }`}
                >
                <div
                className={`rounded-2xl border border-zinc-800 bg-zinc-950 p-3 ${
                    resLog ? "lg:col-span-2" : ""
                }`}
                >
                  <div className="mb-2 text-xs font-semibold text-zinc-300">Request</div>
                  <pre className="max-h-[220px] overflow-auto text-xs text-zinc-200">
                    {reqLog ? JSON.stringify(reqLog, null, 2) : "—"}
                  </pre>
                </div>

                <div
                className={`rounded-2xl border border-zinc-800 bg-zinc-950 p-3 ${
                    resLog ? "lg:col-span-2" : ""
                }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-semibold text-zinc-300">
                    Response
                    </div>

                    <button
                    onClick={() =>
                        navigator.clipboard.writeText(
                        JSON.stringify(resLog ?? {}, null, 2)
                        )
                    }
                    disabled={!resLog}
                    className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-800/50 disabled:opacity-40"
                    >
                    Copiar
                    </button>
                </div>
                  <pre className="max-h-[220px] overflow-auto text-xs text-zinc-200">
                    {resLog ? JSON.stringify(resLog, null, 2) : "—"}
                  </pre>
                </div>

                <div
                className={`rounded-2xl border border-zinc-800 bg-zinc-950 p-3 ${
                    resLog ? "lg:col-span-2" : ""
                }`}
                >
                  <div className="mb-2 text-xs font-semibold text-zinc-300">Error</div>
                  <pre className="max-h-[220px] overflow-auto text-xs text-rose-200">
                    {errLog ? JSON.stringify(errLog, null, 2) : "—"}
                  </pre>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

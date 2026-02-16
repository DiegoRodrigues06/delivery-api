import React, { useEffect, useMemo, useState } from "react";

const DEFAULT_ENDPOINTS = {
  list: "/orders", // GET
  create: "/orders", // POST
  read: "/orders/:id", // GET
  update: "/orders/:id", // PUT/PATCH (você escolhe no select)
  remove: "/orders/:id", // DELETE
  updateStatus: "/orders/:id/status", // PATCH/PUT (você escolhe)
};

const STATUS = ["RECEIVED", "CONFIRMED", "DISPATCHED", "DELIVERED", "CANCELED"];

function replaceId(path, id) {
  return path.replace(":id", encodeURIComponent(String(id)));
}

async function httpJson({ baseUrl, path, method, body, headers }) {
  const url = `${baseUrl}${path}`;
  const init = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
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
  const [endpoints, setEndpoints] = useState(DEFAULT_ENDPOINTS);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const [updateMethod, setUpdateMethod] = useState("PUT"); // PUT or PATCH
  const [statusMethod, setStatusMethod] = useState("PATCH"); // PATCH or PUT

  const [createDraft, setCreateDraft] = useState(() => ({
    // ajuste conforme sua estrutura do pedidos.json
    order_id: crypto?.randomUUID?.() || `order-${Date.now()}`,
    store_id: "store-1",
    last_status_name: "RECEIVED",
    statuses: [{ created_at: Date.now(), name: "RECEIVED", origin: "STORE" }],
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
        const res = await httpJson({ baseUrl, path: endpoints.list, method: "GET" });
        // sua API pode devolver {data: []} ou direto []
        const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        setOrders(list);
        // tenta manter selecionado se ainda existir
        if (selected) {
          const id = selected.order_id ?? selected.id;
          const found = list.find((x) => (x.order_id ?? x.id) === id);
          setSelected(found || null);
          setEditDraft(found ? structuredClone(found) : null);
        }
        return res;
      },
      { method: "GET", url: `${baseUrl}${endpoints.list}` }
    );
  }

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectOrder(o) {
    setSelected(o);
    setEditDraft(structuredClone(o));
  }

  async function createOrder() {
    await safeCall(
      "Criar pedido",
      async () => {
        const res = await httpJson({ baseUrl, path: endpoints.create, method: "POST", body: createDraft });
        await fetchOrders();
        return res;
      },
      { method: "POST", url: `${baseUrl}${endpoints.create}`, body: createDraft }
    );
  }

  async function updateOrder() {
    if (!editDraft) return;
    const id = editDraft.order_id ?? editDraft.id;
    if (!id) return notify("Sem id/order_id no pedido selecionado", "err");

    const path = replaceId(endpoints.update, id);

    await safeCall(
      `Atualizar pedido (${updateMethod})`,
      async () => {
        const res = await httpJson({ baseUrl, path, method: updateMethod, body: editDraft });
        await fetchOrders();
        return res;
      },
      { method: updateMethod, url: `${baseUrl}${path}`, body: editDraft }
    );
  }

  async function deleteOrder() {
    if (!selected) return;
    const id = selected.order_id ?? selected.id;
    if (!id) return notify("Sem id/order_id no pedido selecionado", "err");

    const path = replaceId(endpoints.remove, id);

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

  async function updateStatus(next) {
    if (!selected) return;
    const id = selected.order_id ?? selected.id;
    if (!id) return notify("Sem id/order_id no pedido selecionado", "err");

    const path = replaceId(endpoints.updateStatus, id);

    // payload flexível: muita gente usa { status: "CONFIRMED" } ou { name: "CONFIRMED" }
    const body = { status: next };

    await safeCall(
      `Atualizar status (${next})`,
      async () => {
        const res = await httpJson({ baseUrl, path, method: statusMethod, body });
        await fetchOrders();
        return res;
      },
      { method: statusMethod, url: `${baseUrl}${path}`, body }
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Delivery API Tester</h1>
            <p className="text-sm text-zinc-400">
              UI rápida pra bater nos endpoints (CRUD + updateStatus)
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400">Base URL</label>
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

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* LEFT: Orders list */}
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
                    {filtered.map((o, idx) => {
                      const id = o.order_id ?? o.id ?? idx;
                      const status = o.last_status_name ?? o.status ?? "—";
                      const isSel = (selected?.order_id ?? selected?.id) === (o.order_id ?? o.id);
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
                              <div className="truncate text-sm font-medium">
                                {String(o.order_id ?? o.id ?? "sem-id")}
                              </div>
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
            </div>
          </section>

          {/* RIGHT: Details + actions */}
          <section className="lg:col-span-7 rounded-2xl border border-zinc-800 bg-zinc-900/40">
            <div className="flex flex-col gap-2 border-b border-zinc-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold">Detalhes & Ações</h2>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={updateMethod}
                  onChange={(e) => setUpdateMethod(e.target.value)}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs outline-none focus:border-zinc-600"
                >
                  <option value="PUT">Update: PUT</option>
                  <option value="PATCH">Update: PATCH</option>
                </select>

                <select
                  value={statusMethod}
                  onChange={(e) => setStatusMethod(e.target.value)}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs outline-none focus:border-zinc-600"
                >
                  <option value="PATCH">Status: PATCH</option>
                  <option value="PUT">Status: PUT</option>
                </select>

                <button
                  onClick={deleteOrder}
                  disabled={!selected || loading}
                  className="rounded-xl border border-rose-900/70 bg-rose-950/30 px-3 py-2 text-xs text-rose-200 hover:bg-rose-950/45 disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
              {/* Selected JSON editor */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-semibold text-zinc-300">Pedido selecionado (editável)</div>
                  <button
                    onClick={updateOrder}
                    disabled={!editDraft || loading}
                    className="rounded-xl bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-950 hover:bg-white disabled:opacity-60"
                  >
                    Salvar
                  </button>
                </div>

                {!editDraft ? (
                  <div className="text-sm text-zinc-400">Selecione um pedido na lista.</div>
                ) : (
                  <textarea
                    value={JSON.stringify(editDraft, null, 2)}
                    onChange={(e) => {
                      try {
                        setEditDraft(JSON.parse(e.target.value));
                      } catch {
                        // mantém sem travar (mas não atualiza state inválido)
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
                      disabled={!selected || loading}
                      className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800/50 disabled:opacity-60"
                      title="Chama endpoint de updateStatus"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Create JSON editor */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-semibold text-zinc-300">Criar pedido</div>
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
                      // ignora JSON inválido
                    }
                  }}
                  className="h-[340px] w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs outline-none focus:border-zinc-600"
                  spellCheck={false}
                />

                <p className="mt-2 text-xs text-zinc-400">
                  Dica: ajuste esse JSON pra bater 100% com a estrutura do seu <code className="text-zinc-200">pedidos.json</code>.
                </p>
              </div>
            </div>

            {/* Logs */}
            <div className="border-t border-zinc-800 p-4">
              <h3 className="mb-2 text-sm font-semibold">Console</h3>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                  <div className="mb-2 text-xs font-semibold text-zinc-300">Request</div>
                  <pre className="max-h-[220px] overflow-auto text-xs text-zinc-200">
                    {reqLog ? JSON.stringify(reqLog, null, 2) : "—"}
                  </pre>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                  <div className="mb-2 text-xs font-semibold text-zinc-300">Response</div>
                  <pre className="max-h-[220px] overflow-auto text-xs text-zinc-200">
                    {resLog ? JSON.stringify(resLog, null, 2) : "—"}
                  </pre>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                  <div className="mb-2 text-xs font-semibold text-zinc-300">Error</div>
                  <pre className="max-h-[220px] overflow-auto text-xs text-rose-200">
                    {errLog ? JSON.stringify(errLog, null, 2) : "—"}
                  </pre>
                </div>
              </div>

              {/* Endpoint config */}
              <details className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                <summary className="cursor-pointer text-sm font-semibold">Configurar endpoints (paths)</summary>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {Object.entries(endpoints).map(([k, v]) => (
                    <label key={k} className="flex flex-col gap-1">
                      <span className="text-xs text-zinc-400">{k}</span>
                      <input
                        value={v}
                        onChange={(e) => setEndpoints((prev) => ({ ...prev, [k]: e.target.value }))}
                        className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                      />
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  Use <code className="text-zinc-200">:id</code> nas rotas que precisam do id.
                </p>
              </details>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

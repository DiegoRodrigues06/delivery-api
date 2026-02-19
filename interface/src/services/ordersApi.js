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

export const OrdersApi = {
  list(baseUrl) {
    return httpJson({ baseUrl, path: "/pedidos", method: "GET" });
  },

  getById(baseUrl, order_id) {
    const path = withOrderId("/pedidos/:order_id", order_id);
    return httpJson({ baseUrl, path, method: "GET" });
  },

  create(baseUrl, payload) {
    return httpJson({ baseUrl, path: "/pedidos", method: "POST", body: payload });
  },

  update(baseUrl, order_id, payload) {
    const path = withOrderId("/pedidos/:order_id", order_id);
    return httpJson({ baseUrl, path, method: "PATCH", body: payload });
  },

  remove(baseUrl, order_id) {
    const path = withOrderId("/pedidos/:order_id", order_id);
    return httpJson({ baseUrl, path, method: "DELETE" });
  },

  updateStatus(baseUrl, order_id, status) {
    const path = withOrderId("/pedidos/:order_id/status", order_id);
    return httpJson({ baseUrl, path, method: "PATCH", body: { status } });
  },
};

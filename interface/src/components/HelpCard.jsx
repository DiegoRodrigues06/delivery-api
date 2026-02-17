import { useState } from "react";

export default function HelpCard() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-yellow-900/60 bg-yellow-950/30 p-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-900/70 text-yellow-300 text-xs font-bold">
            !
          </div>
          <span className="text-sm font-semibold text-yellow-200">
            Como testar os endpoints
          </span>
        </div>

        <span className="text-yellow-400 text-xs">
          {open ? "Fechar ▲" : "Abrir ▼"}
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-3 text-xs text-yellow-100">
          <div>
            <span className="font-semibold text-yellow-300">1️⃣ Listar pedidos</span>
            <p>Clique em <strong>Recarregar</strong> para testar GET /pedidos.</p>
          </div>

          <div>
            <span className="font-semibold text-yellow-300">2️⃣ Criar pedido</span>
            <p>Edite o JSON na seção "Criar pedido" e clique em <strong>Criar</strong>.</p>
          </div>

          <div>
            <span className="font-semibold text-yellow-300">3️⃣ Atualizar pedido</span>
            <p>Selecione um pedido, altere o JSON e clique em <strong>Salvar</strong> (PATCH).</p>
          </div>

          <div>
            <span className="font-semibold text-yellow-300">4️⃣ Testar máquina de estados</span>
            <p>Selecione um pedido e clique em um dos botões de status.</p>
          </div>

          <div>
            <span className="font-semibold text-yellow-300">5️⃣ Deletar pedido</span>
            <p>Selecione um pedido e clique em <strong>Delete</strong>.</p>
          </div>
        </div>
      )}
    </div>
  );
}

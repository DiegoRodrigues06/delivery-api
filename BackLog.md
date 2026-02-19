# Backlog do Produto

## Visão Geral

Este documento descreve o backlog de produto do projeto Delivery API, organizado em formato de User Stories. Cada história representa uma entrega de valor sob a perspectiva do cliente ou operador do sistema, acompanhada de sua justificativa.

---

## User Stories

| ID | História | Prioridade |
|----|----------|------------|
| US-01 | Criar repositório no Git | Alta |
| US-02 | Estruturar pastas em arquitetura MVC | Alta |
| US-03 | Persistência no arquivo JSON | Alta |
| US-04 | CRUD inicial | Alta |
| US-05 | Implementar máquina de estados | Alta |
| US-06 | Testes unitários | Alta |
| US-07 | Iniciar projeto React com TailwindCSS | Média |
| US-08 | Montar interface para testes | Média |
| US-09 | Consumir endpoints | Média |
| US-10 | Containerização no Docker | Média |
| US-11 | Design / modelagem do sistema | Baixa |

---

## Detalhamento

### US-01 — Criar repositório no Git

> Como desenvolvedor, quero versionar o projeto em um repositório Git, para garantir rastreabilidade do histórico de alterações e facilitar colaboração.

**Critério de aceite:** repositório criado e acessível com histórico de commits organizado.

---

### US-02 — Estruturar pastas em arquitetura MVC

> Como desenvolvedor, quero organizar o projeto em camadas MVC, para separar responsabilidades e facilitar manutenção e evolução do código.

**Critério de aceite:** estrutura de diretórios com `controllers/`, `services/` e `repositories/` devidamente separados e funcionais.

---

### US-03 — Persistência no arquivo JSON

> Como sistema, quero armazenar os pedidos em um arquivo JSON, para que os dados sejam mantidos entre execuções sem depender de um banco de dados externo.

**Critério de aceite:** leitura e escrita no arquivo `pedidos.json` funcionando corretamente via camada de repositório.

---

### US-04 — CRUD inicial

> Como cliente da API, quero criar, listar, atualizar e remover pedidos, para gerenciar o ciclo de vida dos pedidos via endpoints REST.

**Critério de aceite:** endpoints de criação, listagem, atualização e remoção de pedidos respondendo corretamente com os status HTTP adequados.

---

### US-05 — Implementar máquina de estados

> Como operador do sistema, quero que os pedidos sigam um fluxo controlado de status, para evitar transições inválidas e garantir consistência nos dados.

**Critério de aceite:** transições válidas aceitas, estados inexistentes retornando `400` e transições inválidas retornando `409`.

---

### US-06 — Testes unitários

> Como desenvolvedor, quero cobrir a lógica de negócio com testes automatizados, para garantir que as regras de status e validações funcionem corretamente após alterações.

**Critério de aceite:** testes cobrindo fluxo válido, transições inválidas e estados inexistentes na máquina de estados, com repositório mockado.

---

### US-07 — Iniciar projeto React com TailwindCSS

> Como desenvolvedor frontend, quero configurar a base do projeto com React e TailwindCSS, para ter uma estrutura pronta para desenvolvimento de interfaces.

**Critério de aceite:** projeto iniciado com Vite, TailwindCSS configurado e aplicação renderizando sem erros.

---

### US-08 — Montar interface para testes

> Como testador, quero uma interface visual para interagir com os endpoints, para validar o comportamento da API sem depender de ferramentas externas como Postman.

**Critério de aceite:** interface com telas para listagem, criação, detalhes e console de resposta operacionais.

---

### US-09 — Consumir endpoints

> Como usuário da interface, quero que o frontend se comunique com a API, para que as ações na tela reflitam operações reais nos dados do backend.

**Critério de aceite:** todas as ações da interface realizando chamadas HTTP reais à API e exibindo as respostas corretamente.

---

### US-10 — Containerização no Docker

> Como operador, quero executar a aplicação via Docker Compose, para garantir que o ambiente seja reproduzível independentemente da máquina onde é executado.

**Critério de aceite:** aplicação completa (backend e frontend) inicializando via `docker compose up --build` sem erros, com volume configurado para persistência do `pedidos.json`.

---

### US-11 — Design e modelagem do sistema

> Como Product Owner, quero um diagrama de arquitetura do sistema, para entender como os componentes se relacionam e validar as decisões técnicas.

**Critério de aceite:** diagrama contemplando browser, frontend, backend, camadas MVC e volume de persistência.

---

### Observação:

As histórias foram priorizadas seguindo a ordem de dependência técnica entre as entregas.
# Delivery API

## Descrição

API REST desenvolvida em Node.js com Express para gerenciamento de pedidos, implementada como teste técnico. A aplicação contempla controle de fluxo de status via máquina de estados, persistência em arquivo JSON, testes unitários e interface frontend para validação dos endpoints.

### Observação:
  O arquivo .md com o BackLog do produto se encontra no diretório raiz do projeto

---

## Tecnologias Utilizadas

**Backend**
- Node.js — runtime JavaScript para o servidor
- Express — framework minimalista para criação da API REST
- cors — habilita requisições cross-origin entre frontend e backend
- uuid — geração de identificadores únicos para os pedidos
- Jest — framework de testes unitários com suporte a mocks
- Swagger — documentação interativa dos endpoints via OpenAPI
- nodemon — reinicialização automática do servidor em desenvolvimento

**Frontend**
- React — biblioteca para construção da interface por componentes
- TailwindCSS — estilização utilitária sem necessidade de CSS customizado
- axios — cliente HTTP para consumo dos endpoints da API
- Vite — bundler com hot reload para desenvolvimento ágil

**Infraestrutura**
- Docker — containerização isolada de backend e frontend
- Docker Compose — orquestração dos containers e configuração de volumes

---

## Arquitetura

O backend segue o padrão arquitetural MVC, organizado em três camadas principais:

- **Controller**: recebe as requisições HTTP, valida entradas e delega o processamento para a camada de serviços.
- **Service**: contém a lógica de negócio da aplicação, incluindo a `StatusMachineService`, responsável pelo controle de transições de status dos pedidos.
- **Repository**: responsável pela leitura e escrita de dados no arquivo `pedidos.json`.

A separação em camadas garante baixo acoplamento e facilita a substituição da camada de persistência por um banco de dados relacional ou não relacional sem impacto nas regras de negócio.

---

## Estrutura de Diretórios

```
delivery-api/
├── src/
│   ├── controllers/      # Recepção de requisições HTTP e delegação para services
│   ├── services/         # Lógica de negócio e StatusMachineService
│   ├── repositories/     # Persistência de dados via pedidos.json
│   ├── routes/           # Definição das rotas da API
│   ├── middlewares/      # Middleware de conexão com banco de dados (reservado para uso futuro)
│   ├── models/           # Estruturas e representações de dados
│   └── docs/             # Configuração do Swagger
├── pedidos.json          # Armazenamento local de dados
└── server.js             # Ponto de entrada da aplicação

interface/
├── src/
│   ├── services/         # Camada de comunicação com a API
│   ├── pages/            # Páginas da aplicação
│   ├── components/       # Componentes reutilizáveis
│   └── utilities/        # Funções auxiliares
```

### Observação sobre o Middleware

A pasta `middlewares/` contém um middleware preparado para abertura de conexão com banco de dados. Este middleware não está ativo na versão atual, pois a persistência é realizada via arquivo JSON. Sua presença tem por objetivo facilitar a futura integração com bancos como MongoDB ou PostgreSQL, sem necessidade de refatoração estrutural.

---

## Diagrama de arquitetura

<img width="1345" height="615" alt="diagrama de arquitetura" src="https://github.com/user-attachments/assets/40cb6171-145d-4162-8d79-b7d08975698e" />
Browser se comunica via HTTP com o Frontend (React, 4 integrações dos endpoints), que por sua vez faz requisições HTTP para o Backend (Node.js, camadas controller → service → repository). O backend persiste os dados em Pedidos.json via file I/O, mapeado para um volume Docker externo para garantir persistência entre reinicializações.

---

## Máquina de Estados

O controle de transições de status dos pedidos é implementado na `StatusMachineService`. A lógica é baseada em um dicionário de estados, onde cada estado define quais transições são permitidas a partir dele.

O comportamento da máquina de estados segue as seguintes regras:

- Apenas transições previstas no dicionário são aceitas.
- Requisições com estados inexistentes retornam erro `400 Bad Request`.
- Requisições com transições não permitidas retornam erro `409 Conflict`.

---

## Testes

Os testes foram implementados com Jest e têm como foco a validação da lógica de negócio na camada de serviços.

- O `OrderRepository` é mockado, eliminando dependência de arquivo em disco durante os testes.
- Os dados são manipulados em memória durante a execução dos testes.
- A `StatusMachineService` possui cobertura para fluxo válido, transições inválidas e estados inexistentes.

Para executar os testes tenha certeza de estar na pasta da api:

```bash
cd delivery-api
npm run test
```

---

## Documentação da API (Swagger)

A documentação interativa da API está disponível via Swagger UI após a inicialização do servidor.

```
http://localhost:3000/docs
```

A documentação cobre todos os endpoints disponíveis, incluindo parâmetros, schemas de requisição e resposta, e exemplos de uso.

---

## Teste na sua máquina:

### clone o repositório

```bash
git clone https://github.com/DiegoRodrigues06/delivery-api
```

## Como Executar Localmente (sem Docker)

### Backend

```bash
cd delivery-api
npm install
npm run dev
```

O servidor será iniciado na porta `3000` por padrão.

### Frontend

```bash
cd interface
npm install
npm run dev
```

A interface será iniciada na porta `5173`.

---

## Como Executar com Docker

O projeto possui `Dockerfile` dedicado para backend e frontend. O arquivo `docker-compose.yml` orquestra os dois containers e configura um volume para persistência do arquivo `pedidos.json` entre reinicializações.

**Execução em primeiro plano. na raiz do projeto:**

```bash
docker compose up --build
```

**Execução em segundo plano:**

```bash
docker compose up -d --build
```

Após a inicialização:

| Serviço    | URL                          |
|------------|------------------------------|
| Backend    | http://localhost:3000/pedidos|
| Swagger    | http://localhost:3000/docs   |
| Frontend   | http://localhost:5173        |

---

## Considerações Finais

O projeto foi desenvolvido com foco na clareza arquitetural e na separação de responsabilidades. A persistência em arquivo JSON foi adotada para simplificar a execução sem dependências externas, mas a estrutura da aplicação está preparada para migração para um banco de dados com mínimo impacto.

O frontend foi desenvolvido como ferramenta auxiliar de testes com interface similar ao próprio swagger, permitindo interagir com todos os endpoints da API de forma direta e sem configuração adicional.




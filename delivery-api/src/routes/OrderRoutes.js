import express from "express";
import OrderController from "../controllers/OrderController.js";

const router = express.Router();

/**
 * @swagger
 * /pedidos:
 *   get:
 *     summary: Lista todos os pedidos
 *     description: Retorna todos os pedidos cadastrados (conteúdo do pedidos.json).
 *     tags: [Pedidos]
 *     responses:
 *       200:
 *         description: Lista de pedidos retornada com sucesso
 */
router.get("/", OrderController.listOrders);

/**
 * @swagger
 * /pedidos/{order_id}:
 *   get:
 *     summary: Buscar pedido por ID
 *     description: Retorna um pedido específico pelo UUID.
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         description: UUID do pedido
 *         schema:
 *           type: string
 *           format: uuid
 *           example: 02601da2-4060-4013-8f2b-3b20a4ad2b48
 *     responses:
 *       200:
 *         description: Pedido encontrado com sucesso
 *       400:
 *         description: ID inválido ou não informado
 *       404:
 *         description: Pedido não encontrado
 */
router.get("/:order_id", OrderController.getOrderById);

/**
 * @swagger
 * /pedidos:
 *   post:
 *     summary: Cria um novo pedido
 *     tags: [Pedidos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [store_id, store, items, payments, customer, delivery_address]
 *             properties:
 *               store_id:
 *                 type: string
 *                 example: "98765432-abcd-ef00-1234-567890abcdef"
 *               store:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "98765432-abcd-ef00-1234-567890abcdef"
 *                   name:
 *                     type: string
 *                     example: "Loja Central"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "X-Burguer"
 *                     price:
 *                       type: number
 *                       example: 35.90
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *                     discount:
 *                       type: number
 *                       example: 0
 *                     condiments:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: []
 *               payments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     prepaid:
 *                       type: boolean
 *                       example: false
 *                     value:
 *                       type: number
 *                       example: 71.80
 *                     origin:
 *                       type: string
 *                       example: "CASH"
 *               customer:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "João Silva"
 *                   temporary_phone:
 *                     type: string
 *                     example: "+55 11 90000-0000"
 *               delivery_address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                     example: "Rua das Flores"
 *                   number:
 *                     type: string
 *                     example: "123"
 *                   complement:
 *                     type: string
 *                     example: "Apto 4"
 *                   neighborhood:
 *                     type: string
 *                     example: "Centro"
 *                   city:
 *                     type: string
 *                     example: "São Paulo"
 *                   state:
 *                     type: string
 *                     example: "SP"
 *                   zip_code:
 *                     type: string
 *                     example: "01000-000"
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso
 *       400:
 *         description: Erro na criação do pedido
 */
router.post("/", OrderController.createOrder);

/**
 * @swagger
 * /pedidos/{order_id}:
 *   patch:
 *     summary: Atualiza os dados de um pedido
 *     description: Atualização parcial do pedido.
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         description: UUID do pedido
 *         schema:
 *           type: string
 *           format: uuid
 *           example: 02601da2-4060-4013-8f2b-3b20a4ad2b48
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order:
 *                 type: object
 *                 properties:
 *                   customer:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "João Atualizado"
 *                       temporary_phone:
 *                         type: string
 *                         example: "+55 11 91111-1111"
 *                   delivery_address:
 *                     type: object
 *                     properties:
 *                       street:
 *                         type: string
 *                         example: "Rua Nova"
 *                       city:
 *                         type: string
 *                         example: "Campinas"
 *     responses:
 *       200:
 *         description: Pedido atualizado com sucesso
 *       400:
 *         description: Pedido não encontrado ou body inválido
 */
router.patch("/:order_id", OrderController.updateOrder);

/**
 * @swagger
 * /pedidos/{order_id}/status:
 *   patch:
 *     summary: Atualiza o status do pedido (máquina de estados)
 *     description: Atualiza o status respeitando regras de transição.
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         description: UUID do pedido
 *         schema:
 *           type: string
 *           format: uuid
 *           example: 02601da2-4060-4013-8f2b-3b20a4ad2b48
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [CONFIRMED, DISPATCHED, DELIVERED, CANCELED]
 *                 example: "CONFIRMED"
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *       400:
 *         description: Status inválido ou body incorreto
 *       404:
 *         description: Pedido não encontrado
 *       409:
 *         description: Transição de status inválida
 */
router.patch("/:order_id/status", OrderController.updateStatus);

/**
 * @swagger
 * /pedidos/{order_id}:
 *   delete:
 *     summary: Remove um pedido
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         description: UUID do pedido
 *         schema:
 *           type: string
 *           format: uuid
 *           example: 02601da2-4060-4013-8f2b-3b20a4ad2b48
 *     responses:
 *       200:
 *         description: Pedido removido com sucesso
 *       400:
 *         description: Pedido não encontrado
 */
router.delete("/:order_id", OrderController.deleteOrder);

export default router;

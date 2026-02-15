import express from 'express';
import OrderController from '../controllers/OrderController.js';

const router = express.Router();

/**
 * @swagger
 * /pedidos:
 *   get:
 *     summary: Lista todos os pedidos
 *     description: Retorna todos os pedidos cadastrados no sistema
 *     tags:
 *       - Pedidos
 *     responses:
 *       200:
 *         description: Lista de pedidos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/', OrderController.listOrders);

/**
 * @swagger
 * /pedidos:
 *   post:
 *     summary: Cria um novo pedido
 *     tags:
 *       - Pedidos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Erro na criação do pedido
 */
router.post('/', OrderController.createOrder);

/**
 * @swagger
 * /pedidos/{order_id}:
 *   patch:
 *     summary: Atualiza os dados de um pedido
 *     tags: 
 *     - Pedidos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do pedido
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customer:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pedido atualizado com sucesso
 *       400:
 *         description: Pedido não encontrado
 */
router.patch('/:id', OrderController.updateOrder);

/**
 * @swagger
 * /pedidos/{order_id}/status:
 *   patch:
 *     summary: Atualiza o status do pedido (máquina de estados)
 *     description: Atualiza o status do pedido respeitando as regras de transição definidas.
 *     tags:
 *       - Pedidos
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         description: UUID do pedido
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - RECEIVED
 *                   - CONFIRMED
 *                   - DISPATCHED
 *                   - DELIVERED
 *                   - CANCELED
 *                 example: CONFIRMED
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Status inválido ou body incorreto
 *       404:
 *         description: Pedido não encontrado
 *       409:
 *         description: Transição de status inválida
 */

router.patch('/:order_id/status', OrderController.updateStatus);

/**
 * @swagger
 * /pedidos/{order_id}:
 *   delete:
 *     summary: Remove um pedido
 *     tags: 
 *      - Pedidos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do pedido
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Pedido removido com sucesso
 *       400:
 *         description: Pedido não encontrado
 */
router.delete('/:id', OrderController.deleteOrder);


export default router;
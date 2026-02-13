import express from 'express';
import cors from 'cors';
import OrderService from './services/OrderService.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /pedidos:
 *   get:
 *     summary: Lista todos os pedidos
 *     description: Retorna todos os pedidos cadastrados
 *     responses:
 *       200:
 *         description: Lista de pedidos retornada com sucesso
 */
app.get('/pedidos', async (req, res) => {
  try {
    const orders = await OrderService.listOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/pedidos/:id', async (req, res) => {
  try {
    const order = await OrderService.getOrderById(req.params.id);
    res.json(order);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.delete('/pedidos/:id', async (req, res) => {
  try {
    const result = await OrderService.deleteOrder(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
  console.log('\x1b[34m%s\x1b[0m','http://localhost:3000/docs');
});

import express from 'express';
import cors from 'cors';
import orderRoutes from './routes/OrderRoutes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/pedidos', orderRoutes);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
  console.log('\x1b[34m%s\x1b[0m','documentação swagger -> http://localhost:3000/docs');
});

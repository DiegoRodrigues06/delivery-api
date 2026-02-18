import express from 'express'; // framewor pra criar o servidor e rotas
import cors from 'cors'; // pra permitir comunicação entre dominios
import orderRoutes from './routes/OrderRoutes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger.js';

const app = express(); // cria o servidor

app.use(cors());
app.use(express.json()); // permite que a api leia o body da req como Json

app.use('/pedidos', orderRoutes); // registra todas as rotas e adiciona o prefixo (caminho)

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
  console.log('\x1b[34m%s\x1b[0m','documentação swagger -> http://localhost:3000/docs');
});

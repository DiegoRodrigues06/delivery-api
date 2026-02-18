/* configura a documentação do Swagger
O swaggerJsdoc lê os arquivos definidos em "apis" e procura por comentários
JSDoc com anotações @swagger ou @openapi dentro deles
A partir desses comentários, ele gera automaticamente um JSON
que descreve toda a API */

import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Delivery API',
      version: '1.0.0',
      description: 'API para controle de pedidos de delivery'
    },
    servers: [
      {
        url: 'http://localhost:3000'
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);
// swagger UI usada no server.js para vizualizar a documentação

export default swaggerSpec;

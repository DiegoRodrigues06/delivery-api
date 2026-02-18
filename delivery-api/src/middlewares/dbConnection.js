// ---- Middleware de conexão que abre e fecha a conexão com o banco de dados para cada request.

        /*Atualmente não utilizado pois a persistência é feita via arquivo JSON,
        que abre e fecha conexão atomicamente a cada operação usando readFile e 
        writeFile do modulo fs do node.
        Este middleware pode ser usado para quando a aplicação migrar para
        um banco de dados relacional ou não-relacional. */

const dbConnection = async (req, res, next) => {
  try {
    // Exemplo com PostgreSQL:
    // req.db = await pool.connect();
    next();
    // Fecha a conexão após a request ser processada
    // req.db.release(); // PostgreSQL
  } catch (error) {
    res.status(503).json({
      message: 'Erro ao conectar com o banco de dados',
      status: 503
    });
  }
};

export default dbConnection;
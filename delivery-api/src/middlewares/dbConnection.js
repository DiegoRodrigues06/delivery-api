// Middleware de conexão com banco de dados
// Atualmente não utilizado pois a persistência é feita via arquivo JSON,
// que abre e fecha conexão atomicamente a cada operação.
// Este middleware está preparado para quando a aplicação migrar para
// um banco de dados relacional (ex: PostgreSQL) ou não-relacional (ex: MongoDB).

const dbConnection = async (req, res, next) => {
  try {
    // Exemplo com PostgreSQL:
    // req.db = await pool.connect();

    // Exemplo com MongoDB:
    // req.db = await mongoose.connection;

    next();

    // Fecha a conexão após a request ser processada
    // req.db.release(); // PostgreSQL
    // req.db.close();   // MongoDB
  } catch (error) {
    res.status(503).json({
      message: 'Erro ao conectar com o banco de dados',
      status: 503
    });
  }
};

export default dbConnection;
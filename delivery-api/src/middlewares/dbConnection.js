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
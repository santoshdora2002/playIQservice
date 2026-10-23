function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Request body contains invalid JSON',
    });
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Request body is too large',
    });
  }

  console.error(error);
  return res.status(500).json({
    error: 'Internal server error',
  });
}

module.exports = errorHandler;

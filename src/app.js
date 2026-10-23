const express = require('express');
const messageRoutes = require('./routes/messages');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');

const app = express();

app.use(express.json());
app.use('/messages', messageRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

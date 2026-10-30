const express = require('express');
const messageRoutes = require('./routes/messages');
const pagesRoutes = require('./routes/pages');
const basicAuth = require('./middleware/basicAuth');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');

const app = express();

app.use(basicAuth);
app.use(express.json());
app.use(pagesRoutes);
app.use('/messages', messageRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

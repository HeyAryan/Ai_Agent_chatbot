const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;



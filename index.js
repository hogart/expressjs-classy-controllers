'use strict';

const Abstract = require('./controllers/Abstract');
const Static = require('./controllers/Static');
const CRUD = require('./controllers/CRUD');
const CRUDSequelize = require('./controllers/CRUDSequelize');

module.exports = {
    Abstract,
    Static,
    CRUD,
    CRUDSequelize,
};
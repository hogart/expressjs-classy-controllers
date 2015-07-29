'use strict';

const AbstractController = require('./Abstract');

class StaticController extends AbstractController {
    constructor (params) {
        super(params);
    }

    makeRoutes (router) {
        router.get(this.urlRoot, this.middleware, this.index.bind(this));
    }

    index (req, res) {
        const data = this.getData ? this.getData(req, res) : {};
        return res.render(this.viewRoot, data);
    }
}

module.exports = StaticController;
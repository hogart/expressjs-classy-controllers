'use strict';

const AbstractController = require('./Abstract');

class StaticController extends AbstractController {
    /**
     * @param {Router} router
     */
    makeRoutes (router) {
        router.get(this.urlRoot, this.middleware, this.index.bind(this));
    }

    /**
     * The single action for StaticController, renders page (getting data for templates by calling getData, if defined)
     * @param {Request} req
     * @param {Response} res
     */
    index (req, res) {
        if (this.getData) {
            this.getData(req, res).then(
                ((data) => {
                    res.render(this.viewRoot, data);
                }).bind(this) // TODO: remove when io.js will support arrow functions properly
            );
        } else {
            res.render(this.viewRoot, {});
        }
    }
}

module.exports = StaticController;
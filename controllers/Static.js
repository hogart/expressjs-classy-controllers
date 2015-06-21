'use strict';

var AbstractController = require('./Abstract');

var StaticController = AbstractController.extend({
    constructor: function (params) {
        StaticController.__super__.call(this, params);

        this.humanName = params.humanName;

        if (params.router) {
            this.makeRoutes(params.router);
        }
    },

    makeRoutes: function (router) {
        router.get(this.urlRoot, this.index.bind(this));
    },

    index: function (req, res) {
        return res.render(this.viewRoot);
    }
});
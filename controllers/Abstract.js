'use strict';

function AbstractController (params) {
    this.viewRoot = params.viewRoot;
    this.urlRoot = params.urlRoot || '/';
    this.humanName = params.humanName;
}

AbstractController.prototype = {
    getLink: function () {
        return [this.urlRoot.substr(1), this.humanName];
    },

    makeRoutes: function () {
        throw new Error('Pure virtual call');
    }
};

AbstractController.extend = require('../lib/inherit');

module.exports = AbstractController;
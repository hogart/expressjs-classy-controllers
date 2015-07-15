'use strict';

class AbstractController {
    constructor (params) {
        this.viewRoot = params.viewRoot;
        this.urlRoot = params.urlRoot || '/';
        this.humanName = params.humanName;

        if (params.router) {
            this.makeRoutes(params.router);
        }
    }

    getLink () {
        return [this.urlRoot.substr(1), this.humanName];
    }

    makeRoutes () {
        throw new Error('Pure virtual call');
    }
}

module.exports = AbstractController;
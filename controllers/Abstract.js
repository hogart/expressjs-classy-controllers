'use strict';

const path = require('path');

class AbstractController {
    constructor (params) {
        this.viewRoot = params.viewRoot;
        this.urlRoot = params.urlRoot || '/';
        this.humanName = params.humanName;

        this.makeFullRoot(params.mountPath);

        if (params.router) {
            this.makeRoutes(params.router);
        }
    }

    getLink () {
        return [this.urlRoot.substr(1), this.humanName];
    }

    makeFullRoot (mountPath) {
        this.urlRootFull = path.join(mountPath || '', this.urlRoot);
    }

    makeRoutes () {
        throw new Error('Pure virtual call');
    }
}

module.exports = AbstractController;
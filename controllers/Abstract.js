'use strict';

const path = require('path');

/**
 * Params for controllers
 * @typedef {Object} ControllerParams
 * @property {String} viewRoot - where the needed views placed
 * @property {String} urlRoot - path prefix for all actions in this controller
 * @property {?String} mountPath - path prefix before controller, e.g. when several controllers with different `urlRoot`s reside on one router, defaults to ''
 * @property {String} humanName - string for navbar or menu, not strictly necessary
 * @property {?Router} router express.js Router
 * @property {?Function|Array.<Function>} middleware common middleware for all actions in this controller
 */

class AbstractController {
    /**
     * @param {ControllerParams} params
     */
    constructor (params) {
        this.viewRoot = params.viewRoot;
        this.urlRoot = params.urlRoot || '/';
        this.humanName = params.humanName;

        this.makeFullRoot(params.mountPath);

        this.setMiddleware(params.middleware);

        if (params.router) {
            this.makeRoutes(params.router);
        }
    }

    /**
     * @returns {Array.<String>} first item is relative url, second is controller's human name
     */
    getLink () {
        return [this.urlRoot.substr(1), this.humanName];
    }

    /**
     * Sets full path to controller
     * @param {String} mountPath
     */
    makeFullRoot (mountPath) {
        this.urlRootFull = path.join(mountPath || '', this.urlRoot);
    }

    makeRoutes () {
        throw new Error('Pure virtual call');
    }

    /**
     * Appends middleware to controller's middlewares list.
     * @param {?Function|Array.<Function>} [middleware]
     */
    setMiddleware (middleware) {
        if (!this.middleware) {
            this.middleware = [];
        }

        if (middleware) {
            if (Array.isArray(middleware)) {
                this.middleware.push.apply(this.middleware, middleware);
            } else {
                this.middleware.push(middleware);
            }
        }
    }
}

module.exports = AbstractController;
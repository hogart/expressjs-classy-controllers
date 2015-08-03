'use strict';

const AbstractController = require('./Abstract');
const path = require('path');

/**
 * Expressjs request object
 * @typedef {Object} Request
 * @property {Object} query
 * @property {Object} params
 * @property {Object} body
 */

/**
 * Expressjs response object
 * @typedef {Object} Response
 * @property {Function} render
 * @property {Function} send
 * @property {Function} status
 * @property {Function} redirect
 */

/**
 * Mongoose model
 * @typedef {Object} Model
 * @property {Function} find
 * @property {Function} findById
 * @property {Function} create
 * @property {Function} findByIdAndRemove
 * @property {Function} findByIdAndUpdate
 */

/**
 * Expressjs router object
 * @typedef {Object} Router
 * @property {Function} get
 * @property {Function} delete
 * @property {Function} post
 * @property {Function} put
 * @property {Function} all
 */

class CrudController extends AbstractController {
    constructor (params) {
        let model = params.model;

        if (!model) {
            throw new TypeError('Model not provided');
        }

        super(params);

        this.model = model;
    }

    /**
     * Override this method to provide validation, sanitation, transformation and so on
     * @param {Object} formData
     * @param {Function} callback
     * @returns {*}
     */
    parseForm (formData, callback) {
        return callback(null, formData);
    }

    parseFormMiddleware (req, res, next) {
        this.parseForm(req.body, (parseError, parsed) => {
            if (parseError) {
                req.parseError = parseError;
            }
            req.parsed = parsed;

            next();
        });
    }

    /**
     *
     * @param {Request} req
     * @returns Object
     */
    listQuery (req, res) { //eslint-disable-line no-unused-vars
        return {};
    }

    /**
     * Extracts id from request
     * @param {Request} req
     * @returns {number|string}
     * @protected
     */
    _getId (req) {
        return req.params.id || req.query.id;
    }

    /**
     * @param {Response} res
     * @param {Object} data
     * @protected
     */
    _renderItem (res, data) {
        if (!('item' in data)) {
            throw new TypeError('"item" is not provided for _renderItem');
        }
        return res.render(path.normalize(this.viewRoot + '/item'), data);
    }

    /**
     * @param res
     * @param list
     * @returns {*}
     * @protected
     */
    _renderList (res, list) {
        return res.render(path.normalize(this.viewRoot + '/list'), {list: list});
    }

    /**
     * Sets error status and sends error
     * @param {Response} res expressjs response object
     * @param {Error} error
     * @param {number} [status=500] HTTP status
     * @return {Response} expressjs response object
     * @protected
     */
    _error (res, error, status) {
        return res.status(status || 500).send(error);
    }

    /**
     *
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise}
     * @protected
     */
    _listRequest (req, res) {
        return this.model.find(this.listQuery(req, res), this.listFields || '');
    }

    /**
     * Renders lis of all models
     * @param {Request} req
     * @param {Response} res
     * @returns {*}
     */
    list (req, res) {
        this._listRequest(req, res).then(
            this._renderList.bind(this, res),
            this._error.bind(this, res)
        );
    }

    _createRequest (req, res) { //eslint-disable-line no-unused-vars
        return this.model.create(req.parsed);
    }

    /**
     *
     * @param {Request} req
     * @param {Response} res
     */
    create (req, res) {
        var onReject = this._error.bind(this, res);

        if (req.parseError) {
            this._renderItem(res, {item: req.parsed, error: req.parseError});
        } else {
            this._createRequest(req, res).then(
                ((createdItem) => {
                    if (createdItem.id) {
                        res.redirect(this.urlRootFull + createdItem.id);
                    } else {
                        onReject(new Error('Item saved incorrectly'));
                    }
                }).bind(this),
                onReject
            );
        }
    }

    _readRequest (req, res) { //eslint-disable-line no-unused-vars
        const id = this._getId(req);
        return this.model.findById(id);
    }

    /**
     *
     * @param {Request} req
     * @param {Response} res
     * @returns {*}
     */
    read (req, res) {
        var onResolve = ((item) => {
            if (item) {
                this._renderItem(res, {item: item});
            } else {
                onReject(new Error(`No such item: ${this._getId(res)}`));
            }
        }).bind(this); // TODO: remove this when iojs will support arrow functions correctly
        var onReject = this._error.bind(this, res);

        this._readRequest(req, res).then(onResolve, onReject);
    }

    _updateRequest (req, res) { //eslint-disable-line no-unused-vars
        return this.model.findByIdAndUpdate(this._getId(req), req.parsed);
    }

    /**
     *
     * @param {Request} req
     * @param {Response} res
     */
    update (req, res) {
        var onReject = this._error.bind(this, res);
        var onResolve = this._renderItem.bind(this, res);
        if (req.parseError) {
            onResolve({item: req.parsed, error: req.parseError});
        } else {
            this._updateRequest(req, res).then(
                (item) => {
                    onResolve({item: item});
                },
                onReject
            );
        }
    }

    _destroyRequest (req, res) { //eslint-disable-line no-unused-vars
        return this.model.findByIdAndRemove(this._getId(req));
    }

    /**
     *
     * @param {Request} req
     * @param {Response} res
     */
    destroy (req, res) {
        var onResolve = res.redirect.bind(res, this.urlRootFull);
        var onReject = this._error.bind(this, res);

        this._destroyRequest(req, res).then(onResolve, onReject);
    }

    /**
     *
     * @param {Router} router
     * @param {string} [mountPath='']
     */
    makeRoutes (router, mountPath) {
        if (mountPath) {
            this.makeFullRoot(mountPath);
        }

        const addedMw = this.middleware.concat(this.parseFormMiddleware.bind(this));

        router.get(this.urlRoot, this.middleware, this.list.bind(this));
        router.post(this.urlRoot, addedMw, this.create.bind(this));
        router.get(this.urlRoot + ':id', this.middleware, this.read.bind(this));
        router.post(this.urlRoot + ':id', addedMw, this.update.bind(this));
        router.delete(this.urlRoot + ':id', this.middleware, this.destroy.bind(this));
    }
}

module.exports = CrudController;
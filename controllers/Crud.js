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

    /**
     *
     * @param {Request} req
     * @returns Object
     */
    listQuery (req) { //eslint-disable-line no-unused-vars
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
     * Either calls this._error or this._item depending on whether error is passed
     * @param {Response} res expressjs response object
     * @param {Object} item
     * @param {Error} [error]
     * @protected
     */
    _errorOrItem (res, item, error) {
        if (error) {
            this._error(res, error);
        } else {
            this._renderItem(res, {item: item});
        }
    }

    /**
     * Renders lis of all models
     * @param {Request} req
     * @param {Response} res
     * @returns {*}
     */
    list (req, res) {
        return this.model.find(this.listQuery(req), this.listFields || '', ((err, list) => {
            if (err) {
                this._error(res, err);
            } else {
                this._renderList(res, list);
            }
        }).bind(this)); // TODO: remove this when iojs will support arrow functions correctly
    }

    /**
     *
     * @param {Request} req
     * @param {Response} res
     */
    create (req, res) {
        this.parseForm(req.body, ((parseError, parsed) => {
            if (parseError) {
                this._renderItem(res, {item: parsed, error: parseError});
            } else {
                this.model.create(parsed, ((saveError, createdItem) => {
                    if (createdItem.id && !saveError) {
                        res.redirect(this.urlRootFull + createdItem.id);
                    } else {
                        this._errorOrItem(res, createdItem, saveError);
                    }
                }).bind(this)); // TODO: remove this when iojs will support arrow functions correctly
            }
        }).bind(this)); // TODO: remove this when iojs will support arrow functions correctly
    }

    /**
     *
     * @param {Request} req
     * @param {Response} res
     * @returns {*}
     */
    read (req, res) {
        const id = this._getId(req);
        return this.model.findById(id, ((error, item) => {
            if (!item) {
                error = new Error(`No such item: ${id}`);
            }
            this._errorOrItem(res, item, error);
        }).bind(this)); // TODO: remove this when iojs will support arrow functions correctly
    }

    /**
     *
     * @param {Request} req
     * @param {Response} res
     */
    update (req, res) {
        this.parseForm(req.body, ((parseError, parsed) => {
            if (parseError) {
                this._renderItem(res, {item: parsed, error: parseError});
            } else {
                this.model.findByIdAndUpdate(this._getId(req), parsed, ((updateError, updatedItem) => {
                    this._errorOrItem(res, updatedItem, updateError);
                }).bind(this)); // TODO: remove this when iojs will support arrow functions correctly
            }
        }).bind(this)); // TODO: remove this when iojs will support arrow functions correctly
    }

    /**
     *
     * @param {Request} req
     * @param {Response} res
     */
    destroy (req, res) {
        this.model.findByIdAndRemove(this._getId(req), ((err/*, deleted*/) => {
            if (err) {
                this._error(res, err);
            } else {
                res.redirect(this.urlRootFull);
            }
        }).bind(this)); // TODO: remove this when iojs will support arrow functions correctly
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

        router.get(this.urlRoot, this.list.bind(this));
        router.post(this.urlRoot, this.create.bind(this));
        router.get(this.urlRoot + ':id', this.read.bind(this));
        router.post(this.urlRoot + ':id', this.update.bind(this));
        router.delete(this.urlRoot + ':id', this.destroy.bind(this));
    }
}

module.exports = CrudController;
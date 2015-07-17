'use strict';

const AbstractController = require('./Abstract');
const path = require('path');

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

    _getId (req) {
        return req.params.id || req.query.id;
    }

    /**
     * @param res
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
     * @param {Object} res expressjs response object
     * @param {Object} error
     * @param {number} [status=500] HTTP status
     * @return {Object}
     * @protected expressjs response object
     */
    _error (res, error, status) {
        return res.status(status || 500).send(error);
    }

    /**
     * Either calls this._error or this._item depending on whether error is passed
     * @param {Object} res expressjs response object
     * @param {Object} item
     * @param {Object} [error]
     * @protected
     */
    _errorOrItem (res, item, error) {
        if (error) {
            this._error(res, error);
        } else {
            this._renderItem(res, {item: item});
        }
    }

    list (req, res) {
        return this.model.find(this.listQuery || {}, this.listFields || '', ((err, list) => {
            if (err) {
                this._error(res, err);
            } else {
                this._renderList(res, list);
            }
        }).bind(this)); // TODO: remove this when iojs will support arrow functions correctly
    }

    create (req, res) {
        this.parseForm(req.body, ((parseError, parsed) => {
            if (parseError) {
                this._renderItem(res, {item: parsed, error: parseError});
            } else {
                this.model.create(parsed, ((saveError, createdItem) => {
                    this._errorOrItem(res, createdItem, saveError);
                }).bind(this)); // TODO: remove this when iojs will support arrow functions correctly
            }
        }).bind(this)); // TODO: remove this when iojs will support arrow functions correctly
    }

    read (req, res) {
        return this.model.findById(this._getId(req), (err, item) => {
            this._errorOrItem(res, item, err);
        });
    }

    update (req, res) {
        this.parseForm(req.body, (parseError, parsed) => {
            if (parseError) {
                this._renderItem(res, {item: parsed, error: parseError});
            } else {
                this.model.findByIdAndUpdate(this._getId(req), parsed, (updateError, updatedItem) => {
                    this._errorOrItem(res, updatedItem, updateError);
                });
            }
        });
    }

    destroy (req, res) {
        this.model.findByIdAndRemove(this._getId(req), (err/*, deleted*/) => {
            if (err) {
                this._error(res, err);
            } else {
                res.redirect(this.urlRoot + '/');
            }
        });
    }

    makeRoutes (router) {
        router.get(this.urlRoot, this.list.bind(this));
        router.post(this.urlRoot, this.create.bind(this));
        router.get(this.urlRoot + ':id', this.read.bind(this));
        router.post(this.urlRoot + ':id', this.update.bind(this));
        router.delete(this.urlRoot + ':id', this.destroy.bind(this));
    }
}

module.exports = CrudController;
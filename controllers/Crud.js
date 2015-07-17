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
        this.parseForm(req.body, (parseError, parsed) => {
            if (parseError) {
                res.render(this.viewRoot + 'item', {item: parsed, err: parseError});
            } else {
                this.model.create(parsed, (saveError, createdItem) => {
                    if (saveError) {
                        this._error(res, saveError);
                    } else {
                        this._renderItem(res, {item: createdItem});
                    }
                });
            }
        });
    }

    read (req, res) {
        return this.model.findById(this._getId(req), (err, item) => {
            if (err) {
                this._error(res, err);
            } else {
                this._renderItem(res, {item: item});
            }
        });
    }

    update (req, res) {
        this.parseForm(req.body, (parseError, parsed) => {
            if (parseError) {
                this._renderItem(res, {item: parsed, err: parseError});
            } else {
                this.model.findByIdAndUpdate(this._getId(req), parsed, (updateError, updatedItem) => {
                    if (updateError) {
                        this._error(res, updateError);
                    } else {
                        this._renderItem(res, {item: updatedItem});
                    }
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
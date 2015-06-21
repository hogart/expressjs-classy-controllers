'use strict';

var AbstractController = require('./Abstract');

var CrudController = AbstractController.extend({
    constructor: function (params) {
        if (!params.model) {
            throw new TypeError('Model not provided');
        } else {
            this.model = params.model;
        }

        this.humanName = params.humanName;

        CrudController.__super__.call(this, params);
    },

    /**
     * Override this method to provide validation, sanitation, transformation and so on
     * @param {Object} formData
     * @param {Function} callback
     * @returns {*}
     */
    parseForm: function (formData, callback) {
        return callback(null, formData);
    },

    _getId: function (req) {
        return req.params.id || req.query.id;
    },

    _renderItem: function (res, data) {
        res.render(this.viewRoot + 'item', data);
    },

    renderList: function (res, list) {
        res.render(this.viewRoot + 'list', {list: list});
    },

    _error: function (res, error) {
        res.status(500).send(error);
    },

    list: function (req, res) {
        return this.model.find({}, this.listFields || '', function (err, list) {
            if (err) {
                this._error(res, err);
            } else {
                this.renderList(list);
            }
        }.bind(this));
    },

    create: function (req, res) {
        this.parseForm(req.body, function (parseError, parsed) {
            if (parseError) {
                res.render(this.viewRoot + 'item', {item: parsed, err: parseError});
            } else {
                this.model.create(parsed, function (saveError, createdItem) {
                    if (saveError) {
                        this._error(res, saveError);
                    } else {
                        this._renderItem(res, {item: createdItem});
                    }
                }.bind(this));
            }
        }.bind(this));
    },

    read: function (req, res) {
        return this.model.findById(this._getId(req), function (err, item) {
            if (err) {
                this._error(res, err);
            } else {
                this._renderItem(res, {item: item});
            }
        }.bind(this));
    },

    update: function (req, res) {
        this.parseForm(req.body, function (parseError, parsed) {
            if (parseError) {
                this._renderItem(res, {item: parsed, err: parseError});
            } else {
                this.model.findByIdAndUpdate(this._getId(req), parsed, function (updateError, updatedItem) {
                    if (updateError) {
                        this._error(res, updateError);
                    } else {
                        this._renderItem(res, {item: updatedItem});
                    }
                }.bind(this));
            }
        }.bind(this));
    },

    destroy: function (req, res) {
        this.model.findByIdAndRemove(this._getId(req), function (err/*, deleted*/) {
            if (err) {
                this._error(res, err);
            } else {
                res.redirect(this.urlRoot + '/');
            }
        }.bind(this));
    },

    makeRoutes: function (router) {
        router.get(this.urlRoot, this.list.bind(this));
        router.post(this.urlRoot, this.create.bind(this));
        router.get(this.urlRoot + ':id', this.read.bind(this));
        router.post(this.urlRoot + ':id', this.update.bind(this));
        router.delete(this.urlRoot + ':id', this.destroy.bind(this));
    }
});
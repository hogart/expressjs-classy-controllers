/* eslint-env mocha */

'use strict';

const assert = require('chai').assert;
const path = require('path');
const CrudController = require('../../controllers/Crud');

new CrudController({ //eslint-disable-line
    viewRoot: 'views/some/path',
    urlRoot: '/mount/point',
    humanName: 'Nothing here, move along',
    model: {}
});

describe('CrudController', () => {
    describe('constructor', () => {
        it('throws error if model is not passed', () => {
            function controllerFactory (model) {
                return new CrudController({
                    viewRoot: 'views/some/path',
                    urlRoot: '/mount/point',
                    humanName: 'Nothing here, move along',
                    model: model
                });
            }

            assert.throws(
                controllerFactory.bind(null, false),
                /Model not provided/,
                'correct error thrown'
            );

            assert.doesNotThrow(
                controllerFactory.bind(null, {}),
                'no errors thrown when model is present'
            );
        });
    });

    describe('parseForm', () => {
        it('calls callback', (done) => {
            CrudController.prototype.parseForm({some: 'data'}, (error, data) => {
                assert.isNull(error, 'error is null by default');
                assert.deepEqual(data, {some: 'data'});
                done();
            });
        });
    });

    describe('_getId', () => {
        it('gets id from various sources', () => {
            const req1 = {params: {id: 1234}, query: {}};
            const req2 = {params: {}, query: {id: 4321}};
            const req3 = {params: {id: 1234}, query: {id: 4321}};

            assert.equal(CrudController.prototype._getId(req1), 1234, 'from params');
            assert.equal(CrudController.prototype._getId(req2), 4321, 'from query');
            assert.equal(CrudController.prototype._getId(req3), 1234, 'from params first');
        });
    });

    describe('_renderItem', () => {
        it('calls res.render with correct params', (done) => {
            const controller = new CrudController({
                viewRoot: 'views/some/path',
                urlRoot: '/mount/point',
                humanName: 'Nothing here, move along',
                model: {}
            });

            const res = {
                render (viewPath, data) {
                    assert.equal(viewPath, path.normalize('views/some/path/item'));
                    assert.deepEqual(data, {item: {some: 'item'}});
                    done();
                }
            };

            controller._renderItem(res, {item: {some: 'item'}});
        });

        it('throws error when passed object do not contains `item` field', () => {
            const controller = new CrudController({
                viewRoot: 'views/some/path',
                urlRoot: '/mount/point',
                humanName: 'Nothing here, move along',
                model: {}
            });

            assert.throws(
                controller._renderItem.bind(controller, null, {some: 'item'}),
                TypeError,
                /"item" is not provided for _renderItem/,
                'correct error thrown'
            );
        });
    });

    describe('_renderList', () => {
        it('calls res.render with correct params', (done) => {
            const controller = new CrudController({
                viewRoot: 'views/some/path',
                urlRoot: '/mount/point',
                humanName: 'Nothing here, move along',
                model: {}
            });

            const res = {
                render (viewPath, data) {
                    assert.equal(viewPath, path.normalize('views/some/path/list'));
                    assert.deepEqual(data, {list: ['some', 'list']}, 'data correctly wrapped to object');
                    done();
                }
            };

            controller._renderList(res, ['some', 'list']);
        });
    });

    describe('_error', () => {
        const res = {
            status (statusCode) {
                this.statusCode = statusCode;
                return this;
            },

            send (body) {
                this.body = body;
            }
        };

        const error = CrudController.prototype._error;

        beforeEach(() => {
            res.body = null;
            res.statusCode = null;
        });

        it('calls correct methods of res', () => {
            error(res, {answer: 42}, 555);
            assert.equal(res.statusCode, 555);
            assert.deepEqual(res.body, {answer: 42});
        });

        it('defaults to 500 status code', function () {
            error(res, {answer: 42});
            assert.equal(res.statusCode, 500);
            assert.deepEqual(res.body, {answer: 42});
        });
    });

    describe('list', function () {
        const model = {
            find (query, fields, callback) {
                this.query = query;
                this.fields = fields;
                callback(this.error || null, ['some', 'data']);
            }
        };

        beforeEach(() => {
            model.query = null;
            model.fields = null;
            model.error = null;
        });

        it('fetches data from model and renders list', function (done) {
            const controller = new CrudController({
                viewRoot: 'views/some/path',
                urlRoot: '/mount/point',
                humanName: 'Nothing here, move along',
                model: model
            });

            controller._renderList = function (res, list) {
                assert.deepEqual(res, {some: 'response'}, 'response object passed correctly');
                assert.equal(model.fields, '', 'list of fields by default is empty string');
                assert.deepEqual(list, ['some', 'data'], 'rendering list returned from model');
                done();
            };

            controller.list(null, {some: 'response'});
        });

        it('uses listFields if defined', function (done) {
            const controller = new CrudController({
                viewRoot: 'views/some/path',
                urlRoot: '/mount/point',
                humanName: 'Nothing here, move along',
                model: model
            });

            controller.listFields = 'id name title createdAt';

            controller._renderList = function () {
                assert.equal(model.fields, 'id name title createdAt', 'list of fields used to create request');
                done();
            };

            controller.list();
        });

        it('uses listQuery if defined', function (done) {
            const controller = new CrudController({
                viewRoot: 'views/some/path',
                urlRoot: '/mount/point',
                humanName: 'Nothing here, move along',
                model: model
            });

            controller.listQuery = {isActive: true};

            controller._renderList = function () {
                assert.deepEqual(model.query, {isActive: true});
                done();
            };

            controller.list();
        });

        it('sends error if error occured during fetching', function (done) {
            const controller = new CrudController({
                viewRoot: 'views/some/path',
                urlRoot: '/mount/point',
                humanName: 'Nothing here, move along',
                model: model
            });

            model.error = {some: 'error'};

            controller._error = function (res, error) {
                assert.deepEqual(res, {some: 'response'}, 'response object passed correctly');
                assert.deepEqual(error, {some: 'error'}, 'error object passed correctly');
                done();
            };

            controller.list(null, {some: 'response'});
        });
    });
});
/* eslint-env mocha */

'use strict';

const assert = require('chai').assert;
const path = require('path');
const CrudController = require('../../controllers/Crud');

describe('CrudController', () => {
    function controllerFactory (model) {
        return new CrudController({
            viewRoot: 'views/some/path',
            urlRoot: '/mount/point',
            humanName: 'Nothing here, move along',
            model: model
        });
    }

    describe('constructor', () => {
        it('throws error if model is not passed', () => {
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
            const controller = controllerFactory({});
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
            const controller = controllerFactory({});

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
            const controller = controllerFactory({});
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

        it('defaults to 500 status code', () => {
            error(res, {answer: 42});
            assert.equal(res.statusCode, 500);
            assert.deepEqual(res.body, {answer: 42});
        });
    });

    describe('_errorOrItem', () => {
        it('calls _error if error is present', (done) => {
            const controller = controllerFactory({});

            controller._error = (res, error) => {
                assert.deepEqual(error, {some: 'error'});
                done();
            };

            controller._errorOrItem({}, null, {some: 'error'});
        });

        it('calls _renderItem if error is absent, correctly wrapping item in required object', (done) => {
            const controller = controllerFactory({});

            controller._renderItem = (res, item) => {
                assert.deepEqual(item, {item: {some: 'item'}});
                done();
            };

            controller._errorOrItem({}, {some: 'item'});
        });
    });

    describe('list', () => {
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

        it('fetches data from model and renders list', (done) => {
            const controller = controllerFactory(model);

            controller._renderList = function (res, list) {
                assert.deepEqual(res, {some: 'response'}, 'response object passed correctly');
                assert.equal(model.fields, '', 'list of fields by default is empty string');
                assert.deepEqual(list, ['some', 'data'], 'rendering list returned from model');
                done();
            };

            controller.list(null, {some: 'response'});
        });

        it('uses listFields if defined', (done) => {
            const controller = controllerFactory(model);

            controller.listFields = 'id name title createdAt';

            controller._renderList = () => {
                assert.equal(model.fields, 'id name title createdAt', 'list of fields used to create request');
                done();
            };

            controller.list();
        });

        it('uses listQuery if defined', (done) => {
            const controller = controllerFactory(model);

            controller.listQuery = {isActive: true};

            controller._renderList = () => {
                assert.deepEqual(model.query, {isActive: true});
                done();
            };

            controller.list();
        });

        it('sends error if error occured during fetching', (done) => {
            const controller = controllerFactory(model);

            model.error = {some: 'error'};

            controller._error = function (res, error) {
                assert.deepEqual(res, {some: 'response'}, 'response object passed correctly');
                assert.deepEqual(error, {some: 'error'}, 'error object passed correctly');
                done();
            };

            controller.list(null, {some: 'response'});
        });
    });

    describe('create', () => {
        it('renders item with additional error object, if parseForm returns error', (done) => {
            const controller = controllerFactory({});

            controller._renderItem = (res, data) => {
                assert.property(data, 'item');
                assert.deepEqual(data.error, {some: 'error'});

                done();
            };

            controller.parseForm = (rawData, callback) => {
                callback({some: 'error'}, rawData);
            };

            controller.create({body: null});
        });

        it('calls this.model.create with proper data', (done) => {
            const controller = controllerFactory({
                create (data) {
                    assert.deepEqual(data, {some: 'data'}, 'model.create called with correct data');
                    done();
                }
            });

            controller.parseForm = (rawData, callback) => {
                callback(null, rawData);
            };

            controller.create({body: {some: 'data'}});
        });

        it('calls this.model.create with proper data', (done) => {
            const controller = controllerFactory({
                create (data) {
                    assert.deepEqual(data, {some: 'data'}, 'model.create called with correct data');
                    done();
                }
            });

            controller.parseForm = (rawData, callback) => {
                callback(null, rawData);
            };

            controller.create({body: {some: 'data'}});
        });

        it('calls this._errorOrCreate with proper data', (done) => {
            const controller = controllerFactory({
                create (data, callback) {
                    callback(null, data);
                }
            });

            controller.parseForm = (rawData, callback) => {
                callback(null, rawData);
            };

            controller._errorOrItem = (res, item, error) => {
                assert.deepEqual(item, {some: 'data'});
                assert.isNull(error);

                done();
            };

            controller.create({body: {some: 'data'}});
        });
    });

    describe('read', () => {
        it('calls this.model.findById', (done) => {
            const controller = controllerFactory({
                findById (id, callback) {
                    assert.equal(id, 12345, 'id was extracted');
                    assert.isFunction(callback, 'second argument is function');
                    done();
                }
            });
            const request = {params: {id: 12345}};

            controller.read(request, null);
        });

        it('calls this._errorOrItem', (done) => {
            const controller = controllerFactory({
                findById (id, callback) {
                    callback(null, {id});
                }
            });
            const request = {params: {id: 12345}};
            const response = {some: 'response'};

            controller._errorOrItem = (res, item, error) => {
                assert.equal(res, response);
                assert.deepEqual(item, {id: 12345});
                assert.isNull(error);
                done();
            };

            controller.read(request, response);
        });
    });

    describe('update', () => {
        it('renders item again along with errors from parsing', (done) => {
            const controller = controllerFactory({});

            controller.parseForm = (data, callback) => {
                assert.ok('parseForm called');
                callback({some: 'error'}, data);
            };

            controller._renderItem = (res, item) => {
                assert.deepEqual(item.error, {some: 'error'}, 'error object ok');
                assert.deepEqual(item.item, {some: 'object'}, 'item object ok');
                done();
            };

            controller.update({body: {some: 'object'}});
        });

        it('calls this.model.findByIdAndUpdate', (done) => {
            const request = {
                params: {id: 12345},
                body: {some: 'data'}
            };
            const controller = controllerFactory({
                findByIdAndUpdate (id, data, callback) {
                    assert.equal(id, 12345, 'id extracted ok');
                    assert.deepEqual(data, {some: 'data'});
                    assert.isFunction(callback, 'third argument is function');
                    done();
                }
            });

            controller.update(request);
        });

        it('calls this._errorOrItem', (done) => {
            const request = {
                params: {id: 12345},
                body: {some: 'data'}
            };
            const response = {some: 'response'};
            const controller = controllerFactory({
                findByIdAndUpdate (id, data, callback) {
                    callback({some: 'error'}, data);
                }
            });

            controller._errorOrItem = (res, item, error) => {
                assert.equal(res, response);
                assert.deepEqual(item, {some: 'data'});
                assert.deepEqual(error, {some: 'error'});

                done();
            };

            controller.update(request, response);
        });
    });

    describe('destroy', () => {
        const request = {
            params: {id: 12345},
            body: {some: 'data'}
        };

        it('calls this.model.findByIdAndRemove', (done) => {
            const controller = controllerFactory({
                findByIdAndRemove (id, callback) {
                    assert.equal(id, 12345, 'id extracted ok');
                    assert.isFunction(callback, 'second argument is function');
                    done();
                }
            });

            controller.destroy(request, null);
        });

        it('renders error if deletion failed', function (done) {
            const controller = controllerFactory({
                findByIdAndRemove (id, callback) {
                    callback({some: 'error'}, id);
                }
            });

            controller._error = (res, error) => {
                assert.deepEqual(error, {some: 'error'});
                done();
            };

            controller.destroy(request, null);
        });

        it('correctly redirects if deletion succeeded', (done) => {
            const controller = controllerFactory({
                findByIdAndRemove (id, callback) {
                    callback(null, id);
                }
            });

            const router = {
                get () {},
                post () {},
                delete () {}
            };

            controller.makeRoutes(router);

            controller.destroy(request, {
                redirect (url) {
                    assert.equal(url, controller.urlRootFull);

                    done();
                }
            });
        });
    });

    describe('makeRoutes', () => {
        it('creates proper routes', () => {
            const controller = controllerFactory({});
            const router = {
                gets: [],
                posts: [],
                dels: [],
                get (url, handler) { //eslint-disable-line no-unused-vars
                    this.gets.push(url);
                },
                post (url, handler) { //eslint-disable-line no-unused-vars
                    this.posts.push(url);
                },
                delete (url, handler) { //eslint-disable-line no-unused-vars
                    this.dels.push(url);
                }
            };

            controller.makeRoutes(router);

            assert.deepEqual(
                router.gets,
                [controller.urlRoot, controller.urlRoot + ':id']
            );
            assert.deepEqual(
                router.posts,
                [controller.urlRoot, controller.urlRoot + ':id']
            );
            assert.deepEqual(
                router.dels,
                [controller.urlRoot + ':id']
            );
        });

        it('properly uses second parameter', function () {
            const controller = controllerFactory({});
            const router = {
                get () {},
                post () {},
                delete () {}
            };

            controller.makeRoutes(router);
            assert.equal(controller.urlRootFull, '/mount/point');

            controller.makeRoutes(router, '/subApplication/');
            assert.equal(controller.urlRootFull, '/subApplication/mount/point');
        });
    });
});
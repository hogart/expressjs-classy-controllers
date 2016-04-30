/* eslint-env mocha */

'use strict';

const test = require('tape');
const path = require('path');
const CrudController = require('../../controllers/CRUD');

const mockResponse = {
    redirect() {},
    status() {
        return this;
    },
    send() {},
    render() {},
};

function controllerFactory(model) {
    return new CrudController({
        viewRoot: 'views/some/path',
        urlRoot: '/mount/point/',
        humanName: 'Nothing here, move along',
        model,
    });
}


test('CRUDController', (assert) => {
    assert.test('constructor', (assert) => {
        assert.test('throws error if model is not passed', (assert) => {
            assert.plan(2);
            assert.throws(
                controllerFactory.bind(null, false),
                /Model not provided/,
                'correct error thrown'
            );

            assert.doesNotThrow(
                controllerFactory.bind(null, {}),
                /./,
                'no errors thrown when model is present'
            );
        });
    });

    assert.test('parseForm', (assert) => {
        assert.test('calls callback', (assert) => {
            CrudController.prototype.parseForm({some: 'data',}, (error, data) => {
                assert.equal(error, null, 'error is null by default');
                assert.deepEqual(data, {some: 'data',});
                assert.end();
            });
        });
    });

    assert.test('parseFormMiddleware', (assert) => {
        assert.test('uses this.parseForm', (assert) => {
            const controller = controllerFactory({});
            controller.parseForm = (data, cb) => {
                assert.deepEqual(data, {some: 'form data',});
                assert.equal(typeof cb, 'function');

                assert.end();
            };

            controller.parseFormMiddleware({body: {some: 'form data',},}, null, () => {});
        });

        assert.test('adds fields to request', (assert) => {
            const controller = controllerFactory({});
            controller.parseForm = (data, cb) => {
                cb({some: 'error',}, {some: 'data',});
            };
            const req = {body: null,};
            controller.parseFormMiddleware(req, null, () => {
                assert.deepEqual(req.parsed, {some: 'data',});
                assert.deepEqual(req.parseError, {some: 'error',});

                assert.end();
            });
        });
    });

    assert.test('_getId', (assert) => {
        assert.test('gets id from various sources', (assert) => {
            const req1 = {params: {id: 1234,}, query: {},};
            const req2 = {params: {}, query: {id: 4321,},};
            const req3 = {params: {id: 1234,}, query: {id: 4321,},};

            assert.equal(CrudController.prototype._getId(req1), 1234, 'from params');
            assert.equal(CrudController.prototype._getId(req2), 4321, 'from query');
            assert.equal(CrudController.prototype._getId(req3), 1234, 'from params first');

            assert.end();
        });
    });

    assert.test('_renderItem', (assert) => {
        assert.test('calls res.render with correct params', (assert) => {
            const controller = controllerFactory({});
            const res = {
                render(viewPath, data) {
                    assert.equal(viewPath, path.normalize('views/some/path/item'));
                    assert.deepEqual(data, {item: {some: 'item',},});

                    assert.end();
                },
            };

            controller._renderItem(res, {item: {some: 'item',},});
        });

        assert.test('throws error when passed object do not contains `item` field', (assert) => {
            const controller = controllerFactory({});

            assert.throws(
                controller._renderItem.bind(controller, null, {some: 'item',}),
                /"item" is not provided for _renderItem/,
                'correct error thrown'
            );

            assert.end();
        });
    });

    assert.test('_renderList', (assert) => {
        assert.test('calls res.render with correct params', (assert) => {
            const controller = controllerFactory({});
            const res = {
                render(viewPath, data) {
                    assert.equal(viewPath, path.normalize('views/some/path/list'));
                    assert.deepEqual(data, {list: ['some', 'list',],}, 'data correctly wrapped to object');
                    assert.end();
                },
            };

            controller._renderList(res, ['some', 'list',]);
        });
    });

    assert.test('_error', (assert) => {
        function createResponseObject() {
            return {
                body: null,
                statusCode: null,
                status(statusCode) {
                    this.statusCode = statusCode;
                    return this;
                },

                send(body) {
                    this.body = body;
                },
            };
        }

        const error = CrudController.prototype._error;

        assert.test('calls correct methods of res', (assert) => {
            const res = createResponseObject();
            error(res, {answer: 42,}, 555);
            assert.equal(res.statusCode, 555);
            assert.deepEqual(res.body, {answer: 42,});

            assert.end();
        });

        assert.test('defaults to 500 status code', (assert) => {
            const res = createResponseObject();
            error(res, {answer: 42,});
            assert.equal(res.statusCode, 500);
            assert.deepEqual(res.body, {answer: 42,});

            assert.end();
        });
    });

    assert.test('list', (assert) => {
        function modelFactory() {
            const model = {
                query: null,
                fields: null,
                error: null,
            };
            model.find = function (query, fields) {
                this.query = query;
                this.fields = fields;

                return {
                    then(resolve, reject) {
                        if (model.error) {
                            reject(model.error);
                        } else {
                            resolve(['some', 'data',]);
                        }
                    },
                };
            };

            return model;
        }

        assert.test('fetches data from model and renders list', (assert) => {
            const model = modelFactory();
            const controller = controllerFactory(model);

            controller._renderList = function (res, list) {
                assert.deepEqual(res, {some: 'response',}, 'response object passed correctly');
                assert.equal(model.fields, '', 'list of fields by default is empty string');
                assert.deepEqual(list, ['some', 'data',], 'rendering list returned from model');

                assert.end();
            };

            controller.list(null, {some: 'response',});
        });

        assert.test('uses listFields if defined', (assert) => {
            const model = modelFactory();
            const controller = controllerFactory(model);

            controller.listFields = 'id name title createdAt';

            controller._renderList = () => {
                assert.equal(model.fields, 'id name title createdAt', 'list of fields used to create request');
                assert.end();
            };

            controller.list();
        });

        assert.test('calls listQuery', (assert) => {
            const model = modelFactory();
            const controller = controllerFactory(model);

            controller.listQuery = (req, res) => {
                assert.deepEqual(req, {some: 'request',});
                assert.deepEqual(res, {some: 'response',});
                return {some: 'query',};
            };

            controller._renderList = () => {
                assert.deepEqual(model.query, {some: 'query',});
                assert.end();
            };

            controller.list({some: 'request',}, {some: 'response',});
        });

        assert.test('sends error if error occured during fetching', (assert) => {
            const model = modelFactory();
            const controller = controllerFactory(model);
            function render() {}

            model.error = {some: 'error',};

            controller._error = function (res, error) {
                assert.deepEqual(res, {some: 'response', render,}, 'response object passed correctly');
                assert.deepEqual(error, {some: 'error',}, 'error object passed correctly');
                assert.end();
            };

            controller.list(null, {some: 'response', render,});
        });
    });

    assert.test('create', (assert) => {
        assert.test('renders item with additional error object, if request contains req.parseError', (assert) => {
            const controller = controllerFactory({});

            controller._renderItem = (res, data) => {
                assert.ok(data.hasOwnProperty('item'));
                assert.deepEqual(data.error, {some: 'error',});

                assert.end();
            };

            controller.create({body: null, parseError: {some: 'error',}, parsed: {some: 'item',},});
        });

        assert.test('calls this.model.create with proper data', (assert) => {
            const controller = controllerFactory({
                create(data) {
                    assert.deepEqual(data, {some: 'data',}, 'model.create called with correct data');

                    return {
                        then(resolve) {
                            resolve(data);
                            assert.end();
                        },
                    };
                },
            });

            controller.create({parsed: {some: 'data',},}, mockResponse);
        });

        assert.test('redirects when item successfully created', (assert) => {
            const controller = controllerFactory({
                create(data) {
                    return {
                        then(resolve) {
                            resolve(data);
                        },
                    };
                },
            });

            const res = {
                redirect(status, url) {
                    assert.equal(url, path.normalize('/mount/point/some id'));
                    assert.end();
                },
                status() {
                    return this;
                },
                send() {},
            };

            controller.create({parsed: {id: 'some id',}, parseError: null,}, res);
        });
    });

    assert.test('read', (assert) => {
        assert.test('calls this.model.findById', (assert) => {
            const controller = controllerFactory({
                findById(id) {
                    assert.equal(id, 12345, 'id was extracted');
                    return {
                        then() {
                            assert.end();
                        },
                    };
                },
            });
            const request = {params: {id: 12345,},};

            controller.read(request, mockResponse);
        });

        assert.test('calls _renderItem if model resolved', (assert) => {
            const controller = controllerFactory({
                findById(id) {
                    return {
                        then(resolve, reject) { // eslint-disable-line no-unused-vars
                            resolve({id,});
                        },
                    };
                },
            });
            const request = {params: {id: 12345,},};

            controller._renderItem = (res, data) => {
                assert.deepEqual(data, {item: {id: 12345,},});
                assert.end();
            };

            controller.read(request, mockResponse);
        });

        assert.test('calls _error if model rejected', (assert) => {
            const controller = controllerFactory({
                findById() {
                    return {
                        then(resolve, reject) {
                            reject({some: 'error',});
                        },
                    };
                },
            });
            const request = {params: {id: 12345,},};

            controller._error = (res, error) => {
                assert.deepEqual(error, {some: 'error',});
                assert.end();
            };

            controller.read(request, mockResponse);
        });
    });

    assert.test('update', (assert) => {
        assert.test('renders item again along with errors from parsing', (assert) => {
            const controller = controllerFactory({});

            controller._renderItem = (res, item) => {
                assert.deepEqual(item.error, {some: 'error',}, 'error object ok');
                assert.deepEqual(item.item, {some: 'object',}, 'item object ok');
                assert.end();
            };

            controller.update({parsed: {some: 'object',}, parseError: {some: 'error',},}, mockResponse);
        });

        assert.test('calls this.model.findByIdAndUpdate', (assert) => {
            const request = {
                params: {id: 12345,},
                parsed: {some: 'data',},
            };
            const controller = controllerFactory({
                findByIdAndUpdate(id, data) {
                    assert.equal(id, 12345, 'id extracted ok');
                    assert.deepEqual(data, {some: 'data',});

                    return {
                        then(resolve) {
                            resolve();
                            assert.end();
                        },
                    };
                },
            });

            controller.update(request, mockResponse);
        });

        assert.test('calls _renderItem if model resolved', (assert) => {
            const controller = controllerFactory({
                findByIdAndUpdate(id, data) {
                    return {
                        then(resolve, reject) { // eslint-disable-line no-unused-vars
                            resolve(data);
                        },
                    };
                },
            });
            const request = {
                params: {id: 12345,},
                parsed: {some: 'data',},
            };

            controller._renderItem = (res, data) => {
                assert.deepEqual(data, {item: {some: 'data',},});
                assert.end();
            };

            controller.update(request, mockResponse);
        });

        assert.test('calls _error if model rejected', (assert) => {
            const controller = controllerFactory({
                findByIdAndUpdate(id, data) { // eslint-disable-line no-unused-vars
                    return {
                        then(resolve, reject) { // eslint-disable-line no-unused-vars
                            reject({some: 'error',});
                        },
                    };
                },
            });
            const request = {params: {id: 12345,},};

            controller._error = (res, error) => {
                assert.deepEqual(error, {some: 'error',});
                assert.end();
            };

            controller.update(request, mockResponse);
        });
    });

    assert.test('destroy', (assert) => {
        const request = {
            params: {id: 12345,},
            body: {some: 'data',},
        };

        assert.test('calls this.model.findByIdAndRemove', (assert) => {
            const controller = controllerFactory({
                findByIdAndRemove(id) {
                    assert.equal(id, 12345, 'id extracted ok');

                    return {
                        then(resolve) {
                            resolve();
                            assert.end();
                        },
                    };
                },
            });

            controller.destroy(request, mockResponse);
        });

        assert.test('renders error if deletion failed', (assert) => {
            const controller = controllerFactory({
                findByIdAndRemove() {
                    return {
                        then(resolve, reject) {
                            reject({some: 'error',});
                        },
                    };
                },
            });

            controller._error = (res, error) => {
                assert.deepEqual(error, {some: 'error',});
                assert.end();
            };

            controller.destroy(request, mockResponse);
        });

        assert.test('correctly redirects if deletion succeeded', (assert) => {
            const controller = controllerFactory({
                findByIdAndRemove(id) {
                    return {
                        then(resolve) {
                            resolve(id);
                        },
                    };
                },
            });

            const router = {
                get() {},
                post() {},
                delete() {},
            };

            controller.makeRoutes(router);

            controller.destroy(request, {
                redirect(status, url) {
                    assert.equal(url, controller.urlRootFull);

                    assert.end();
                },
            });
        });
    });

    assert.test('makeRoutes', (assert) => {
        assert.test('creates proper routes', (assert) => {
            const controller = controllerFactory({});
            const router = {
                gets: [],
                posts: [],
                dels: [],
                middlewares: {
                    0: [],
                    1: [],
                },
                postMw: [],
                get(url, mw, handler) { // eslint-disable-line no-unused-vars
                    this.middlewares[mw.length].push(mw);
                    this.gets.push(url);
                },
                post(url, mw, handler) { // eslint-disable-line no-unused-vars
                    this.middlewares[mw.length].push(mw);
                    this.postMw.push(mw[0]);
                    this.posts.push(url);
                },
                delete(url, mw, handler) { // eslint-disable-line no-unused-vars
                    this.middlewares[mw.length].push(mw);
                    this.dels.push(url);
                },
            };

            controller.makeRoutes(router);

            assert.deepEqual(
                router.gets,
                [controller.urlRoot, `${controller.urlRoot}:id`,]
            );
            assert.deepEqual(
                router.posts,
                [controller.urlRoot, `${controller.urlRoot}:id`,]
            );
            assert.deepEqual(
                router.dels,
                [`${controller.urlRoot}:id`,]
            );

            assert.equal(router.middlewares[0].length, 3, '3 default empty middlewares');
            assert.equal(router.middlewares[1].length, 2, '2 middlewares consisting of just one middleware');
            assert.equal(router.postMw[0], router.postMw[1], 'middlewares were correctly added to post requests');

            assert.end();
        });

        assert.test('properly uses second parameter', (assert) => {
            const controller = controllerFactory({});
            const router = {
                get() {},
                post() {},
                delete() {},
            };

            controller.makeRoutes(router);
            assert.equal(controller.urlRootFull, path.normalize('/mount/point/'));

            controller.makeRoutes(router, '/subApplication/');
            assert.equal(controller.urlRootFull, path.normalize('/subApplication/mount/point/'));

            assert.end();
        });
    });
});
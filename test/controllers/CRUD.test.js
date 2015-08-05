/* eslint-env mocha */

'use strict';

const assert = require('chai').assert;
const path = require('path');
const CrudController = require('../../controllers/CRUD');

const mockResponse = {
    redirect () {},
    status () {
        return this;
    },
    send () {},
    render () {}
};

describe('CRUDController', () => {
    function controllerFactory (model) {
        return new CrudController({
            viewRoot: 'views/some/path',
            urlRoot: '/mount/point/',
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

    describe('parseFormMiddleware', () => {
        it('uses this.parseForm', (done) => {
            const controller = controllerFactory({});
            controller.parseForm = (data, cb) => {
                assert.deepEqual(data, {some: 'form data'});
                assert.isFunction(cb);
                done();
            };

            controller.parseFormMiddleware({body: {some: 'form data'}}, null, () => {});
        });

        it('adds fields to request', (done) => {
            const controller = controllerFactory({});
            controller.parseForm = (data, cb) => {
                cb({some: 'error'}, {some: 'data'});
            };
            const req = {body: null};
            controller.parseFormMiddleware(req, null, () => {
                assert.deepEqual(req.parsed, {some: 'data'});
                assert.deepEqual(req.parseError, {some: 'error'});

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

    describe('list', () => {
        const model = {
            find (query, fields) {
                this.query = query;
                this.fields = fields;
                return {
                    then (resolve, rej) {
                        if (model.error) {
                            rej(model.error);
                        } else {
                            resolve(['some', 'data']);
                        }
                    }
                };
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

        it('calls listQuery', (done) => {
            const controller = controllerFactory(model);

            controller.listQuery = (req, res) => {
                assert.deepEqual(req, {some: 'request'});
                assert.deepEqual(res, {some: 'response'});
                return {some: 'query'};
            };

            controller._renderList = () => {
                assert.deepEqual(model.query, {some: 'query'});
                done();
            };

            controller.list({some: 'request'}, {some: 'response'});
        });

        it('sends error if error occured during fetching', (done) => {
            const controller = controllerFactory(model);
            function render () {}

            model.error = {some: 'error'};

            controller._error = function (res, error) {
                assert.deepEqual(res, {some: 'response', render}, 'response object passed correctly');
                assert.deepEqual(error, {some: 'error'}, 'error object passed correctly');
                done();
            };

            controller.list(null, {some: 'response', render});
        });
    });

    describe('create', () => {
        it('renders item with additional error object, if request contains req.parseError', (done) => {
            const controller = controllerFactory({});

            controller._renderItem = (res, data) => {
                assert.property(data, 'item');
                assert.deepEqual(data.error, {some: 'error'});

                done();
            };

            controller.create({body: null, parseError: {some: 'error'}, parsed: {some: 'item'}});
        });

        it('calls this.model.create with proper data', (done) => {
            const controller = controllerFactory({
                create (data) {
                    assert.deepEqual(data, {some: 'data'}, 'model.create called with correct data');

                    return {
                        then (resolve) {
                            resolve(data);
                            done();
                        }
                    };
                }
            });

            controller.create({parsed: {some: 'data'}}, mockResponse);
        });

        it('redirects when item successfully created', (done) => {
            const controller = controllerFactory({
                create (data) {
                    return {
                        then (resolve) {
                            resolve(data);
                        }
                    };
                }
            });

            const res = {
                redirect (status, url) {
                    assert.equal(url, path.normalize('/mount/point/some id'));
                    done();
                },
                status () {
                    return this;
                },
                send () {}
            };

            controller.create({parsed: {id: 'some id'}, parseError: null}, res);
        });
    });

    describe('read', () => {
        it('calls this.model.findById', (done) => {
            const controller = controllerFactory({
                findById (id) {
                    assert.equal(id, 12345, 'id was extracted');
                    return {
                        then () {
                            done();
                        }
                    };
                }
            });
            const request = {params: {id: 12345}};

            controller.read(request, mockResponse);
        });

        it('calls _renderItem if model resolved', (done) => {
            const controller = controllerFactory({
                findById (id) {
                    return {
                        then (resolve, reject) { //eslint-disable-line no-unused-vars
                            resolve({id});
                        }
                    };
                }
            });
            const request = {params: {id: 12345}};

            controller._renderItem = (res, data) => {
                assert.deepEqual(data, {item: {id: 12345}});
                done();
            };

            controller.read(request, mockResponse);
        });

        it('calls _error if model rejected', (done) => {
            const controller = controllerFactory({
                findById () {
                    return {
                        then (resolve, reject) {
                            reject({some: 'error'});
                        }
                    };
                }
            });
            const request = {params: {id: 12345}};

            controller._error = (res, error) => {
                assert.deepEqual(error, {some: 'error'});
                done();
            };

            controller.read(request, mockResponse);
        });
    });

    describe('update', () => {
        it('renders item again along with errors from parsing', (done) => {
            const controller = controllerFactory({});

            controller._renderItem = (res, item) => {
                assert.deepEqual(item.error, {some: 'error'}, 'error object ok');
                assert.deepEqual(item.item, {some: 'object'}, 'item object ok');
                done();
            };

            controller.update({parsed: {some: 'object'}, parseError: {some: 'error'}}, mockResponse);
        });

        it('calls this.model.findByIdAndUpdate', (done) => {
            const request = {
                params: {id: 12345},
                parsed: {some: 'data'}
            };
            const controller = controllerFactory({
                findByIdAndUpdate (id, data) {
                    assert.equal(id, 12345, 'id extracted ok');
                    assert.deepEqual(data, {some: 'data'});

                    return {
                        then (resolve) {
                            resolve();
                            done();
                        }
                    };
                }
            });

            controller.update(request, mockResponse);
        });

        it('calls _renderItem if model resolved', (done) => {
            const controller = controllerFactory({
                findByIdAndUpdate (id, data) {
                    return {
                        then (resolve, reject) { //eslint-disable-line no-unused-vars
                            resolve(data);
                        }
                    };
                }
            });
            const request = {
                params: {id: 12345},
                parsed: {some: 'data'}
            };

            controller._renderItem = (res, data) => {
                assert.deepEqual(data, {item: {some: 'data'}});
                done();
            };

            controller.update(request, mockResponse);
        });

        it('calls _error if model rejected', (done) => {
            const controller = controllerFactory({
                findByIdAndUpdate (id, data) { //eslint-disable-line no-unused-vars
                    return {
                        then (resolve, reject) { //eslint-disable-line no-unused-vars
                            reject({some: 'error'});
                        }
                    };
                }
            });
            const request = {params: {id: 12345}};

            controller._error = (res, error) => {
                assert.deepEqual(error, {some: 'error'});
                done();
            };

            controller.update(request, mockResponse);
        });
    });

    describe('destroy', () => {
        const request = {
            params: {id: 12345},
            body: {some: 'data'}
        };

        it('calls this.model.findByIdAndRemove', (done) => {
            const controller = controllerFactory({
                findByIdAndRemove (id) {
                    assert.equal(id, 12345, 'id extracted ok');

                    return {
                        then (resolve) {
                            resolve();
                            done();
                        }
                    };
                }
            });

            controller.destroy(request, mockResponse);
        });

        it('renders error if deletion failed', function (done) {
            const controller = controllerFactory({
                findByIdAndRemove () {
                    return {
                        then (resolve, reject) {
                            reject({some: 'error'});
                        }
                    };
                }
            });

            controller._error = (res, error) => {
                assert.deepEqual(error, {some: 'error'});
                done();
            };

            controller.destroy(request, mockResponse);
        });

        it('correctly redirects if deletion succeeded', (done) => {
            const controller = controllerFactory({
                findByIdAndRemove (id) {
                    return {
                        then (resolve) {
                            resolve(id);
                        }
                    };
                }
            });

            const router = {
                get () {},
                post () {},
                delete () {}
            };

            controller.makeRoutes(router);

            controller.destroy(request, {
                redirect (status, url) {
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
                middlewares: {
                    0: [],
                    1: []
                },
                postMw: [],
                get (url, mw, handler) { //eslint-disable-line no-unused-vars
                    this.middlewares[mw.length].push(mw);
                    this.gets.push(url);
                },
                post (url, mw, handler) { //eslint-disable-line no-unused-vars
                    this.middlewares[mw.length].push(mw);
                    this.postMw.push(mw[0]);
                    this.posts.push(url);
                },
                delete (url, mw, handler) { //eslint-disable-line no-unused-vars
                    this.middlewares[mw.length].push(mw);
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

            assert.lengthOf(router.middlewares[0], 3, '3 default empty middlewares');
            assert.lengthOf(router.middlewares[1], 2, '2 middlewares consisting of just one middleware');
            assert.equal(router.postMw[0], router.postMw[1], 'middlewares were correctly added to post requests');
        });

        it('properly uses second parameter', function () {
            const controller = controllerFactory({});
            const router = {
                get () {},
                post () {},
                delete () {}
            };

            controller.makeRoutes(router);
            assert.equal(controller.urlRootFull, path.normalize('/mount/point/'));

            controller.makeRoutes(router, '/subApplication/');
            assert.equal(controller.urlRootFull, path.normalize('/subApplication/mount/point/'));
        });
    });
});
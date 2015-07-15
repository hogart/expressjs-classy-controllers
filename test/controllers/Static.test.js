/* eslint-env mocha */

'use strict';

const assert = require('chai').assert;

const StaticController = require('../../controllers/Static');

describe('StaticController', () => {
    describe('makeRoutes', () => {
        it('correctly calls router.get', (done) => {
            const sc = new StaticController({
                viewRoot: 'views/some/path',
                urlRoot: '/mount/point',
                humanName: 'Nothing here, move along'
            });

            const router = {
                get (urlRoot, boundFn) {
                    assert.equal(urlRoot, '/mount/point', 'router.get got correct url');
                    assert.isFunction(boundFn, 'router.get got handler');
                    done();
                }
            };

            sc.makeRoutes(router);
        });
    });

    describe('index', () => {
        it('calls correct render', (done) => {
            const sc = new StaticController({
                viewRoot: 'views/some/path',
                urlRoot: '/mount/point',
                humanName: 'Nothing here, move along'
            });

            const res = {
                render (viewName) {
                    assert.equal(viewName, 'views/some/path', 'res.render with correct path to view');
                    done();
                }
            };

            sc.index(null, res);
        });

        it('call getData if it is defined', (done) => {
            class MyStaticController extends StaticController {
                getData (req, res) { //eslint-disable-line no-unused-vars
                    return {originalUrl: req.originalUrl};
                }
            }

            const sc = new MyStaticController({
                viewRoot: 'views/some/path',
                urlRoot: '/mount/point',
                humanName: 'Nothing here, move along'
            });

            const req = {
                originalUrl: '/somePath/?query=42'
            };
            const res = {
                render (viewName, data) {
                    assert.equal(viewName, 'views/some/path', 'res.render with correct path to view');
                    assert.deepEqual(data, {originalUrl: '/somePath/?query=42'}, 'res.render with correct data');
                    done();
                }
            };

            sc.index(req, res);
        });
    });
});
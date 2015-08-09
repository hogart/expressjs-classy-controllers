/* eslint-env mocha */

'use strict';

const assert = require('chai').assert;
const StaticController = require('../../controllers/Static');
function controllerFactory (params) {
    return new StaticController(params || {
        viewRoot: 'views/some/path',
        urlRoot: '/mount/point',
        humanName: 'Nothing here, move along'
    });
}

describe('StaticController', () => {
    describe('makeRoutes', () => {
        it('correctly calls router.get', (done) => {
            const sc = controllerFactory();
            const router = {
                get (urlRoot, mw, boundFn) {
                    assert.equal(urlRoot, '/mount/point', 'router.get got correct url');
                    assert.isFunction(boundFn, 'router.get got handler');
                    assert.lengthOf(mw, 0, 'empty middleware list');
                    done();
                }
            };

            sc.makeRoutes(router);
        });
    });

    describe('index', () => {
        it('calls correct render', (done) => {
            const sc = controllerFactory();
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
                    assert.ok(true, 'called getData');
                    return Promise.resolve({originalUrl: req.originalUrl});
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
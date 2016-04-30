'use strict';

const test = require('tape');
const StaticController = require('../../controllers/Static');
function controllerFactory(params) {
    return new StaticController(params || {
        viewRoot: 'views/some/path',
        urlRoot: '/mount/point',
        humanName: 'Nothing here, move along',
    });
}

test('StaticController', (assert) => {
    assert.test('makeRoutes', (assert) => {
        assert.test('correctly calls router.get', (assert) => {
            const sc = controllerFactory();
            const router = {
                get(urlRoot, mw, boundFn) {
                    assert.equal(urlRoot, '/mount/point', 'router.get got correct url');
                    assert.equal(typeof boundFn, 'function', 'router.get got handler');
                    assert.equal(mw.length, 0, 'empty middleware list');
                    assert.end();
                },
            };

            sc.makeRoutes(router);
        });
    });

    assert.test('index', (assert) => {
        assert.test('calls correct render', (assert) => {
            const sc = controllerFactory();
            const res = {
                render(viewName) {
                    assert.equal(viewName, 'views/some/path', 'res.render with correct path to view');
                    assert.end();
                },
            };

            sc.index(null, res);
        });

        assert.test('call getData if it is defined', (assert) => {
            class MyStaticController extends StaticController {
                getData(req, res) { // eslint-disable-line no-unused-vars
                    assert.ok(true, 'called getData');
                    return Promise.resolve({originalUrl: req.originalUrl,});
                }
            }

            const sc = new MyStaticController({
                viewRoot: 'views/some/path',
                urlRoot: '/mount/point',
                humanName: 'Nothing here, move along',
            });

            const req = {
                originalUrl: '/somePath/?query=42',
            };
            const res = {
                render(viewName, data) {
                    assert.equal(viewName, 'views/some/path', 'res.render with correct path to view');
                    assert.deepEqual(data, {originalUrl: '/somePath/?query=42',}, 'res.render with correct data');

                    assert.end();
                },
            };

            sc.index(req, res);
        });
    });
});
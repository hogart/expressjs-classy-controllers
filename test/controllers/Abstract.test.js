'use strict';

const test = require('tape');
const path = require('path');
const AbstractController = require('../../controllers/Abstract');
function controllerFactory(params) {
    return new AbstractController(params || {
        viewRoot: 'views/some/path',
        urlRoot: '/mount/point',
        humanName: 'Nothing here, move along',
    });
}

test('AbstractController', (assert) => {
    assert.test('.getLink', (assert) => {
        assert.plan(1);

        const ac = controllerFactory();

        assert.deepEqual(
            ac.getLink(),
            ['mount/point', 'Nothing here, move along',],
            'getLink returned correct array'
        );
    });

    assert.test('.makeRoutes', (assert) => {
        assert.plan(1);

        const ac = controllerFactory();

        assert.throws(
            ac.makeRoutes.bind(ac),
            /Pure virtual call/,
            'correct error thrown'
        );
    });

    assert.test('.makeFullRoot', (assert) => {
        assert.plan(2);

        const ac = controllerFactory();
        ac.makeFullRoot('/some/path');
        assert.equal(ac.urlRootFull, path.normalize('/some/path/mount/point'));

        ac.makeFullRoot();
        assert.equal(ac.urlRootFull, path.normalize('/mount/point'));
    });

    assert.test('routes creating', (assert) => {
        assert.plan(2);

        function createController(router) {
            return new AbstractController({
                viewRoot: 'views/some/path',
                urlRoot: '/mount/point',
                humanName: 'Nothing here, move along',
                router,
            });
        }

        assert.throws(
            createController.bind(null, {}),
            /Pure virtual call/,
            'makeRoutes was called'
        );

        assert.doesNotThrow(
            createController.bind(null, false),
            /./,
            'makeRoutes was not called'
        );
    });

    assert.test('.setMiddleware', (assert) => {
        assert.plan(4);

        let controller = controllerFactory();
        controller.setMiddleware();
        assert.deepEqual(controller.middleware, [], 'returns empty array if no middlewares present');


        let mw = () => {};
        controller = controllerFactory();
        controller.setMiddleware(mw);

        assert.deepEqual(controller.middleware, [mw,], 'returns array if function is passed');


        mw = [() => {},];
        controller = controllerFactory();
        controller.setMiddleware(mw);

        assert.deepEqual(controller.middleware, mw, 'returns array unchanged');

        controller = controllerFactory();
        function mw1() {}
        function mw2() {}

        controller.setMiddleware(mw1);
        controller.setMiddleware(mw2);

        assert.deepEqual(controller.middleware, [mw1, mw2,], 'appends new middlewares, if middlewares already present');
    });

    assert.end();
});
/* eslint-env mocha */

'use strict';

const assert = require('chai').assert;
const path = require('path');
const AbstractController = require('../../controllers/Abstract');
function controllerFactory (params) {
    return new AbstractController(params || {
        viewRoot: 'views/some/path',
        urlRoot: '/mount/point',
        humanName: 'Nothing here, move along'
    });
}

describe('AbstractController', () => {
    describe('getLink', () => {
        it('returns correct array', () => {
            const ac = controllerFactory();

            assert.deepEqual(ac.getLink(), ['mount/point', 'Nothing here, move along'], 'getLink returned correct array');
        });
    });

    describe('makeRoutes', () => {
        it('throws correct error', () => {
            const ac = controllerFactory();

            assert.throws(ac.makeRoutes.bind(ac), /Pure virtual call/, 'correct error thrown');
        });
    });

    describe('makeFullRoot', () => {
        it('assigns urlRootFull property', () => {
            const ac = controllerFactory();
            assert.changes(
                ac.makeFullRoot.bind(ac, '/some/path'),
                ac,
                'urlRootFull'
            );
            assert.equal(ac.urlRootFull, path.normalize('/some/path/mount/point'));
        });

        it('argument defaults to empty string', () => {
            const ac = controllerFactory();
            ac.makeFullRoot();
            assert.equal(ac.urlRootFull, path.normalize('/mount/point'));
        });
    });

    describe('routes creating', () => {
        it('calls makeRoutes if truthie router is passed', () => {
            function createController (router) {
                return new AbstractController({
                    viewRoot: 'views/some/path',
                    urlRoot: '/mount/point',
                    humanName: 'Nothing here, move along',
                    router: router
                });
            }

            assert.throws(
                createController.bind(null, {}),
                /Pure virtual call/,
                'makeRoutes was called'
            );

            assert.doesNotThrow(
                createController.bind(null, false),
                'makeRoutes was not called'
            );
        });
    });

    describe('setMiddleware', function () {
        it('returns empty array if no middlewares present', () => {
            const controller = controllerFactory();
            controller.setMiddleware();
            assert.deepEqual(controller.middleware, []);
        });

        it('returns array if function is passed', () => {
            const mw = () => {};
            const controller = controllerFactory();
            controller.setMiddleware(mw);

            assert.isArray(controller.middleware);
            assert.lengthOf(controller.middleware, 1);
            assert.equal(mw, controller.middleware[0]);
        });

        it('returns array unchanged', function () {
            const mw = [() => {}];
            const controller = controllerFactory();
            controller.setMiddleware(mw);

            assert.deepEqual(controller.middleware, mw);
        });

        it('appends new middlewares, if middlewares already present', () => {
            const controller = controllerFactory();
            function mw1 () {}
            function mw2 () {}

            controller.setMiddleware(mw1);
            controller.setMiddleware(mw2);

            assert.deepEqual(controller.middleware, [mw1, mw2]);
        });
    });
});
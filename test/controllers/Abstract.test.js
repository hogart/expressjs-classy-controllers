/* eslint-env mocha */

'use strict';

const assert = require('chai').assert;
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
            assert.equal(ac.urlRootFull, '/some/path/mount/point');
        });

        it('argument defaults to empty string', () => {
            const ac = controllerFactory();
            ac.makeFullRoot();
            assert.equal(ac.urlRootFull, '/mount/point');
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
});
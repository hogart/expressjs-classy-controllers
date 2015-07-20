/* eslint-env mocha */

'use strict';

var assert = require('chai').assert;
var AbstractController = require('../../controllers/Abstract');
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
            var ac = controllerFactory();

            assert.deepEqual(ac.getLink(), ['mount/point', 'Nothing here, move along'], 'getLink returned correct array');
        });
    });

    describe('makeRoutes', () => {
        it('throws correct error', () => {
            var ac = controllerFactory();

            assert.throws(ac.makeRoutes.bind(ac), /Pure virtual call/, 'correct error thrown');
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
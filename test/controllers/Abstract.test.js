/* eslint-env mocha */

'use strict';

var assert = require('chai').assert;

var AbstractController = require('../../controllers/Abstract');

describe('AbstractController', function () {
    it('has desired properties', function () {
        assert.isFunction(AbstractController);
        assert.isFunction(AbstractController.extend);
    });

    describe('getLink', function () {
        it('returns correct array', function () {
            var ac = new AbstractController({
                viewRoot: 'views/some/path',
                urlRoot: '/mount/point',
                humanName: 'Nothing here, move along'
            });

            assert.deepEqual(ac.getLink(), ['mount/point', 'Nothing here, move along']);
        });
    });

    describe('makeRoutes', function () {
        it('throws correct error', function () {
            var ac = new AbstractController({
                viewRoot: 'views/some/path',
                urlRoot: '/mount/point',
                humanName: 'Nothing here, move along'
            });

            assert.throws(ac.makeRoutes.bind(ac), /Pure virtual call/, 'correct error thrown');
        })
    })
});
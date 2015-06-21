/* eslint-env mocha */

'use strict';

var assert = require('chai').assert;

var inherit = require('../../lib/inherit');

describe('inherit', function () {
    it('throws an error being called as standalone function', function () {
        assert.throws(
            function () {
                inherit({});
            },
            /undefined/,
            'succesfully thrown correct error'
        );
    });

    it('returns function', function () {
        var Child = inherit.call(function () {}, {});
        assert.isFunction(Child);
    });

    it('correctly sets prototype chain', function () {
        function Parent () {}
        var Child = inherit.call(Parent, {});

        assert.instanceOf(new Child(), Parent);
    });

    it('child has desired properties', function () {
        function Parent () {}
        Parent.prototype.parentMethod = function () {};
        Parent.parentStatic = function () {};

        var Child = inherit.call(Parent, {
            childMethod: function () {}
        }, {
            childStatic: function () {}
        });

        var child = new Child();
        assert.isFunction(child.parentMethod, 'parent method inherited ok');
        assert.isFunction(child.childMethod, 'child method added ok');

        assert.isFunction(Child.parentStatic, 'static inherited ok');
        assert.isFunction(Child.childStatic, 'static added ok');
    });
});

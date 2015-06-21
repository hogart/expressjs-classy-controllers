'use strict';

var has = Object.prototype.hasOwnProperty;

function copyProps (obj) {
    for (var i = 1; i < arguments.length; ++i) {
        var source = arguments[i];
        if (source) {
            for (var prop in source) {
                obj[prop] = source[prop];
            }
        }
    }
    return obj;
}

function inherit (protoProps, staticProps) {
    var parent = this;
    var child;

    if (protoProps && has.call(protoProps, 'constructor')) {
        child = protoProps.constructor;
    } else {
        child = function () {
            return parent.apply(this, arguments);
        };
    }

    copyProps(child, parent, staticProps);

    var Surrogate = function () {
        this.constructor = child;
    };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate();

    if (protoProps) {
        copyProps(child.prototype, protoProps);
    }

    child.__super__ = parent.prototype;

    return child;
}

module.exports = inherit;
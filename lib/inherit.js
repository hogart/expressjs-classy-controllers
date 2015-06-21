'use strict';

var xtend = require('xtend');
var has = Object.prototype.hasOwnProperty.call;

function extend (protoProps, staticProps) {
    var parent = this;
    var child;

    if (protoProps && has(protoProps, 'constructor')) {
        child = protoProps.constructor;
    } else {
        child = function () {
            return parent.apply(this, arguments);
        };
    }

    child = xtend(child, parent);

    if (staticProps) {
        child = xtend(child, staticProps);
    }

    var Surrogate = function () {
        this.constructor = child;
    };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate();

    if (protoProps) {
        child.prototype = xtend(child.prototype, protoProps);
    }

    child.__super__ = parent.prototype;

    return child;
}

module.exports = extend;
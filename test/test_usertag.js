
const test = require('tape').test;
const usertag_mod = require('../usertag.js');

const UserTag = usertag_mod.UserTag;
const tagequal = usertag_mod.tagequal;

test('usertag str=str', function(t) {
        t.assert(tagequal('foo', 'foo'));
        t.assert(!tagequal('foo', 'bar'));
        t.end();
});

test('usertag simple tags', function(t) {
        t.assert(tagequal(new UserTag('foo'), new UserTag('foo')));
        t.assert(!tagequal(new UserTag('foo'), new UserTag('bar')));
        t.assert(!tagequal(new UserTag('foo'), 'bar'));
        t.assert(!tagequal('bar', new UserTag('bar')));
        t.end();
});

test('usertag tag children', function(t) {
        t.assert(tagequal(
                new UserTag('foo', []), 
                new UserTag('foo')
        ));
        t.assert(tagequal(
                new UserTag('foo', [ 'xyz' ]), 
                new UserTag('foo', [ 'xyz' ])
        ));
        t.assert(!tagequal(
                new UserTag('xfoo', [ 'xyz' ]), 
                new UserTag('foo', [ 'xyz' ])
        ));
        t.assert(!tagequal(
                new UserTag('foo', [ 'xyz' ]), 
                new UserTag('foo', [ 'axyz' ])
        ));
        t.assert(!tagequal(
                new UserTag('foo', [ 'xyz' ]), 
                new UserTag('foo', [ 'xyz', 'foo' ])
        ));
        t.assert(!tagequal(
                new UserTag('foo', [ 'xyz', 'foo' ]), 
                new UserTag('foo', [ 'xyz' ])
        ));
        t.end();
});

test('usertag tag children', function(t) {
        t.assert(tagequal(
                new UserTag('foo', [ new UserTag('bar') ]), 
                new UserTag('foo', [ new UserTag('bar') ])
        ));
        t.assert(!tagequal(
                new UserTag('foo', [ new UserTag('bar') ]), 
                new UserTag('foo', [ new UserTag('zaz') ])
        ));
        t.end();
});


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

test('usertag nameless tags', function(t) {
        t.assert(tagequal(new UserTag(), new UserTag()));
        t.assert(tagequal(new UserTag(['x']), new UserTag(['x'])));
        t.assert(!tagequal(new UserTag(['x']), new UserTag(['y'])));
        t.assert(!tagequal(new UserTag(['x']), new UserTag([])));
        t.assert(!tagequal(new UserTag('x', []), new UserTag([])));
        t.end();
});

test('usertag empty attrs', function(t) {
        t.assert(tagequal(new UserTag('foo'), new UserTag('foo', [])));
        t.assert(tagequal(new UserTag('foo'), new UserTag('foo', {}, [])));
        t.assert(tagequal(new UserTag('foo', undefined, undefined), new UserTag('foo', {}, [])));
        t.assert(tagequal(new UserTag('foo'), new UserTag('foo', null, [])));
        t.assert(tagequal(new UserTag('foo'), new UserTag('foo', undefined, [])));
        t.end();
});

test('usertag simple children', function(t) {
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

test('usertag attrs and children', function(t) {
        t.assert(tagequal(
                new UserTag('foo', 'text'), 
                new UserTag('foo', {}, 'text')
        ));
        t.assert(tagequal(
                new UserTag('foo', 'text'), 
                new UserTag('foo', {}, ['text'])
        ));
        t.assert(tagequal(
                new UserTag('foo', {}), 
                new UserTag('foo', {})
        ));
        t.assert(tagequal(
                new UserTag('foo', { bar:'xx' }), 
                new UserTag('foo', { bar:'xx' })
        ));
        t.assert(!tagequal(
                new UserTag('foo'), 
                new UserTag('foo', { bar:'xx' }, [])
        ));
        t.assert(!tagequal(
                new UserTag('foo', { bar:'xx' }), 
                new UserTag('foo', { bar:'yy' })
        ));
        t.assert(!tagequal(
                new UserTag('foo', { bar:'xx' }), 
                new UserTag('foo', { zork:'xx' })
        ));
        t.assert(tagequal(
                new UserTag('foo', { bar:'xx' }, 'text'), 
                new UserTag('foo', { bar:'xx' }, 'text')
        ));
        t.assert(tagequal(
                new UserTag('foo', { bar:'xx' }, 'text'), 
                new UserTag('foo', [ { key:'bar', val:'xx' } ], 'text')
        ));
        t.assert(tagequal(
                new UserTag('foo', { bar:'xx' }, [ 'text' ]), 
                new UserTag('foo', [ { key:'bar', val:'xx' } ], 'text')
        ));
        t.assert(!tagequal(
                new UserTag('foo', [ { key:'bar', val:'xx' }, { key:'zog', val:'yy' } ], []),
                new UserTag('foo', [ { key:'bar', val:'xx' } ], [])
        ));
        t.assert(!tagequal(
                new UserTag('foo', [ { key:'bar', val:'xx' }, { key:'zog', val:'yy' } ], []),
                new UserTag('foo', [ { key:'zog', val:'yy' }, { key:'bar', val:'xx' } ], [])
        ));
        t.assert(tagequal(
                new UserTag('foo', [ { key:'bar', val:'xx' }, { key:'zog', val:'yy' } ], []),
                new UserTag('foo', [ { key:'bar', val:'xx' }, { key:'zog', val:'yy' } ], [])
        ));
        t.end();
});

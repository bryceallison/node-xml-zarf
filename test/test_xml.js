const test = require('tape').test;
const xmlparse = require('../xmlparse.js');

test('twostrings simple', function(t) {
    const struct = {
        root: {
            first: String,
            second: String
        }
    };

    xmlparse.parse('test/files/threestrings.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.deepEqual(res, { root: { first:'First', second:'Second' } });
        t.end();
    });
});

test('threestrings reverse', function(t) {
    const struct = {
        root: {
            third: String,
            second: String,
            first: String
        }
    };

    xmlparse.parse('test/files/threestrings.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.deepEqual(res, {
                root: { first:'First', second:'Second', third:'Third' } 
            });
        t.end();
    });
});

test('bad xml', function(t) {
    const struct = {
        root: {
        }
    };

    xmlparse.parse('test/files/bad.xml', struct, (res, ex) => {
        t.equal(res, null, 'res is null');
        t.assert(ex instanceof Error, 'ex instanceof Error');
        t.end();
    });
});

test('no structure match', function(t) {
    const struct = {
        rfoozle: {
            first: String,
            second: String
        }
    };

    xmlparse.parse('test/files/threestrings.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.deepEqual(res, {});
        t.end();
    });
});

test('twolevel', function(t) {
    const struct = {
        root: {
            head: {
                first: String,
                second: String,
                notthere: String
            },
            body: {
                third: String,
                fourth: String,
                alsonot: { }
            }
        }
    };

    xmlparse.parse('test/files/twolevel.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.deepEqual(res, {
                root: { 
                    head: { first:'First', second:'Second' },
                    body: { third:'Third', fourth:'Fourth' }
                }
            });
        t.end();
    });
});


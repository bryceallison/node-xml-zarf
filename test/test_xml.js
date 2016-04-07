const test = require('tape').test;
const xmlparse = require('../xmlparse.js');

test('DUMMY equality', function(t) {
    t.equal(1, 1, 'these two numbers are equal');
    t.end();
});

test('twostrings', function(t) {
    const struct = {
        root: {
            first: String,
            second: String
        }
    };

    xmlparse.parse('test/files/twostrings.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.deepEqual(res, { root: { first:'First', second:'Second' } });
        t.end();
    });
});

test('DUMMY equality 2', function(t) {
    t.equal(2, 2, 'these two numbers are equal');
    t.end();
});

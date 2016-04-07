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

test('types', function(t) {
    const struct = {
        root: {
            'text-a': String,
            'text-1': String,
            'text_x': String,
            number_a: Number,
            number_b: Number,
            number_c: Number,
            number_x: Number
        }
    };

    xmlparse.parse('test/files/types.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.deepEqual(res, {
            root: {
                'text-a': 'First',
                'text-1': '123',
                text_x: '',
                number_a: -5,
                number_b: 2.5,
                number_c: 20,
                number_x: 0
            }
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

test('bad struct, empty array', function(t) {
    const struct = {
        root: {
            list: []
        }
    };

    xmlparse.parse('test/files/lists.xml', struct, (res, ex) => {
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

test('extranode', function(t) {
    const struct = {
        root: {
            first: String,
            child: {
                name: String
            }
        }
    };

    xmlparse.parse('test/files/extranode.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.deepEqual(res, {
                root: { 
                    first: 'First extra',
                    child: { name:'Bar' }
                }
            });
        t.end();
    });
});

test('marktext', function(t) {
    const struct = {
        root: { text: String }
    };

    xmlparse.parse('test/files/marktext.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.deepEqual(res, { root: { text:'A line of text.' } });
        t.end();
    });
});

test('lists', function(t) {
    const struct = {
        root: {
            list: [{
                int: String,
                string: String
            }]
        }
    };

    xmlparse.parse('test/files/lists.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.deepEqual(res, { 
                root: { 
                    list: [
                        { int: '11' },
                        { string: 'Foo' },
                        { int: '22' },
                        { string: 'Bar' }
                    ]
                }
            });
        t.end();
    });
});

test('tree', function(t) {
    const struct = {
        root: {
            name: String,
            list: [{
                entry: {
                    key: String,
                    value: String
                }
            }]
        }
    };

    xmlparse.parse('test/files/tree.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.deepEqual(res, { 
                root: {
                    name: 'Title',
                    list: [
                        { 
                            entry: {
                                key: 'Color',
                                value: 'blue'
                            }
                        },
                        { 
                            entry: {
                                key: 'Size',
                                value: 'huge'
                            }
                        }
                    ]
                }
            });
        t.end();
    });
});


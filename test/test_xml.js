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

test('selfclosed', function(t) {
    const struct = {
        root: {
            name: String,
            number: Number,
            obj: {}
        }
    };

    xmlparse.parse('test/files/selfclosed.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.deepEqual(res, {
            root: {
                name: '',
                number: 0,
                obj: {}
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
            list: {
                _list: Object,
                int: Number,
                string: String
            }
        }
    };

    xmlparse.parse('test/files/lists.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.deepEqual(res, { 
                root: { 
                    list: [
                        { int: 11 },
                        { string: 'Foo' },
                        { int: 22 },
                        { string: 'Bar' }
                    ]
                }
            });
        t.end();
    });
});

test('list-items', function(t) {
    const struct = {
        root: {
            list: {
                _list: true,
                item: {
                    name: String,
                    count: Number
                }
            }
        }
    };

    xmlparse.parse('test/files/itemlist.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.deepEqual(res, { 
                root: {
                    list: [
                        { name:'First', count:4 },
                        { name:'Second' },
                        { name:'Third' },
                        { name:'Fourth' }
                    ]
                }
            });
        t.end();
    });
});

test('list-items deep', function(t) {
    const struct = {
        root: {
            list: {
                _list: Object,
                item: {
                    name: String,
                    count: Number
                }
            }
        }
    };

    xmlparse.parse('test/files/itemlist.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.deepEqual(res, { 
                root: {
                    list: [
                        { item: { name:'First', count:4 } }, 
                        { item: { name:'Second' } },
                        { item: { name:'Third' } },
                        { item: { name:'Fourth' } }
                    ]
                }
            });
        t.end();
    });
});

test('list-strings', function(t) {
    const struct = {
        root: {
            list: {
                _list: true,
                name: String,
            }
        }
    };

    xmlparse.parse('test/files/stringlist.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.deepEqual(res, { 
                root: {
                    list: [
                        'First',
                        'Second',
                        'Third',
                        'Fourth'
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
            list: {
                _list: Object,
                entry: {
                    key: String,
                    value: String
                }
            }
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

test('transform', function(t) {
    const struct = {
        root: {
            _result: o => {
                o.version = '1.0';
            },
            name: String,
            static: {
                _result: o => 'TRUE',
            },
            list: {
                _list: true,
                entry: {
                    _result: o => {
                        return '<' + o.key + '=' + o.value.toUpperCase() + '>';
                    },
                    key: String,
                    value: String
                }
            }
        }
    };

    xmlparse.parse('test/files/tree.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.deepEqual(res, { 
                root: {
                    name: 'Title',
                    version: '1.0',
                    static: 'TRUE',
                    list: [
                        '<Color=BLUE>',
                        '<Size=HUGE>'
                    ]
                }
            });
        t.end();
    });
});

test('list-strings transform', function(t) {
    const struct = {
        root: {
            list: {
                _list: true,
                name: String,
                _result: l => { l.push('END'); }
            }
        }
    };

    xmlparse.parse('test/files/stringlist.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.deepEqual(res, { 
                root: {
                    list: [
                        'First',
                        'Second',
                        'Third',
                        'Fourth',
                        'END'
                    ]
                }
            });
        t.end();
    });
});

test('lists transform', function(t) {
    const struct = {
        root: {
            list: {
                _list: true,
                _result: ls => ls.join('/'),
                int: String,
                string: String
            }
        }
    };

    xmlparse.parse('test/files/lists.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.deepEqual(res, { 
                root: { 
                    list: '11/Foo/22/Bar'
                }
            });
        t.end();
    });
});

test('attributes', function(t) {
    const struct = {
        root: {
            _result: (o, attr) => {
                o.version = attr.version;
            },
            thing: String,
            list: {
                _list: true,
                item: {
                    _result: (o, attr) => {
                        var count = 0;
                        if (attr.count)
                            count = 1 * attr.count;
                        return [count, o];
                    },
                    name: String
                }
            }
        }
    };

    xmlparse.parse('test/files/attrs.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.deepEqual(res, { 
                root: {
                    version: '1.0',
                    thing: 'A thing.',
                    list: [
                        [ 1, { name:'First' } ],
                        [ 11, { name:'Second' } ],
                        [ 0, { name:'Third' } ]
                    ]
                }
            });
        t.end();
    });
});


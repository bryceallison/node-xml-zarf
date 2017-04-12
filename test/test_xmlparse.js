const stream_mod = require('stream');
const buffer_mod = require('buffer');

const test = require('tape').test;
const xmlparse = require('../xmlparse.js');

const usertag_mod = require('../usertag.js');
const UserTag = usertag_mod.UserTag;
const tagequal = usertag_mod.tagequal;

function ReadStringBuffer(str)
{
    var buffer = new buffer_mod.Buffer(str);
    var consumed = false;

    var stream = new stream_mod.Readable({
            read: function(size) {
                while (true) {
                    if (!consumed) {
                        var more = this.push(buffer);
                        consumed = true;
                        if (!more)
                            return;
                        continue;
                    }
                    this.push(null);
                    return;
                }
            }
        });

    return stream;
}

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

test('twostrings fancy', function(t) {
    const struct = {
        root: {
            first: String,
            second: String
        }
    };

    xmlparse.parse('test/files/stringsfancy.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.deepEqual(res, { root: { first:'<em>Foo&amp;', second:'A\u00E5/\u03A3/\u201C\u201D.' } });
        t.end();
    });
});

test('twostrings streamed', function(t) {
    const struct = {
        root: {
            first: String,
            second: String
        }
    };

    const doc = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <first>First</first>
  <second>Second</second>
  <third>Third</third>
</root>
`;

    var readstream = ReadStringBuffer(doc);
    xmlparse.parse(readstream, struct, (res, ex) => {
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
                _list: true,
                _wrapitem: true,
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
                _list: true,
                _wrapitem: true,
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

test('list-items bare', function(t) {
    const struct = {
        root: {
            list: {
                _list: true,
                item: {
                    _bareobj: true,
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
                        4,
                        'Second',
                        'Third',
                        'Fourth'
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
                _list: true,
                _wrapitem: true,
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

test('lists inner _types', function(t) {
    const struct = {
        root: {
            list: {
                _list: true,
                int: {
                    _type: Number
                },
                string: {
                    _type: String
                },
            }
        }
    };

    xmlparse.parse('test/files/lists.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.deepEqual(res, { 
                root: { 
                    list: [11, 'Foo', 22, 'Bar']
                }
            });
        t.end();
    });
});

test('lists inner transform', function(t) {
    const struct = {
        root: {
            list: {
                _list: true,
                int: {
                    _type: Number,
                    _result: val => -val
                },
                string: {
                    _type: String,
                    _result: val => val.toUpperCase()
                },
            }
        }
    };

    xmlparse.parse('test/files/lists.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.deepEqual(res, { 
                root: { 
                    list: [-11, 'FOO', -22, 'BAR']
                }
            });
        t.end();
    });
});

test('lists bare', function(t) {
    const struct = {
        root: {
            _bareobj: true,
            list: {
                _list: true,
                _result: ls => { var res = ls.slice(0); res.push('END'); return res },
                int: Number,
                string: String
            }
        }
    };

    xmlparse.parse('test/files/lists.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.deepEqual(res, { 
                root: [
                    11,
                    'Foo',
                    22,
                    'Bar',
                    'END'
                ]
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
            thing: {
                _text: 'text',
                _result: (o, attr) => {
                    o.foo = attr.foo
                    return o;
                }
            },
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
                    thing: {
                        text: 'A thing.',
                        foo: 'footext'
                    },
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

test('lists of varying structs', function(t) {
    const struct = {
        root: {
            list: {
                _list: true,
                _wrapitem: true,
                int: {
                    _result: v => v.count,
                    count: Number
                },
                text: {
                    _result: v => v.str,
                    str: String
                }
            }
        }
    };

    xmlparse.parse('test/files/multilist.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.deepEqual(res, { 
                root: { 
                    list: [
                        { text: 'First' },
                        { int: 2 },
                        { text: 'Third' },
                        { int: 4 }
                    ]
                }
            });
        t.end();
    });
});

test('lists of varying structs transformed', function(t) {
    const struct = {
        root: {
            list: {
                _list: true,
                int: {
                    _result: v => ({ type:'int', val:v.count }),
                    count: Number
                },
                text: {
                    _result: v => ({ type:'str', val:v.str }),
                    str: String
                }
            }
        }
    };

    xmlparse.parse('test/files/multilist.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.deepEqual(res, { 
                root: { 
                    list: [
                        { type:'str', val: 'First' },
                        { type:'int', val: 2 },
                        { type:'str', val: 'Third' },
                        { type:'int', val: 4 }
                    ]
                }
            });
        t.end();
    });
});

test('lists within a field', function(t) {
    const struct = {
        root: {
            list: {
                _list: true,
                tag: {
                    _list: true,
                    _wrapitem: true,
                    _result: ls => {
                        var res = { key:null, value:[] };
                        for (val of ls) {
                            if (val.key)
                                res.key = val.key;
                            else if (val.value)
                                res.value.push(val.value);
                        }
                        return res;
                    },
                    key: String,
                    value: String
                }
            }
        }
    };

    xmlparse.parse('test/files/multival.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.deepEqual(res, { 
                root: { 
                    list: [
                        { key:'key0', value:[] },
                        { key:'key1', value:['foo'] },
                        { key:'key2', value:['foo','bar'] },
                    ]
                }
            });
        t.end();
    });
});

test('struct _type', function(t) {
    const struct = {
        root: {
            name: String,
            list: {
                _list: true,
                _wrapitem: true,
                entry: {
                    _type: {
                        key: String,
                        value: String
                    },
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

test('named _type', function(t) {
    const struct = {
        _types: {
            keyval: {
                key: String,
                value: String
            }
        },
        root: {
            name: String,
            list: {
                _list: true,
                _wrapitem: true,
                entry: {
                    _type: 'keyval',
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

test('tag soup 1', function(t) {
    const struct = {
        root: UserTag
    };

    xmlparse.parse('test/files/soup.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.assert(tagequal(res.root,
            new UserTag('root', [ 
                new UserTag('head', [
                    new UserTag('first', 'First'),
                    new UserTag('second', 'Second'),
                ]),
                new UserTag('body', [
                    new UserTag('third', 'Third'),
                    new UserTag('fourth', 'Fourth'),
                ]),
            ])
        ), 'tagequal');
        t.end();
    });
});

test('tag soup 2', function(t) {
    const struct = {
        root: {
            head: {
                first: String,
                second: String,
            },
            body: UserTag
        }
    };

    xmlparse.parse('test/files/soup.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.deepEqual(res.root.head,
            { first:'First', second:'Second' }
        );
        t.assert(tagequal(res.root.body,
            new UserTag('body', [
                new UserTag('third', 'Third'),
                new UserTag('fourth', 'Fourth'),
            ])
        ), 'tagequal');
        t.end();
    });
});

test('tag soup 3', function(t) {
    const struct = {
        root: {
            head: UserTag,
            body: {
                third: String,
                fourth: String,
                alsonot: { }
            }
        }
    };

    xmlparse.parse('test/files/soup.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.assert(tagequal(res.root.head,
            new UserTag('head', [
                new UserTag('first', 'First'),
                new UserTag('second', 'Second'),
            ])
        ), 'tagequal');
        t.deepEqual(res.root.body,
            { third:'Third', fourth:'Fourth' }
        );
        t.end();
    });
});

test('tag soup with text', function(t) {
    const struct = {
        root: UserTag
    };

    xmlparse.parse('test/files/souptext.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.assert(tagequal(res.root,
            new UserTag('root', [ 
                new UserTag('p', [
                    'Text-',
                    new UserTag('em', ['italic']),
                    '-end.',
                ]),
                'NL',
                new UserTag('p', [
                    'More.',
                ]),
                'NL2',
            ])
        ), 'tagequal');
        t.end();
    });
});

test('tag soup with attributes', function(t) {
    const struct = {
        root: UserTag
    };

    xmlparse.parse('test/files/soupattr.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.assert(tagequal(res.root,
            new UserTag('root', { version:'2' }, [ 
                new UserTag('head', [
                    new UserTag('first', { class:'foo' }, 'First'),
                    new UserTag('second', [{ key:'class', val:'bar' }], 'Second'),
                ]),
            ])
        ), 'tagequal');
        t.end();
    });
});

test('tag soup with attributes 2', function(t) {
    const struct = {
        root: UserTag
    };

    xmlparse.parse('test/files/soupattr2.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.assert(tagequal(res.root,
            new UserTag('root', { version:'3' }, [ 
                new UserTag('head', { class:'header' }, [
                    new UserTag('first', 'First'),
                    new UserTag('second', 'Second'),
                ]),
            ])
        ), 'tagequal');
        t.end();
    });
});

test('tag soup with attributes 3', function(t) {
    const struct = {
        root: {
            _result: (o, attr) => {
                o.version = attr.version;
            },
            head: UserTag
        }
    };

    xmlparse.parse('test/files/soupattr2.xml', struct, (res, ex) => {
        t.equal(ex, null);
        t.equal(res.root.version, '3');
        t.assert(tagequal(res.root.head,
                new UserTag('head', { class:'header' }, [
                    new UserTag('first', 'First'),
                    new UserTag('second', 'Second'),
                ])
        ), 'tagequal');
        t.end();
    });
});


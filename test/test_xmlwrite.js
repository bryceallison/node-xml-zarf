const stream_mod = require('stream');
const buffer_mod = require('buffer');

const test = require('tape').test;
const xmlwrite = require('../xmlwrite.js');
const fastwritestring = xmlwrite.fastwritestring;

const usertag_mod = require('../usertag.js');
const UserTag = usertag_mod.UserTag;
const tagequal = usertag_mod.tagequal;

function WriteStringBuffer()
{
    const BUFSIZE = 1024;

    var buffer = new buffer_mod.Buffer(BUFSIZE);
    var bufpos = 0;

    var stream = new stream_mod.Writable({
            write: function(chunk, encoding, cb) {
                if (bufpos + chunk.length > buffer.length) {
                    var newbuf = new buffer_mod.Buffer(bufpos + chunk.length + BUFSIZE);
                    buffer.copy(newbuf, 0, 0, bufpos);
                    buffer = newbuf;
                }
                chunk.copy(buffer, bufpos, 0, chunk.length);
                bufpos += chunk.length;
                cb();
            }
        });

    stream._resultbuffer = function() { return buffer; };
    stream._result = function() { return buffer.toString('utf8', 0, bufpos); };
    return stream;
}

function stripwhite(str)
{
    return str.replace(/\s+/g, '');
}

test('fastwritestring', function(t) {
        t.equal(fastwritestring(
                new UserTag('foo')
            ), 
            '<foo></foo>');

        t.equal(
            stripwhite(fastwritestring(
                new UserTag('root', [
                    new UserTag('head'),
                    new UserTag('body', 'stuff')
                ])
                )), 
            stripwhite(`
<root>
  <head></head>
  <body>stuff</body>
</root>
            `));

        t.equal(
            stripwhite(fastwritestring(
                new UserTag('root', {version:'one'}, [
                    new UserTag('head', {length:'long'}),
                    new UserTag('body', [{key:'first',val:'one'}, {key:'second',val:'two'}], 'stuff')
                ])
                )), 
            stripwhite(`
<root version="one">
  <head length="long"></head>
  <body first="one" second="two">stuff</body>
</root>
            `));

        t.end();
});

test('twostrings simple', function(t) {
    const struct = {
        root: {
            _order: [ 'first', 'second' ],
            first: String,
            second: String
        }
    };

    const doc = {
        root: {
            first: 'Hello',
            second: 'There'
        }
    };

    const wanted = `<?xml version="1.0" encoding="UTF-8"?>
  <root>
    <first>Hello</first>
    <second>There</second>
  </root>
`;

    var stream = WriteStringBuffer();
    xmlwrite.write(stream, struct, doc, ex => {
        t.equal(ex, null);
        t.equal(stripwhite(stream._result()), stripwhite(wanted));
        t.end();
    });
});

test('twostrings fancy', function(t) {
    const struct = {
        root: {
            _order: [ 'first', 'firster', 'second', 'third' ],
            first: String,
            firster: String,
            second: String,
            third: String
        }
    };

    const doc = {
        root: {
            first: '<em>Foo&amp;',
            firster: '<p><em>Foo</em>&amp;&lt;&lt;</p>',
            second: 'A\u00E5/\u03A3/\u201C\u201D.',
            third: 1234
        }
    };

    const wanted = `<?xml version="1.0" encoding="UTF-8"?>
  <root>
    <first>&lt;em&gt;Foo&amp;amp;</first>
    <firster>&lt;p&gt;&lt;em&gt;Foo&lt;/em&gt;&amp;amp;&amp;lt;&amp;lt;&lt;/p&gt;</firster>
    <second>A\u00E5/\u03A3/\u201C\u201D.</second>
    <third>1234</third>
  </root>
`;

    var stream = WriteStringBuffer();
    xmlwrite.write(stream, struct, doc, ex => {
        t.equal(ex, null);
        t.equal(stripwhite(stream._result()), stripwhite(wanted));
        t.end();
    });
});

test('threestrings reorder', function(t) {
    const struct = {
        root: {
            _order: [ 'first', 'second', 'third' ],
            third: String,
            second: String,
            first: String
        }
    };

    const doc = {
        root: {
            third: '33',
            first: '11',
            second: '22'
        }
    };

    const wanted = `<?xml version="1.0" encoding="UTF-8"?>
  <root>
    <first>11</first>
    <second>22</second>
    <third>33</third>
  </root>
`;

    var stream = WriteStringBuffer();
    xmlwrite.write(stream, struct, doc, ex => {
        t.equal(ex, null);
        t.equal(stripwhite(stream._result()), stripwhite(wanted));
        t.end();
    });
});

test('listitems', function(t) {
    const struct = {
        root: {
            variables: {
                _list: 'variable',
                variable: {
                    _order: [ 'name', 'type' ],
                    name: String,
                    type: String
                }
            }
        }
    };

    const doc = {
        root: {
            variables: [
                { name: 'count', type: 'int' },
                { name: 'size', type: 'float' }
            ]
        }
    };

    const wanted = `<?xml version="1.0" encoding="UTF-8"?>
  <root>
    <variables>
      <variable>
        <name>count</name>
        <type>int</type>
      </variable>
      <variable>
        <name>size</name>
        <type>float</type>
      </variable>
    </variables>
  </root>
`;

    var stream = WriteStringBuffer();
    xmlwrite.write(stream, struct, doc, ex => {
        t.equal(ex, null);
        t.equal(stripwhite(stream._result()), stripwhite(wanted));
        t.end();
    });
});

test('obj to string', function(t) {
    const struct = {
        root: {
            _order: [ 'str', 'arr' ],
            str: o => o+'!',
            arr: o => o.join('/')
        }
    };

    const doc = {
        root: {
            str: 'Hello',
            arr: [ 'xx', 'yy', 'zz' ]
        }
    };

    const wanted = `<?xml version="1.0" encoding="UTF-8"?>
  <root>
    <str>Hello!</str>
    <arr>xx/yy/zz</arr>
  </root>
`;

    var stream = WriteStringBuffer();
    xmlwrite.write(stream, struct, doc, ex => {
        t.equal(ex, null);
        t.equal(stripwhite(stream._result()), stripwhite(wanted));
        t.end();
    });
});

test('liststrings', function(t) {
    const struct = {
        root: {
            variables: {
                _list: 'variable',
                variable: String
            }
        }
    };

    const doc = {
        root: {
            variables: [
                'count',
                'size',
                'weight'
            ]
        }
    };

    const wanted = `<?xml version="1.0" encoding="UTF-8"?>
  <root>
    <variables>
      <variable>count</variable>
      <variable>size</variable>
      <variable>weight</variable>
    </variables>
  </root>
`;

    var stream = WriteStringBuffer();
    xmlwrite.write(stream, struct, doc, ex => {
        t.equal(ex, null);
        t.equal(stripwhite(stream._result()), stripwhite(wanted));
        t.end();
    });
});

test('listitems partial', function(t) {
    const struct = {
        root: {
            variables: {
                _list: 'variable',
                variable: {
                    _order: [ 'name', 'values' ],
                    name: String,
                    values: {
                        _list: 'value',
                        value: String
                    }
                }
            }
        }
    };

    const doc = {
        root: {
            variables: [
                { name: 'count', values: ['one', 'two'] },
                { name: 'size' },
                { values: ['xx', 'yy'] },
            ]
        }
    };

    const wanted = `<?xml version="1.0" encoding="UTF-8"?>
  <root>
    <variables>
      <variable>
        <name>count</name>
        <values>
          <value>one</value>
          <value>two</value>
        </values>
      </variable>
      <variable>
        <name>size</name>
      </variable>
      <variable>
        <values>
          <value>xx</value>
          <value>yy</value>
        </values>
      </variable>
    </variables>
  </root>
`;

    var stream = WriteStringBuffer();
    xmlwrite.write(stream, struct, doc, ex => {
        t.equal(ex, null);
        t.equal(stripwhite(stream._result()), stripwhite(wanted));
        t.end();
    });
});

test('tag creation', function(t) {
    const struct = {
        root: {
            _order: [ 
                'zeroth', 'first', 'second',
                'third', 'fourth',
            ],
            zeroth: (val, node) => node.tag(),
            first: (val, node) => node.tag('first'),
            second: (val, node) => node.tag('altsecond'),
            third: (val, node) => node.tag('third', [node.tag('x3a'), node.tag('x3b', ['xxyy'])]),
            fourth: (val, node) => node.tag('fourthtag', val),
            nonexist: (val, node) => node.tag(),
        }
    };

    const doc = {
        root: {
            zeroth: true,
            first: 'Hello',
            second: 'There',
            third: true,
            fourth: 'fourthtext',
        }
    };

    const wanted = `<?xml version="1.0" encoding="UTF-8"?>
  <root>
    <zeroth/>
    <first/>
    <altsecond/>
    <third>
      <x3a/>
      <x3b>xxyy</x3b>
    </third>
    <fourthtag>fourthtext</fourthtag>
  </root>
`;

    var stream = WriteStringBuffer();
    xmlwrite.write(stream, struct, doc, ex => {
        t.equal(ex, null);
        t.equal(stripwhite(stream._result()), stripwhite(wanted));
        t.end();
    });
});

test('tag nullability', function(t) {
    const struct = {
        root: {
            _order: [ 
                'zeroth', 'variables',
            ],
            zeroth: (val, node) => null,
            variables: {
                _list: 'variable',
                variable: (val, node) => {
                    if (val == 'two')
                        return null;
                    return node.tag('var', val);
                }
            }
        }
    };

    const doc = {
        root: {
            zeroth: true,
            variables: ['one', 'two', 'three'],
        }
    };

    const wanted = `<?xml version="1.0" encoding="UTF-8"?>
  <root>
    <variables>
      <var>one</var>
      <var>three</var>
    </variables>
  </root>
`;

    var stream = WriteStringBuffer();
    xmlwrite.write(stream, struct, doc, ex => {
        t.equal(ex, null);
        t.equal(stripwhite(stream._result()), stripwhite(wanted));
        t.end();
    });
});

test('tag variations', function(t) {
    const struct = {
        root: {
            _order: [ 
                'zeroth', 'first', 'second',
                'third', 'fourth',
            ],
            zeroth: (val, node) => node.tag(['xx', 'yy']),
            first: (val, node) => node.tag('first', {cla:'head'}),
            second: (val, node) => node.tag('second', {vers:'foo'}, 'value'),
            third: (val, node) => node.tag('third', [{key:'xx',val:'yyy'}], null),
            fourth: (val, node) => node.tag('fourth', [{key:'one',val:'11'}, {key:'two',val:'22'}, {key:'three',val:'33'}], [val]),
        }
    };

    const doc = {
        root: {
            zeroth: true,
            first: true,
            second: true,
            third: true,
            fourth: 'fourthtext',
        }
    };

    const wanted = `<?xml version="1.0" encoding="UTF-8"?>
  <root>
    <zeroth>xxyy</zeroth>
    <first cla="head"/>
    <second vers="foo">value</second>
    <third xx="yyy"/>
    <fourth one="11" two="22" three="33">fourthtext</fourth>
  </root>
`;

    var stream = WriteStringBuffer();
    xmlwrite.write(stream, struct, doc, ex => {
        t.equal(ex, null);
        t.equal(stripwhite(stream._result()), stripwhite(wanted));
        t.end();
    });
});

test('error on undefined', function(t) {
    const struct = {
        root: {
            _order: [ 
                'zeroth',
            ],
            zeroth: (val, node) => undefined,
        }
    };

    const doc = {
        root: {
            zeroth: true,
        }
    };

    var stream = WriteStringBuffer();
    xmlwrite.write(stream, struct, doc, ex => {
        t.assert(ex instanceof Error, 'ex instanceof Error');
        t.end();
    });
});


test('attributes', function(t) {
    const struct = {
        root: {
            _attrs: { version:'123.4' },
            _order: [ 'first', 'second' ],
            first: String,
            second: {
                _attrs: [ { key:'kk', val:'vv' } ],
            }
        }
    };

    const doc = {
        root: {
            first: 'Hello',
            second: true
        }
    };

    const wanted = `<?xml version="1.0" encoding="UTF-8"?>
  <root version="123.4">
    <first>Hello</first>
    <second kk="vv"/>
  </root>
`;

    var stream = WriteStringBuffer();
    xmlwrite.write(stream, struct, doc, ex => {
        t.equal(ex, null);
        t.equal(stripwhite(stream._result()), stripwhite(wanted));
        t.end();
    });
});

test('list of attributes', function(t) {
    const struct = {
        root: {
            _attrs: [ { key:'version', val:'123.4' }, {  key:'format', val:'nonesuch' } ],
            _order: [ 'second' ],
            second: {
                _attrs: [
                    { key:'k1', val:'vv1' },
                    { key:'k2', val:'vv2' },
                    { key:'k3', val:'vv3' },
                ],
            }
        }
    };

    const doc = {
        root: {
            second: true
        }
    };

    const wanted = `<?xml version="1.0" encoding="UTF-8"?>
  <root version="123.4" format="nonesuch">
    <second k1="vv1" k2="vv2" k3="vv3"/>
  </root>
`;

    var stream = WriteStringBuffer();
    xmlwrite.write(stream, struct, doc, ex => {
        t.equal(ex, null);
        t.equal(stripwhite(stream._result()), stripwhite(wanted));
        t.end();
    });
});

test('attributes escaped', function(t) {
    const struct = {
        root: {
            _attrs: { version:'z<i>&amp;</i> "Hi."' },
            _order: [ 'first' ],
            first: String
        }
    };

    const doc = {
        root: {
            first: 'Hello'
        }
    };

    const wanted = `<?xml version="1.0" encoding="UTF-8"?>
  <root version="z&lt;i&gt;&amp;amp;&lt;/i&gt; &quot;Hi.&quot;">
    <first>Hello</first>
  </root>
`;

    var stream = WriteStringBuffer();
    xmlwrite.write(stream, struct, doc, ex => {
        t.equal(ex, null);
        t.equal(stripwhite(stream._result()), stripwhite(wanted));
        t.end();
    });
});

test('usertag', function(t) {
    const struct = {
        root: {
            _order: [ 'body' ],
            body: UserTag
        }
    };

    const doc = {
        root: {
            body: new UserTag('body', [
                new UserTag('zeroth'),
                new UserTag('first', {src:'foo'}),
                new UserTag('second', 'secondtext'),
                new UserTag('third', [{key:'one',val:'11'}, {key:'two',val:'22'}, {key:'three',val:'33'}], ['xx']),
            ])
        }
    };

    const wanted = `<?xml version="1.0" encoding="UTF-8"?>
  <root>
    <body>
      <zeroth/>
      <first src="foo"/>
      <second>secondtext</second>
      <third one="11" two="22" three="33">xx</third>
    </body>
  </root>
`;

    var stream = WriteStringBuffer();
    xmlwrite.write(stream, struct, doc, ex => {
        t.equal(ex, null);
        t.equal(stripwhite(stream._result()), stripwhite(wanted));
        t.end();
    });
});

test('usertag relayed', function(t) {
    const struct = {
        root: {
            _order: [ 'body' ],
            body: (val, node) => val,
        }
    };

    const doc = {
        root: {
            body: new UserTag('body', [
                new UserTag('zeroth'),
                new UserTag('first', {src:'foo'}),
                new UserTag('second', 'secondtext'),
                new UserTag('third', [{key:'one',val:'11'}, {key:'two',val:'22'}, {key:'three',val:'33'}], ['xx']),
            ])
        }
    };

    const wanted = `<?xml version="1.0" encoding="UTF-8"?>
  <root>
    <body>
      <zeroth/>
      <first src="foo"/>
      <second>secondtext</second>
      <third one="11" two="22" three="33">xx</third>
    </body>
  </root>
`;

    var stream = WriteStringBuffer();
    xmlwrite.write(stream, struct, doc, ex => {
        t.equal(ex, null);
        t.equal(stripwhite(stream._result()), stripwhite(wanted));
        t.end();
    });
});

test('obj transform', function(t) {
    const struct = {
        root: {
            _order: [ 'label', 'thing' ],
            _transform: val => {
                return {
                    label: val.label+'!',
                    thing: { first:val.first, second:val.second },
                };
            },
            label: String,
            thing: {
                first: String,
                second: String
            }
        }
    };

    const doc = {
        root: {
            label: 'Hello',
            first:'one',
            second:'two',
        }
    };

    const wanted = `<?xml version="1.0" encoding="UTF-8"?>
  <root>
    <label>Hello!</label>
    <thing>
      <first>one</first>
      <second>two</second>
    </thing>
  </root>
`;

    var stream = WriteStringBuffer();
    xmlwrite.write(stream, struct, doc, ex => {
        t.equal(ex, null);
        t.equal(stripwhite(stream._result()), stripwhite(wanted));
        t.end();
    });
});

test('listitems transform', function(t) {
    const struct = {
        root: {
            variables: {
                _list: 'variable',
                variable: {
                    _order: [ 'name', 'type' ],
                    _transform: val => ({ name:val.type, type:val.name }),
                    name: String,
                    type: String
                }
            }
        }
    };

    const doc = {
        root: {
            variables: [
                { name: 'count', type: 'int' },
                { name: 'size', type: 'float' }
            ]
        }
    };

    const wanted = `<?xml version="1.0" encoding="UTF-8"?>
  <root>
    <variables>
      <variable>
        <name>int</name>
        <type>count</type>
      </variable>
      <variable>
        <name>float</name>
        <type>size</type>
      </variable>
    </variables>
  </root>
`;

    var stream = WriteStringBuffer();
    xmlwrite.write(stream, struct, doc, ex => {
        t.equal(ex, null);
        t.equal(stripwhite(stream._result()), stripwhite(wanted));
        t.end();
    });
});


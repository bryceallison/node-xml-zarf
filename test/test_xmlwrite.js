const stream_mod = require('stream');
const buffer_mod = require('buffer');

const test = require('tape').test;
const xmlwrite = require('../xmlwrite.js');

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


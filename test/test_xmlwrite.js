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


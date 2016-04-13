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


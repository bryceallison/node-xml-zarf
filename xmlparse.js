'use strict';

const fs = require('fs');
const stream_mod = require('stream');
const sax = require('sax');

/* xmlparse: structured XML parsing

   This module lets you extract data from an XML file into Javascript
   objects according to a template structure. It is based on the sax
   node module (https://github.com/isaacs/sax-js/).
   
   To use this:

   parse(source, struct, callback);

   The source may be a pathname or an instance of stream.Readable.
   The call is always async, and the callback has the form
   callback(doc, err) where err is null on success.

   The struct template might look like:

    const struct = {
        root: {
            name: String,
            count: Number,
            obj: { 
                val: String
            },
            list: {
                _list: true,
                val: String
            }
        }
    };

    This would parse the XML file:

    <root>
      <name>Title</name>
      <count>34</count>
      <obj><val>Foo</val></obj>
      <list>
        <val>Bar</val>
        <val>Baz</val>
      </list>
    </root>

    ...into the Javascript form:

    {
        root: {
            name: 'Title',
            count: 23,
            obj: { val: 'Foo' },
            list: [ 'Bar', 'Baz' ]
        }
    }

    The parsing is conservative; XML fields not mentioned in the structure
    are ignored.

    Note that an object field in the template can be the symbol String,
    the symbol Number, or another object. The special field _list, if
    true, means that the child tags form a JS list rather than an object
    (their tag names are discarded).

    If _list is the symbol Object, the child objects are wrapped so that
    their tag names remain. That is, in the example above, you'd get
        list: [ {val:'Bar'}, {val:'Baz'} ]

    If you want custom classes or other post-processing, you can add an
    _result(o, attr) function to any object in the template. (The attr
    argument contains the XML attributes from the open tag.) This function
    can either modify o (and return undefined), or return any Javascript
    value.
*/

function parse(path, struct, cb)
{
    var parsestream = sax.createStream(true, {});

    /* We're going to cheap out on namespace support -- match local
       prefixes instead of full URIs. "To fix later" */

    /* It looks like the sax module, despite being the most-used
       XML-parser in npm, is not very clear about its callbacks. We
       must be careful to shut down on the first end or error event
       and ignore later ones. */

    var context = {
        rootresult: {},
        depth: 0,
        curnode: null,   // {name, attr, struct, result}
        text: null,      // active if curnode is String
        selferror: null, // set if we generate an error
        done: false      // set on EOF or first error
    };

    context.curnode = { parent: null, struct:struct, result:context.rootresult };

    parsestream.on('error', function(ex) {
        if (context.done)
            return;
        context.done = true;
        /* We give up on the first error and return it. */
        context.rootresult = null;
        if (context.selferror !== null)
            ex = context.selferror;
        cb(null, ex);
    });

    parsestream.on('end', function() {
        if (context.done)
            return;
        context.done = true;
        if (context.selferror !== null) {
            /* We generated an error. */
            context.rootresult = null;
            var ex = context.selferror;
            cb(null, ex);
        }
        /* Extract the completed doc and return it. */
        if (context.depth != 0) 
            throw new Error('xmlparse internal error: depth not zero at end');
        if (context.curnode.parent !== null) 
            throw new Error('xmlparse internal error: node.parent not null at end');
        var result = context.rootresult;
        context.rootresult = null;
        cb(result, null);
    });

    parsestream.on('opentag', function(tag) {
        if (context.done)
            return;

        var struct = context.curnode.struct;

        var node = {
            name:tag.name, attr:tag.attributes,
            struct:undefined, result:undefined, 
            parent:context.curnode
        };

        if (struct !== undefined) {
            var match = undefined;
            if (struct !== String && struct !== Number)
                match = struct[tag.name];
            node.struct = match;

            if (match === String) {
                context.text = [];
                node.result = '';
            }
            else if (match === Number) {
                context.text = [];
                node.result = 0;
            }
            else if (match !== undefined) {
                if (match._list)
                    node.result = [];
                else
                    node.result = {};
            }
        }

        context.curnode = node;

        context.depth += 1;
    });

    parsestream.on('closetag', function(name) {
        if (context.done)
            return;
        context.depth -= 1;

        var node = context.curnode;
        if (node.struct === String) {
            node.result = context.text.join('');
            context.text = null;
        }
        else if (node.struct === Number) {
            node.result = 1 * context.text.join('');
            context.text = null;
        }
        else if (node.struct !== undefined) {
            if (node.struct._result !== undefined) {
                var res = node.struct._result(node.result, node.attr);
                if (res !== undefined)
                    node.result = res;
            }
        }

        context.curnode = node.parent;

        if (node.result !== undefined) {
            if (context.curnode.struct._list) {
                var obj;
                if (context.curnode.struct._list == Object) {
                    obj = {};
                    obj[node.name] = node.result;
                }
                else {
                    obj = node.result;
                }
                context.curnode.result.push(obj);
            }
            else if (context.curnode.result !== undefined) {
                context.curnode.result[node.name] = node.result;
            }
        }
    });

    parsestream.on('text', function(val) {
        if (context.done)
            return;
        if (context.text !== null)
            context.text.push(val);
    });

    var readstream = null;
    if (path instanceof stream_mod.Readable)
        readstream = path;
    else
        readstream = fs.createReadStream(path);
    var pipe = readstream.pipe(parsestream);
}

exports.parse = parse;

'use strict';

const fs = require('fs');
const sax = require('sax');

/* The sax module: https://github.com/isaacs/sax-js/ */

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
        curnode: null,   // {name, attrs, struct, result}
        text: null,      // active if curnode is String
        done: false      // set on EOF or first error
    };

    context.curnode = { parent: null, struct:struct, result:context.rootresult };

    parsestream.on('error', function(ex) {
        if (context.done)
            return;
        context.done = true;
        /* We give up on the first error and return it. */
        context.rootresult = null;
        cb(null, ex);
    });

    parsestream.on('end', function() {
        if (context.done)
            return;
        context.done = true;
        /* Extract the completed doc and return it. */
        if (context.depth != 0) {
            console.log('### sax end: depth != 0');
        }
        if (context.curnode.parent !== null) {
            console.log('### sax end: curnode.parent != null');
        }
        var result = context.rootresult;
        context.rootresult = null;
        cb(result, null);
    });

    parsestream.on('opentag', function(tag) {
        if (context.done)
            return;

        var struct = context.curnode.struct;
        var match = undefined;
        var initresult = undefined;

        if (struct !== undefined) {
            if (Array.isArray(struct))
                struct = struct[0];

            if (struct !== String)
                match = struct[tag.name];

            if (match === String) {
                if (context.text !== null)
                    console.log('### sax: re-entrant text?');
                context.text = [];
                initresult = '';
            }
            else if (Array.isArray(match)) {
                if (match.length != 1)
                    throw Error('xmlparse: structure array must contain exactly one element');
                initresult = [];
            }
            else if (match !== undefined) {
                initresult = {};
            }
        }

        var node = { name:tag.name, attrs:tag.attrs, struct:match, result:initresult, parent:context.curnode };
        context.curnode = node;

        context.depth += 1;
    });

    parsestream.on('closetag', function(name) {
        if (context.done)
            return;
        context.depth -= 1;

        var oldnode = context.curnode;
        if (oldnode.struct === String) {
            oldnode.result = context.text.join('');
            context.text = null;
        }
        else if (oldnode.struct !== undefined) {
            //### run _accept?
        }

        context.curnode = oldnode.parent;

        if (oldnode.result !== undefined) {
            if (Array.isArray(context.curnode.result)) {
                var obj = {};
                obj[oldnode.name] = oldnode.result;
                context.curnode.result.push(obj);
            }
            else if (context.curnode.result !== undefined) {
                context.curnode.result[oldnode.name] = oldnode.result;
            }
        }
    });

    parsestream.on('text', function(val) {
        if (context.done)
            return;
        if (context.text !== null)
            context.text.push(val);
    });

    var pipe = fs.createReadStream(path).pipe(parsestream);
}

exports.parse = parse;

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
            name:tag.name, attrs:tag.attrs,
            struct:undefined, result:undefined, 
            parent:context.curnode
        };

        if (struct !== undefined) {
            if (Array.isArray(struct))
                struct = struct[0];

            var match = undefined;
            if (struct !== String && struct !== Number)
                match = struct[tag.name];
            node.struct = match;

            if (match === String) {
                if (context.text !== null)
                    console.log('### sax: re-entrant text?');
                context.text = [];
                node.result = '';
            }
            else if (match === Number) {
                if (context.text !== null)
                    console.log('### sax: re-entrant text?');
                context.text = [];
                node.result = 0;
            }
            else if (Array.isArray(match)) {
                if (match.length != 1) {
                    context.selferror = new Error('xmlparse: structure array must contain exactly one element');
                    parsestream.end();
                    return;
                }
                node.result = [];
            }
            else if (match !== undefined) {
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

        var oldnode = context.curnode;
        if (oldnode.struct === String) {
            oldnode.result = context.text.join('');
            context.text = null;
        }
        else if (oldnode.struct === Number) {
            oldnode.result = 1 * context.text.join('');
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

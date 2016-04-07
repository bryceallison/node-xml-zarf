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
        nodestack: [],   // list of parent nodes
        curnode: null,   // {name, attrs, struct, result}
        text: null,      // active if curnode is String
        done: false      // set on EOF or first error
    };

    context.curnode = { struct:struct, result:context.rootresult };

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
        if (context.nodestack.length != 0) {
            console.log('### sax end: nodestack.length != 0');
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
            if (struct !== String)
                match = struct[tag.name];
            if (match === String) {
                if (context.text !== null)
                    console.log('### sax: re-entrant text?');
                context.text = [];
                initresult = '';
            }
            else if (match !== undefined) {
                initresult = {};
            }
            else {
                console.log('### sax: skipping tag: ' + tag.name);
            }
        }

        var node = { name:tag.name, attrs:tag.attrs, struct:match, result:initresult };
        context.nodestack.push(context.curnode);
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

        context.curnode = context.nodestack.pop();

        if (oldnode.result !== undefined) {
            if (context.curnode.result !== undefined) {
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

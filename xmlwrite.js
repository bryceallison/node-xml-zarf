'use strict';

const fs = require('fs');

const PH_INIT = 0;
const PH_CHILDREN = 1;
const PH_FINAL = 2;

function write(path, struct, doc, cb)
{
    var writestream = null;

    try {
        writestream = fs.createWriteStream(path, { autoClose:true });
    }
    catch (ex) {
        cb(ex);
        return;
    }

    var node = {
        phase: PH_INIT,
        parent: null,
        tagname: null,
        doc: doc,
        struct: struct,
        order: null,
        index: null
    };

    var context = {
        stream: writestream,
        callback: cb,
        node: node,
        outbuf: []
    };

    context.outbuf.push('<?xml version="1.0" encoding="UTF-8"?>\n');

    thunk(context);
}

function thunk(context)
{
    while (true) {
        if (context.outbuf.length) {
            var text = context.outbuf.pop();
            var more = context.stream.write(text);
            if (!more)
                context.stream.once('drain', thunk);
            continue;
        }

        var node = context.node;
        if (!node) {
            context.stream.end(() => context.callback(null));
            return;
        }

        if (node.phase == PH_INIT) {
            if (node.struct._order !== undefined) {
                node.order = node.struct._order;
            }
            else {
                node.order = [];
                for (var key in node.struct) {
                    if (!key.startsWith('_'))
                        node.order.push(key);
                }
            }

            node.phase++;
            node.index = 0;
            context.outbuf.push('### enter ' + node.tagname + '\n');
            continue;
        }

        if (node.phase == PH_FINAL) {
            context.outbuf.push('### exit ' + node.tagname + '\n');
            context.node = node.parent;
            continue;
        }

        if (node.phase == PH_CHILDREN) {
            if (node.index >= node.order.length) {
                node.phase++;
                continue;
            }

            var tag = node.order[node.index];
            node.index += 1;
            context.outbuf.push('### ...trying tag ' + tag + '\n');
            
            var substruct = node.struct[tag];
            if (substruct === undefined)
                continue;
            var subdoc = node.doc[tag];
            if (subdoc === undefined)
                continue;
            
            var newnode = {
                phase: PH_INIT,
                parent: node,
                tagname: tag,
                doc: subdoc,
                struct: substruct,
                index: null
            };
            context.node = newnode;
            continue;
        }
    }
}

exports.write = write;

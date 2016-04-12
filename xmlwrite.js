'use strict';

const fs = require('fs');

const PH_INIT = 0;
const PH_OPEN = 1;
const PH_CHILDREN = 2;
const PH_FINAL = 3;

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

    var node = new TagNode(null, struct, doc, null);

    var context = {
        stream: writestream,
        callback: cb,
        node: node,
        outbuf: []
    };

    context.outbuf.push('<?xml version="1.0" encoding="UTF-8"?>\n');

    thunk(context);
}

function TagNode(tagname, struct, doc, parent)
{
    this.phase = PH_INIT;
    this.parent = parent;
    this.tagname = tagname;
    this.doc = doc;
    this.struct = struct;
    this.children = null;
    this.index = null;
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
            if (node.struct._list !== undefined) {
                var tag = node.struct._list;
                var substruct = node.struct[tag];
                node.children = [];
                for (var ix=0; ix<node.doc.length; ix++) {
                    var subdoc = node.doc[ix];
                    var newnode = new TagNode(tag, substruct, subdoc, node);
                    node.children.push(newnode);
                }
            }
            else { 
                var order;
                if (node.struct._order !== undefined) {
                    order = node.struct._order;
                }
                else {
                    order = [];
                    for (var key in node.struct) {
                        if (!key.startsWith('_'))
                            order.push(key);
                    }
                }
                
                node.children = [];
                for (var ix=0; ix<order.length; ix++) {
                    var tag = order[ix];
                    var substruct = node.struct[tag];
                    if (substruct === undefined)
                        continue;
                    var subdoc = node.doc[tag];
                    if (subdoc === undefined)
                        continue;
                    
                    var newnode = new TagNode(tag, substruct, subdoc, node);
                    node.children.push(newnode);
                }
            }

            node.phase++;
            continue;
        }

        if (node.phase == PH_OPEN) {
            context.outbuf.push('### enter ' + node.tagname + ', ' + node.children.length + ' children' + '\n');

            node.index = 0;
            node.phase++;
            continue;
        }

        if (node.phase == PH_CHILDREN) {
            if (node.index >= node.children.length) {
                node.phase++;
                continue;
            }

            var newnode = node.children[node.index];
            node.index += 1;
            context.outbuf.push('### ...trying tag ' + newnode.tagname + '\n');
            
            context.node = newnode;
            continue;
        }

        if (node.phase == PH_FINAL) {
            context.outbuf.push('### exit ' + node.tagname + '\n');
            context.node = node.parent;
            continue;
        }

    }
}

exports.write = write;

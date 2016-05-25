'use strict';

const fs = require('fs');
const stream_mod = require('stream');

const PH_INIT = 0;
const PH_OPEN = 1;
const PH_CHILDREN = 2;
const PH_FINAL = 3;

function write(path, struct, doc, cb)
{
    var writestream = null;

    if (path instanceof stream_mod.Writable) {
        writestream = path;
    }
    else {
        try {
            writestream = fs.createWriteStream(path, { autoClose:true });
        }
        catch (ex) {
            cb(ex);
            return;
        }
    }

    var node = new TagNode(null, struct, doc, null);

    var context = {
        stream: writestream,
        callback: function(err) {
            if (context.done)
                return;
            context.done = true;
            cb(err);
        },
        done: false,
        node: node,
        depth: 0,
        indent: true, //###
        outbuf: []
    };

    thunk(context);
}

function writestring(struct, doc, cb)
{
    var stream = WriteStringBuffer();
    write(stream, struct, doc, ex => {
        if (ex)
            cb(null, ex);
        else
            cb(stream._result(), null);
    });
}

function TagNode(tagname, struct, doc, parent)
{
    this.phase = PH_INIT;
    this.parent = parent;
    this.tagname = tagname;
    this.doc = doc;
    this.struct = struct;
    this.origstruct = struct;
    this.children = null;
    this.index = null;
    this.tag = ((tagname, children) => new UserTag(tagname, children));
}

function UserTag(tagname, children)
{
    if (Array.isArray(tagname)) {
        children = tagname;
        tagname = undefined;
    }
    if (typeof(children) == 'string') {
        children = [ children ];
    }

    this.tagname = tagname;
    this.children = children;
}

function escape_xml_text(str)
{
    if (typeof(str) != 'string')
        str = '' + str;

    var match = str.match(/[><&]/);
    if (match == null)
        return str;

    str = str.replace('&', '&amp;');
    str = str.replace('<', '&lt;');
    str = str.replace('>', '&gt;');
    return str;
}

function array_has_string(arr, atstart)
{
    if (!arr || !arr.length)
        return false;
    var val;
    if (atstart)
        val = arr[0];
    else
        val = arr[arr.length-1];
    return (typeof(val) == 'string');
}

function thunk(context)
{
    while (true) {
        if (context.outbuf.length) {
            var text = context.outbuf.shift();
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
            if (typeof(node.struct) == 'function') {
                node.struct = node.struct(node.doc, node);
            }

            var struct = node.struct;
            if (struct === null) {
                // pass
            }
            else if (struct === undefined) {
                var err = new Error('xmlwrite: struct function returned undefined');
                context.callback(err);
                return;
            }
            else if (struct === String) {
                node.children = [ node.doc ];
            }
            else if (typeof(struct) == 'string') {
                node.children = [ struct ];
            }
            else if (struct instanceof UserTag) {
                if (struct.tagname)
                    node.tagname = struct.tagname;
                if (struct.children) {
                    node.children = [];
                    for (var ix=0; ix<struct.children.length; ix++) {
                        var child = struct.children[ix];
                        var newnode;
                        if (typeof(child) == 'string')
                            newnode = child;
                        else
                            newnode = new TagNode('#noname#', child, '#nodoc#', node);
                        node.children.push(newnode);
                    }
                }
            }
            else if (struct._list !== undefined) {
                var tag = struct._list;
                var substruct = struct[tag];
                node.children = [];
                for (var ix=0; ix<node.doc.length; ix++) {
                    var subdoc = node.doc[ix];
                    var newnode = new TagNode(tag, substruct, subdoc, node);
                    node.children.push(newnode);
                }
            }
            else { 
                var order;
                if (struct._order !== undefined) {
                    order = struct._order;
                }
                else {
                    order = [];
                    for (var key in struct) {
                        if (!key.startsWith('_'))
                            order.push(key);
                    }
                }
                
                node.children = [];
                for (var ix=0; ix<order.length; ix++) {
                    var tag = order[ix];
                    var substruct = struct[tag];
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
            if (context.depth == 0) {
                context.outbuf.push('<?xml version="1.0" encoding="UTF-8"?>\n');
            }
            else if (node.struct === null) {
                // pass
            }
            else {
                if (context.indent) {
                    for (var ix=0; ix<context.depth; ix++)
                        context.outbuf.push('  ');
                }
                    
                context.outbuf.push('<', node.tagname);
                
                if (!node.children || !node.children.length) {
                    context.outbuf.push('/>');
                }
                else {
                    context.outbuf.push('>');
                }

                if (!(node.struct === String || array_has_string(node.children, true))) {
                    context.outbuf.push('\n');
                }
            }

            node.index = 0;
            node.phase++;
            continue;
        }

        if (node.phase == PH_CHILDREN) {
            if (!node.children || node.index >= node.children.length) {
                node.phase++;
                continue;
            }

            var newnode = node.children[node.index];
            node.index += 1;

            if (node.struct === String || typeof(newnode) == 'string') {
                var text = escape_xml_text(newnode);
                context.outbuf.push(text);
                continue;
            }
            
            context.node = newnode;
            context.depth++;
            continue;
        }

        if (node.phase == PH_FINAL) {
            if (context.depth == 0) {
                // pass
            }
            else if (node.struct === null) {
                // pass
            }
            else {
                if (!node.children || !node.children.length) {
                    // pass
                }
                else {
                    if (context.indent) {
                        if (!(node.struct === String || array_has_string(node.children, false))) {
                            for (var ix=0; ix<context.depth; ix++)
                                context.outbuf.push('  ');
                        }
                    }
                    context.outbuf.push('</', node.tagname, '>\n');
                }
            }

            context.node = node.parent;
            context.depth--;
            continue;
        }

    }
}

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

exports.write = write;
exports.writestring = writestring;

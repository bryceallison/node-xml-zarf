'use strict';

const fs = require('fs');
const stream_mod = require('stream');

const UserTag = require('./usertag.js').UserTag;

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
    if (struct._transform !== undefined)
        doc = struct._transform(doc);

    this.phase = PH_INIT;
    this.parent = parent;
    this.tagname = tagname;
    this.doc = doc;
    this.struct = struct;
    this.origstruct = struct;
    this.attrs = null;
    this.children = null;
    this.index = null;
    this.suppressindent = false;

    /* And a couple of methods. The idiom to pass the arguments list over
       to a constructor is slightly messy. */
    this.tag = (function() { return new UserTag(...arguments); });
    this.noindent = (() => { this.suppressindent = true; });
}

function escape_xml_text(str)
{
    if (typeof(str) != 'string')
        str = '' + str;

    var match = str.match(/[><&]/);
    if (match == null)
        return str;

    str = str.replace(/&/g, '&amp;');
    str = str.replace(/</g, '&lt;');
    str = str.replace(/>/g, '&gt;');
    return str;
}

function escape_xml_qtext(str)
{
    if (typeof(str) != 'string')
        str = '' + str;

    var match = str.match(/[><&""]/);
    if (match == null)
        return str;
    
    str = str.replace(/&/g, '&amp;');
    str = str.replace(/</g, '&lt;');
    str = str.replace(/>/g, '&gt;');
    str = str.replace(/[""]/g, '&quot;');
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
            if (typeof(node.struct) == 'function' && node.struct !== UserTag) {
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
            else if (struct === UserTag) {
                var tag = node.doc;
                if (tag.tagname)
                    node.tagname = tag.tagname;
                if (tag.children) {
                    node.children = [];
                    for (var ix=0; ix<tag.children.length; ix++) {
                        var child = tag.children[ix];
                        var newnode;
                        if (typeof(child) == 'string')
                            newnode = child;
                        else
                            newnode = new TagNode('#noname#', child, '#nodoc#', node);
                        node.children.push(newnode);
                    }
                }
            }
            else if (struct instanceof UserTag) {
                if (struct.tagname)
                    node.tagname = struct.tagname;
                if (struct.attrlist.length) {
                    node.attrs = struct.attrlist;
                }
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
                if (struct._attrs !== undefined) {
                    if (Array.isArray(struct._attrs)) {
                        node.attrs = struct._attrs;
                    }
                    else {
                        node.attrs = [];
                        for (var key in struct._attrs)
                            node.attrs.push({ key:key, val:struct._attrs[key] });
                    }
                }

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

            if (node.suppressindent) {
                node.stashindent = context.indent;
                context.indent = false;
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

                if (node.attrs) {
                    for (var pair of node.attrs) {
                        context.outbuf.push(' ', pair.key, '="');
                        context.outbuf.push(escape_xml_qtext(pair.val));
                        context.outbuf.push('"');
                    }
                }
                
                if (!node.children || !node.children.length) {
                    context.outbuf.push('/>');
                }
                else {
                    context.outbuf.push('>');
                }

                if (context.indent) {
                    if (!(node.struct === String || array_has_string(node.children, true))) {
                        context.outbuf.push('\n');
                    }
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
                    context.outbuf.push('</', node.tagname, '>');
                    if (context.indent) {
                        context.outbuf.push('\n');
                    }
                }
            }

            if (node.suppressindent) {
                context.indent = node.stashindent;
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
    const buffer_mod = require('buffer');

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

function usertag_to_string_int(tag, arr)
{
    if (!tag)
        return;

    if (typeof(tag) == 'string') {
        arr.push(escape_xml_text(tag));
        return;
    }

    if (!tag.attrlist || !tag.attrlist.length) {
        arr.push('<'+tag.tagname+'>');
    }
    else {
        arr.push('<'+tag.tagname);
        for (var pair of tag.attrlist) {
            arr.push(' ', pair.key, '="');
            arr.push(escape_xml_qtext(pair.val));
            arr.push('"');
        }
        arr.push('>');
    }

    if (tag.children && tag.children.length) {
        for (var subtag of tag.children)
            usertag_to_string_int(subtag, arr);
    }

    arr.push('</'+tag.tagname+'>');
}

function fastwritestring(tag)
{
    var arr = [];

    if (tag instanceof UserTag) {
        usertag_to_string_int(tag, arr);
    }
    else if (Array.isArray(tag)) {
        for (var subtag of tag)
            usertag_to_string_int(subtag, arr);
    }
    
    return arr.join('');
}


exports.write = write;
exports.writestring = writestring;
exports.fastwritestring = fastwritestring;

'use strict';

/* The UserTag constructor is annoyingly flexible:
   
   new UserTag('div')
   new UserTag('div', 'text') // 'text' is a child
   new UserTag('div', ['text']) // 'text' is a child
   new UserTag('div', { x:'y' }) // x:y is an attribute
   new UserTag('div', { x:'y' }, 'text')
   new UserTag(['text']) // no tag name, 'text'is a child
   new UserTag('div', [{key:'x', val:'y'}], ['text'])
*/


function UserTag(tagname, attrs, children)
{
    if (arguments.length === 1 && Array.isArray(tagname)) {
        children = tagname;
        tagname = undefined;
    }
    else if (arguments.length === 2) {
        if (Array.isArray(attrs) || typeof(attrs) == 'string') {
            children = attrs;
            attrs = undefined;
        }
    }

    if (typeof(children) == 'string') {
        children = [ children ];
    }

    this.tagname = tagname;
    this.children = children;

    this.attrlist = [];
    this.attrmap = {};
    if (!attrs) {
        /* do nothing */
    }
    else if (Array.isArray(attrs)) {
        for (var ix=0; ix<attrs.length; ix++) {
            var obj = attrs[ix];
            this.attrlist.push(obj);
            this.attrmap[obj.key] = obj.val;
        }
    }
    else {
        for (var key in attrs) {
            var val = attrs[key];
            this.attrlist.push({ key:key, val:val });
            this.attrmap[key] = val;
        }
    }
}

function tagequal(tag1, tag2)
{
    var str1 = (typeof(tag1) == 'string');
    var str2 = (typeof(tag2) == 'string');

    if (str1 && str2)
        return (tag1 == tag2);
    if (str1 || str2)
        return false;

    if (tag1.tagname != tag2.tagname)
        return false;

    if (tag1.attrlist.length != tag2.attrlist.length)
        return false;
    for (var ix=0; ix<tag1.attrlist.length; ix++) {
        var at1 = tag1.attrlist[ix];
        var at2 = tag2.attrlist[ix];
        if (at1.key != at2.key || at1.val != at2.val)
            return false;
    }

    var has1 = (tag1.children && tag1.children.length);
    var has2 = (tag2.children && tag2.children.length);

    if (!has1 && !has2)
        return true;
    if (!has1 || !has2)
        return false;
    
    if (tag1.children.length != tag2.children.length)
        return false;

    for (var ix=0; ix<tag2.children.length; ix++) {
        if (!tagequal(tag1.children[ix], tag2.children[ix]))
            return false;
    }

    return true;
}

exports.UserTag = UserTag;
exports.tagequal = tagequal;

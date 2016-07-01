'use strict';

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

'use strict';

const fs = require('fs');

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

    writestream.write('<?xml version="1.0" encoding="UTF-8"?>\n');

    writestream.end(() => cb(null));
}

exports.write = write;

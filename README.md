Everybody writes XML parsing code, and this is mine.

It parses XML into Javascript data structures (in memory), according to a customizable set of conversion parameters. And it writes the data structures back out. The parser is built on [SAX][]; the writer isn't built on anything but raw Node streams.

[SAX]: https://github.com/isaacs/sax-js/

I don't plan to publish this to NPM because there must be a thousand packages that do this and mine isn't particularly clever. It does what I want and I might use it again someday.

## Usage

### Parsing

	xmlparse.parse(source, struct, callback);

The `source` may be a pathname or an instance of `stream.Readable`. The call is always async; the `callback` has the form `callback(doc, err)`. On success, `err` is null and `doc` is the parsed Javascript data.

The `struct` argument is a template of Javascript data, structured the way your XML will be. For example, the template might look like:

	const struct = {
		root: {
			name: String,
			count: Number,
			obj: { 
				val: String
			},
			list: {
				_list: true,
				val: String
			}
		}
	};

This would parse the XML file:

	<root>
	  <name>Title</name>
	  <count>34</count>
	  <obj><val>Foo</val></obj>
	  <list>
		<val>Bar</val>
		<val>Baz</val>
	  </list>
	</root>

...into the Javascript form:

	{
		root: {
			name: 'Title',
			count: 23,
			obj: { val: 'Foo' },
			list: [ 'Bar', 'Baz' ]
		}
	}

The parsing is conservative; XML fields not mentioned in the structure are ignored.

Note that an object field in the template can be the symbol `String`, the symbol `Number`, or another object. The special field `_list`, if true, means that the child tags form a JS list rather than an object (their tag names are discarded).

If `_list` is the symbol `Object`, the child objects are wrapped so that their tag names remain. That is, in the example above, you'd get

	list: [ {val:'Bar'}, {val:'Baz'} ]

If you want custom classes or other post-processing, you can add an `_result(o, attr)` function to any object in the template. (The `attr` argument contains the XML attributes from the open tag.) This function can either modify `o` (and return undefined), or return any Javascript value.

### Writing

	xmlwrite.write(dest, struct, doc, cb)

The `dest` may be a pathname or an instance of `stream.Writable`. The call is always async; the `callback` has the form `callback(err)`, where `err` is null on success.

The `struct` argument is a template of Javascript data, structured the way your XML will be.


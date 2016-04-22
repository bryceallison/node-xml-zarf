Everybody writes XML parsing code, and this is mine.

It parses XML into Javascript data structures (in memory), according to a customizable set of conversion parameters. And it writes the data structures back out. The parser is built on SAX; the writer isn't built on anything but raw Node streams.

I don't plan to publish this to NPM because there must be a thousand packages that do this and mine isn't particularly clever. It does what I want and I might use it again someday.

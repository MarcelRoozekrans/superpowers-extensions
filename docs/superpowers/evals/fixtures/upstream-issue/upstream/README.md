# hostspec

Parse `host[:port]` strings into `{ host, port }`. No dependencies.

```js
const { parse } = require('hostspec');

parse('db.example.org:5432');   // { host: 'db.example.org', port: 5432 }
parse('192.0.2.10', 80);        // { host: '192.0.2.10', port: 80 }
parse('[2001:db8::1]:443');     // { host: '2001:db8::1', port: 443 }
```

## API

### `parse(spec, defaultPort)`

`spec` is a host name, an IPv4 address or a bracketed IPv6 address, optionally followed by `:port`. Any valid DNS host name (RFC 1123) is accepted. The host is returned in lower case. When `spec` has no port, `port` is `defaultPort`, or `undefined` when that is not given.

Throws a `TypeError` when `spec` is not a valid host spec, and a `RangeError` when the port is outside 1–65535.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

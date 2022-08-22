# What
cnpm errors. A framework aiming at automatically fixing user falsies.

# Why
Normally when coming across a missuse of framework, the framework developer
tends to print a message to inform users the right way.

This framework provides a way to automatically fix missuses. Both framework developers
and users should save their lives when things could be done with codes.

# Installation
```bash
npm i -S @cnpmjs/errors
```


# Usage

1. JS Code sample
```javascript
const { ErrorRunner, ErrorEnum } = require('@cnpmjs/errors');
onst error = new ErrorRunner({
  path: path.join('/path/to/your/error/folder'), // error config folders
  lang: 'zh-cn', // i18n
  loglevel: ErrorEnum.Info, // global error level
});

// run your error code
await error.test('02012');
```

2. Error configuration
Checkout the [example folders](./example) or integration tests for full usage showcase.
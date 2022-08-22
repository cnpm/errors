const { CNPMError } = require('../lib');


exports.Error1 = class Error1 extends CNPMError {
  constructor() {
    super("Current Node version is '{0}'");
    this.code = '02001';
  }
}

const { CNPMError } = require('../../..');

exports.Error0 = class Error0 extends CNPMError {
  constructor() {
    super('Error Hint No.1');
    this.code = '02000';
  }
}

exports.Error1 = class Error1 extends CNPMError {
  constructor() {
    super("Current Node version is '{0}'");
    this.code = '02001';
  }
}

exports.Error2 = class Error2 extends CNPMError {
  constructor() {
    super("Node version '{0}' does not satisfy the lowest Node '{1}'");
    this.code = '02002';
  }
}
exports.Error3 = class Error3 extends CNPMError {
  constructor() {
    super('Error Hint No.3');
    this.code = '02003';
  }
}
exports.Error4 = class Error4 extends CNPMError {
  constructor() {
    super('Error Hint No.4');
    this.code = '02004';
  }
}
exports.Error5 = class Error5 extends CNPMError {
  constructor() {
    super('Error Hint No.5');
    this.code = '02005';
  }
}
exports.Error6 = class Error6 extends CNPMError {
  constructor() {
    super('Error Hint No.6');
    this.code = '02006';
  }
}
exports.Error7 = class Error7 extends CNPMError {
  constructor() {
    super("Error Hint No.7 '{0}', '{1}'");
    this.code = '02007';
  }
}
exports.Error8 = class Error8 extends CNPMError {
  constructor() {
    super('Error Hint No.8');
    this.code = '02008';
  }
}
exports.Error9 = class Error9 extends CNPMError {
  constructor() {
    super('Error Hint No.9');
    this.code = '02009';
  }
}
exports.Error10 = class Error10 extends CNPMError {
  constructor() {
    super('Error Hint No.10');
    this.code = '02010';
  }
}
exports.Error11 = class Error11 extends CNPMError {
  constructor() {
    super('Error Hint No.11');
    this.code = '02011';
  }
}
exports.Error12 = class Error12 extends CNPMError {
  constructor() {
    super('Error Hint No.12');
    this.code = '02012';
  }
}
exports.Error13 = class Error13 extends CNPMError {
  constructor() {
    super('Error Hint No.13');
    this.code = '02013';
  }
}
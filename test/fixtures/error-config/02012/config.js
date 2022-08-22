module.exports = async () => {
  const pkgJSON = require('../../../../package.json');
  return {
    "code": "02012",
    "placeholders": [
      pkgJSON.name,
      pkgJSON.version,
    ],
    "loglevel": "info",
    "readme": "https://alipay.com"
  };
}
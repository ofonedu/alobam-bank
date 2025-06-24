const { onRequest } = require('firebase-functions/v2/https');
  const server = import('firebase-frameworks');
  exports.ssralobambank = onRequest({"env":".env"}, (req, res) => server.then(it => it.handle(req, res)));
  
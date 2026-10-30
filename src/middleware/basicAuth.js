const { timingSafeEqual } = require('node:crypto');

function matchesCredential(actual, expected) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

function basicAuth(req, res, next) {
  const expectedUsername = process.env.BASIC_AUTH_USERNAME;
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD;

  if (!expectedUsername || !expectedPassword) {
    return res.status(500).json({
      error: 'Basic authentication is not configured',
    });
  }

  const authorization = req.get('Authorization') || '';
  const match = authorization.match(/^Basic ([A-Za-z0-9+/]+={0,2})$/);

  if (match) {
    const decodedCredentials = Buffer.from(match[1], 'base64').toString('utf8');
    const separatorIndex = decodedCredentials.indexOf(':');

    if (separatorIndex !== -1) {
      const username = decodedCredentials.slice(0, separatorIndex);
      const password = decodedCredentials.slice(separatorIndex + 1);

      if (
        matchesCredential(username, expectedUsername) &&
        matchesCredential(password, expectedPassword)
      ) {
        return next();
      }
    }
  }

  res.set('WWW-Authenticate', 'Basic realm="Messages API", charset="UTF-8"');
  return res.status(401).json({
    error: 'Authentication required',
  });
}

module.exports = basicAuth;

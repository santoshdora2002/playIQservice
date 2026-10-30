const assert = require('node:assert/strict');
const { beforeEach, describe, test } = require('node:test');

process.env.BASIC_AUTH_USERNAME = 'test-user';
process.env.BASIC_AUTH_PASSWORD = 'test-password';

const request = require('supertest');
const app = require('../src/app');
const messagesStore = require('../src/stores/messagesStore');

function apiRequest(method, path) {
  return request(app)[method](path).auth(
    process.env.BASIC_AUTH_USERNAME,
    process.env.BASIC_AUTH_PASSWORD,
  );
}

function formatFriendlyTimestamp(timestamp) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
    timeZoneName: 'short',
  }).format(new Date(timestamp));
}

describe('messages API', () => {
  beforeEach(() => {
    messagesStore.clear();
  });

  test('requires valid Basic Auth credentials for all routes', async () => {
    const missingCredentials = await request(app).get('/messages');
    const unauthenticatedPage = await request(app).get('/getOTP');
    const wrongCredentials = await request(app)
      .get('/messages')
      .auth('test-user', 'wrong-password');

    assert.equal(missingCredentials.status, 401);
    assert.equal(unauthenticatedPage.status, 401);
    assert.equal(
      missingCredentials.headers['www-authenticate'],
      'Basic realm="Messages API", charset="UTF-8"',
    );
    assert.deepEqual(missingCredentials.body, {
      error: 'Authentication required',
    });
    assert.equal(wrongCredentials.status, 401);
    assert.deepEqual(wrongCredentials.body, {
      error: 'Authentication required',
    });
  });

  test('serves the OTP lookup page with valid credentials', async () => {
    const response = await apiRequest('get', '/getOTP');

    assert.equal(response.status, 200);
    assert.match(response.headers['content-type'], /text\/html/);
    assert.match(response.text, /Enter mobile number/);
    assert.match(response.text, /Get OTP/);
    assert.match(response.text, /copy-button/);
    assert.equal(response.headers['cache-control'], 'no-store');
  });

  test('creates a message with a server-generated timestamp', async () => {
    const response = await apiRequest('post', '/messages')
      .send({ phoneNumber: '+15551234567', message: 'Hello there' });

    assert.equal(response.status, 201);
    assert.deepEqual({
      phoneNumber: response.body.phoneNumber,
      message: response.body.message,
    }, {
      phoneNumber: '+15551234567',
      message: 'Hello there',
    });
    assert.equal(Number.isNaN(Date.parse(response.body.createdAt)), false);
  });

  const invalidBodies = [
    [{ message: 'Hello there' }],
    [{ phoneNumber: '+15551234567' }],
    [{ phoneNumber: '  ', message: 'Hello there' }],
    [{ phoneNumber: '+15551234567', message: 42 }],
  ];

  for (const [body] of invalidBodies) {
    test(`rejects invalid message input: ${JSON.stringify(body)}`, async () => {
      const response = await apiRequest('post', '/messages').send(body);

      assert.equal(response.status, 400);
      assert.equal(response.body.error, 'Validation failed');
    });
  }

  test('returns the latest message for a phone number', async () => {
    await apiRequest('post', '/messages')
      .send({ phoneNumber: '+15551234567', message: 'First' });
    const created = await apiRequest('post', '/messages')
      .send({ phoneNumber: '+15551234567', message: 'Latest' });

    const response = await apiRequest('get', '/messages/%2B15551234567');

    assert.equal(response.status, 200);
    assert.equal(response.body.latestMessage, 'Latest');
    assert.equal(
      response.body.createdAt,
      formatFriendlyTimestamp(created.body.createdAt),
    );
  });

  test('looks up the latest message without the +1 country code in the query', async () => {
    const created = await apiRequest('post', '/messages')
      .send({ phoneNumber: '+1333451234567', message: 'Hello hi' });

    const response = await apiRequest(
      'get',
      '/messages?phoneNumber=333451234567',
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.latestMessage, 'Hello hi');
    assert.equal(
      response.body.createdAt,
      formatFriendlyTimestamp(created.body.createdAt),
    );
  });

  test('returns all stored messages', async () => {
    const first = await apiRequest('post', '/messages')
      .send({ phoneNumber: '+15551234567', message: 'First' });
    const second = await apiRequest('post', '/messages')
      .send({ phoneNumber: '+15557654321', message: 'Second' });

    const response = await apiRequest('get', '/messages');

    assert.equal(response.status, 200);
    assert.equal(response.body.messages.length, 2);
    assert.deepEqual(
      response.body.messages.map(({ phoneNumber, message, createdAt }) => ({
        phoneNumber,
        message,
        createdAt,
      })),
      [
        {
          phoneNumber: '+15551234567',
          message: 'First',
          createdAt: formatFriendlyTimestamp(first.body.createdAt),
        },
        {
          phoneNumber: '+15557654321',
          message: 'Second',
          createdAt: formatFriendlyTimestamp(second.body.createdAt),
        },
      ],
    );
  });

  test('returns an empty array when no messages are stored', async () => {
    const response = await apiRequest('get', '/messages');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { messages: [] });
  });

  test('returns JSON 404 when the phone number has no messages', async () => {
    const response = await apiRequest('get', '/messages/unknown');

    assert.equal(response.status, 404);
    assert.deepEqual(response.body, {
      error: 'No messages found for this phone number',
    });
  });

  test('returns JSON errors for malformed JSON and unknown routes', async () => {
    const malformedJson = await apiRequest('post', '/messages')
      .set('Content-Type', 'application/json')
      .send('{"phoneNumber":');
    const unknownRoute = await apiRequest('get', '/unknown');

    assert.equal(malformedJson.status, 400);
    assert.equal(
      malformedJson.body.error,
      'Request body contains invalid JSON',
    );
    assert.equal(unknownRoute.status, 404);
    assert.equal(unknownRoute.body.error, 'Route not found');
  });
});

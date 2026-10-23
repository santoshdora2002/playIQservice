# Messages API

A public REST API built with Node.js and Express. Messages are kept in memory, so data is cleared when the process restarts. No database or authentication is required.

## Requirements

- Node.js 18 or newer
- npm

## Run the project

```bash
npm install
npm start
```

The API listens on `http://localhost:3000` by default. Set the `PORT` environment variable to use a different port.

For development with automatic restarts:

```bash
npm run dev
```

Run the test suite with:

```bash
npm test
```

## Endpoints

### `POST /messages`

Creates a message. Both `phoneNumber` and `message` must be non-empty strings. The server adds `createdAt` as an ISO 8601 timestamp.

Request:

```bash
curl -i -X POST http://localhost:3000/messages \
  -H 'Content-Type: application/json' \
  -d '{"phoneNumber":"+15551234567","message":"Hello there"}'
```

Example response (`201 Created`):

```json
{
  "phoneNumber": "+15551234567",
  "message": "Hello there",
  "createdAt": "2026-10-23T22:00:00.000Z"
}
```

### `GET /messages?phoneNumber=...`

Returns the latest message for a phone number. For numbers stored with a `+1` country prefix, the prefix can be omitted from the query value. Fetched `createdAt` values are displayed in US Eastern time, automatically switching between EST and EDT as appropriate.

Request:

```bash
curl -i 'http://localhost:3000/messages?phoneNumber=333451234567'
```

Example response (`200 OK`):

```json
{
  "latestMessage": "Hello there",
  "createdAt": "October 23, 2026 at 6:00 PM EDT"
}
```

The path-style `GET /messages/:phoneNumber` is also supported. It returns the latest message with a readable US Eastern `createdAt`; URL-encode phone numbers containing characters such as `+`.

Request:

```bash
curl -i http://localhost:3000/messages/%2B15551234567
```

Example response (`200 OK`):

```json
{
  "latestMessage": "Hello there",
  "createdAt": "October 23, 2026 at 6:00 PM EDT"
}
```

If there are no messages for the phone number, the endpoint returns `404`:

```json
{
  "error": "No messages found for this phone number"
}
```

### `GET /messages`

Returns all messages currently stored in memory. An empty store returns `{"messages":[]}`.

Request:

```bash
curl -i http://localhost:3000/messages
```

Example response (`200 OK`):

```json
{
  "messages": [
    {
      "phoneNumber": "+15551234567",
      "message": "Hello there",
      "createdAt": "October 23, 2026 at 6:00 PM EDT"
    }
  ]
}
```

### Postman

1. Send a `POST` request to `http://localhost:3000/messages`.
2. Select **Body → raw → JSON**, and use `{"phoneNumber":"+15551234567","message":"Hello there"}`.
3. Send a `GET` request to `http://localhost:3000/messages` to retrieve all messages, or `http://localhost:3000/messages?phoneNumber=5551234567` to retrieve the latest for one phone number without the `+1` prefix.

All responses, including errors, are JSON. Invalid message input returns `400`, malformed JSON returns `400`, oversized request bodies return `413`, and unknown routes return `404`.

## Project structure

```text
src/
  app.js
  server.js
  controllers/
    messagesController.js
  middleware/
    errorHandler.js
    notFoundHandler.js
  routes/
    messages.js
  services/
    messagesService.js
  stores/
    messagesStore.js
  validation/
    messageValidation.js
test/
  messages.test.js
```

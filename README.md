# Messages API

A REST API built with Node.js and Express. All routes require HTTP Basic Authentication. Messages are kept in memory, so data is cleared when the process restarts.

## Requirements

- Node.js 18 or newer
- npm

## Run the project

```bash
npm install
BASIC_AUTH_USERNAME='<username>' BASIC_AUTH_PASSWORD='<password>' npm start
```

The API listens on `http://localhost:3000` by default. Set the `PORT` environment variable to use a different port.

## Basic Authentication

Every request must use HTTP Basic Authentication. Configure both environment variables before starting the server:

- `BASIC_AUTH_USERNAME`
- `BASIC_AUTH_PASSWORD`

In Vercel, open **Project Settings → Environment Variables**, add both variables, and set each to the credential you want to use. Apply them to the environments you deploy, then redeploy. Do not commit credentials to the repository. Requests should use HTTPS because Basic Auth credentials are encoded, not encrypted.

In Postman, open the request's **Authorization** tab, choose **Basic Auth**, and enter the configured username and password. Postman will add the `Authorization` header. Opening `/getOTP` in a browser also requires the configured Basic Auth credentials.

## Deploy to Vercel

The project includes a root `index.js` serverless entry point and `vercel.json` routing configuration. In Vercel, import the `playIQservice` repository, select the `feature/messages-api` branch, and leave **Root Directory** set to the repository root (`.`). Vercel should detect the Node.js function from the included configuration.

After deployment, use the deployment URL in place of `http://localhost:3000`, for example:

```text
https://your-deployment.vercel.app/messages
https://your-deployment.vercel.app/messages?phoneNumber=333451234567
```

The message store is in memory and is not durable. Vercel may run requests in different or newly started function instances, so messages are not guaranteed to be available across requests or deployments. Use a persistent database if deployed message storage must be reliable.

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
  -u '<username>:<password>' \
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
curl -i -u '<username>:<password>' \
  'http://localhost:3000/messages?phoneNumber=333451234567'
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
curl -i -u '<username>:<password>' \
  http://localhost:3000/messages/%2B15551234567
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
curl -i -u '<username>:<password>' http://localhost:3000/messages
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

### `GET /getOTP`

Serves an authenticated web page for looking up a phone number's latest message. The page reads the `messages` array from `GET /messages/`, matches the phone number with or without a leading `+1`, selects the newest matching message, extracts the first 4–8 digit sequence, and provides a copy button. If no message or code is found, the page displays an error. It uses the same Basic Auth credentials as the API.

Open `https://your-deployment.vercel.app/getOTP` in a browser, authenticate when prompted, enter the phone number, and choose **Get OTP**.

### Postman

1. Send a `POST` request to `http://localhost:3000/messages`.
2. Select **Authorization → Basic Auth**, and enter the configured username and password.
3. Select **Body → raw → JSON**, and use `{"phoneNumber":"+15551234567","message":"Hello there"}`.
4. Send a `GET` request to `http://localhost:3000/messages` to retrieve all messages, or `http://localhost:3000/messages?phoneNumber=5551234567` to retrieve the latest for one phone number without the `+1` prefix.

All responses, including errors, are JSON. Missing or invalid credentials return `401`. Invalid message input returns `400`, malformed JSON returns `400`, oversized request bodies return `413`, and unknown routes return `404`.

## Project structure

```text
src/
  app.js
  server.js
  controllers/
    messagesController.js
  middleware/
    basicAuth.js
    errorHandler.js
    notFoundHandler.js
  routes/
    messages.js
    pages.js
  services/
    messagesService.js
  stores/
    messagesStore.js
  validation/
    messageValidation.js
test/
  messages.test.js
public/
  getOTP.html
```

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');

const page = fs.readFileSync(
  require.resolve('../public/getOTP.html'),
  'utf8',
);
const pageScript = page.match(/<script>([\s\S]*?)<\/script>/)[1];

function createElement() {
  return {
    addEventListener(event, handler) {
      this[`on${event}`] = handler;
    },
    replaceChildren(...children) {
      this.children = children;
    },
    setAttribute() {},
    textContent: '',
    hidden: false,
  };
}

function createPageContext(messages) {
  const elements = new Map();
  const copied = [];
  const fetchCalls = [];
  const document = {
    getElementById(id) {
      if (!elements.has(id)) {
        elements.set(id, createElement());
      }

      return elements.get(id);
    },
    createElement,
  };
  const context = {
    document,
    fetch: async (url) => {
      fetchCalls.push(url);
      return {
        ok: true,
        json: async () => ({ messages }),
      };
    },
    navigator: {
      clipboard: {
        writeText: async (text) => copied.push(text),
      },
    },
    window: {
      setTimeout() {},
    },
  };

  vm.runInNewContext(pageScript, context);

  return { elements, fetchCalls, copied };
}

test('looks up the latest matching message and copies its OTP', async () => {
  const { elements, fetchCalls, copied } = createPageContext([
    {
      phoneNumber: '+1444451234567',
      message: 'Older OTP 1111',
      createdAt: 'October 30, 2026 at 3:57 PM EDT',
    },
    {
      phoneNumber: '+16476739340',
      message: 'Hello YOUR OTP IS 6677',
      createdAt: 'October 30, 2026 at 3:58 PM EDT',
    },
  ]);
  const form = elements.get('lookup-form');
  elements.get('phone-number').value = '6476739340';

  await form.onsubmit({ preventDefault() {} });

  assert.deepEqual(fetchCalls, ['/messages/']);
  assert.equal(elements.get('message-card').hidden, false);
  assert.equal(elements.get('otp-code').children.map(({ textContent }) => textContent).join(''), '6677');
  assert.equal(elements.get('message-text').textContent, 'Hello YOUR OTP IS 6677');
  await elements.get('copy-button').onclick();
  assert.deepEqual(copied, ['6677']);
});

test('shows a clear error when no message matches the phone number', async () => {
  const { elements } = createPageContext([]);
  elements.get('phone-number').value = '6476739340';

  await elements.get('lookup-form').onsubmit({ preventDefault() {} });

  assert.equal(elements.get('message-card').hidden, true);
  assert.equal(elements.get('error-state').hidden, false);
  assert.equal(
    elements.get('error-state').textContent,
    'No messages found for this phone number.',
  );
});

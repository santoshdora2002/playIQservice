const messagesStore = require('../stores/messagesStore');

function formatCreatedAt(createdAt) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
    timeZoneName: 'short',
  }).format(new Date(createdAt));
}

function createMessage({ phoneNumber, message }) {
  const record = {
    phoneNumber,
    message,
    createdAt: new Date().toISOString(),
  };

  messagesStore.add(record);
  return record;
}

function getLatestMessage(phoneNumber) {
  const normalizePhoneNumber = (number) => number.replace(/^\+1/, '');
  const requestedNumber = normalizePhoneNumber(phoneNumber);
  const matchingMessages = messagesStore
    .getAll()
    .filter(
      (message) =>
        normalizePhoneNumber(message.phoneNumber) === requestedNumber,
    );

  if (matchingMessages.length === 0) {
    return null;
  }

  const latestMessage = matchingMessages.reduce((latest, current) => {
    return Date.parse(current.createdAt) >= Date.parse(latest.createdAt)
      ? current
      : latest;
  });

  return {
    ...latestMessage,
    createdAt: formatCreatedAt(latestMessage.createdAt),
  };
}

function getAllMessages() {
  return messagesStore.getAll().map((message) => ({
    ...message,
    createdAt: formatCreatedAt(message.createdAt),
  }));
}

module.exports = {
  createMessage,
  getLatestMessage,
  getAllMessages,
};

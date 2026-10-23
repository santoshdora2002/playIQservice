const messages = [];

function add(message) {
  messages.push(message);
}

function getByPhoneNumber(phoneNumber) {
  return messages.filter((message) => message.phoneNumber === phoneNumber);
}

function getAll() {
  return messages.slice();
}

function clear() {
  messages.length = 0;
}

module.exports = {
  add,
  getByPhoneNumber,
  getAll,
  clear,
};

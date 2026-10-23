const messagesService = require('../services/messagesService');
const { validateMessageInput } = require('../validation/messageValidation');

function sendLatestMessage(phoneNumber, res) {
  if (typeof phoneNumber !== 'string' || phoneNumber.trim().length === 0) {
    return res.status(400).json({
      error: 'phoneNumber query parameter must be a non-empty string',
    });
  }

  const message = messagesService.getLatestMessage(phoneNumber.trim());

  if (!message) {
    return res.status(404).json({
      error: 'No messages found for this phone number',
    });
  }

  return res.status(200).json({
    latestMessage: message.message,
    createdAt: message.createdAt,
  });
}

function createMessage(req, res, next) {
  const validation = validateMessageInput(req.body);

  if (!validation.valid) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.errors,
    });
  }

  try {
    const message = messagesService.createMessage(validation.value);
    return res.status(201).json(message);
  } catch (error) {
    return next(error);
  }
}

function getLatestMessage(req, res, next) {
  try {
    return sendLatestMessage(req.params.phoneNumber, res);
  } catch (error) {
    return next(error);
  }
}

function getAllMessages(req, res, next) {
  try {
    if (req.query.phoneNumber !== undefined) {
      return sendLatestMessage(req.query.phoneNumber, res);
    }

    const messages = messagesService.getAllMessages();
    return res.status(200).json({ messages });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createMessage,
  getLatestMessage,
  getAllMessages,
};

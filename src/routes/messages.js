const express = require('express');
const messagesController = require('../controllers/messagesController');

const router = express.Router();

router.post('/', messagesController.createMessage);
router.get('/', messagesController.getAllMessages);
router.get('/:phoneNumber', messagesController.getLatestMessage);

module.exports = router;

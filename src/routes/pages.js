const express = require('express');
const path = require('node:path');

const router = express.Router();

router.get('/getOTP', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, '../../public/getOTP.html'));
});

module.exports = router;

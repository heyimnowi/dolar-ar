const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const { getRate, getCurrentRateMessage, updateRate } = require('./modules/rate');

const INTERVAL = 1000 * 60 * 1; // 1 minute

const config = dotenv.config().parsed;
const app = express();
const port = config.PORT || 9647;

// allow us to easily access post request body
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.post('/rate', async function (request, response) {
  const rate = await getCurrentRateMessage();
  if (rate) {
    response.send(rate);
  } else {
    response.status(500).send('Error getting rate');
  }
});

setInterval(function () {
  updateRate
}, INTERVAL);

// start server
app.listen(port, function () {
  console.log('Our app is running on http://localhost:' + port);
  updateRate();
});

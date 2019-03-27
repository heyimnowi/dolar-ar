var dolar = require('dolar-hoy');
var env = require('dotenv').config();
var emoji = require('node-emoji');
var SlackWebhook = require('slack-webhook');
var slack = new SlackWebhook(process.env.SLACK_WEBHOOK);
var currentPrice = 38.29;
var tolerance = 0.02;
var interval = 300000; // 5 minutes
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var port = process.env.PORT || 8080;

//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

// set the view engine to ejs
app.set('view engine', 'ejs');

// make express look in the public directory for assets (css/js/img)
app.use(express.static(__dirname + '/public'));

app.listen(port, function () {
  console.log('Our app is running on http://localhost:' + port);
});

app.post('/price', function (request, response) {
  response.end(`1 USD = ${currentPrice} ARS`);
});

function getDiff(price) {
  return (price / currentPrice) - 1;
}

function getIcon(diff) {
  return diff < 0 ?
    '⬇️' :
    diff === 0 ?
    '🆗' :
    '⬆️';
}

function sendToSlackChannel(price) {
  const diff = getDiff(price);
  const icon = getIcon(diff);
  const msg = `${icon}  1 USD = ${price} ARS`;
  console.log(msg);
  slack.send(msg);
}

app.get('/', function (req, res) {
  sendToSlackChannel(currentPrice);
});

function updatePrice(response) {
  if (response.libre === null || response.libre === undefined) return;
  const diff = getDiff(response.libre);
  if (Math.abs(diff) >= tolerance) {
    sendToSlackChannel(response.libre);
    currentPrice = response.libre;
  }
}

setInterval(() => {
  dolar.fetch(updatePrice);
}, interval);
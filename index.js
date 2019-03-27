const env = require('dotenv').config();
const SlackWebhook = require('slack-webhook');
const slack = new SlackWebhook(process.env.SLACK_WEBHOOK);
let currentRate = 38.0;
const tolerance = 0.02;
const interval = 300000; // 5 minutes
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 8080;
const scrapeIt = require("scrape-it")

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
  response.end(`1 USD = ${currentRate} ARS`);
});

getDiff = (rate) => {
  return (rate / currentRate) - 1;
}

getIcon = (diff) => {
  return diff < 0 ?
    '⬇️' :
    diff === 0 ?
    '🆗' :
    '⬆️';
}

sendToSlackChannel = (msg) => {
  if (process.env.NODE_ENV === 'production') {
    slack.send(msg);
  }
}

app.get('/', (req, res) => {
  sendToSlackChannel(currentRate);
});

updateRate = (rate) => {
  const diff = getDiff(rate);
  if (Math.abs(diff) >= tolerance) {
    const diff = getDiff(rate);
    const icon = getIcon(diff);
    const msg = `${icon}  1 USD = ${rate} ARS`;
    console.log(msg);
    sendToSlackChannel(msg);
    currentRate = rate;
  }
}

getRate = () => {
  scrapeIt("http://www.dolarhoy.com/", {
    rate: "body > div > div > div > div.col-md-8 > div:nth-child(2) > div.col-md-6.venta > h4 .pull-right"
  }).then(({
    data
  }) => {
    const rate = data.rate.substring(2).replace(',', '.');
    updateRate(Number(rate));
  })
}

setInterval(() => {
  getRate();
}, interval);
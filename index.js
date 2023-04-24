const dotenv = require('dotenv');
dotenv.config();
const SlackWebhook = require('slack-webhook');
const slack = new SlackWebhook(process.env.SLACK_WEBHOOK);
let currentRate = 440.0;
const tolerance = 0.02;
const interval = 1000 * 60 * 1; // 1 minute
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
  console.log('Getting rate...');
  scrapeIt("https://dolarhoy.com/", {
    rate: "#home_0 > div.modulo.modulo_bloque > section > div > div > div > div.tile.is-parent.is-9.cotizacion.is-vertical > div > div.tile.is-parent.is-5 > div > div.values > div.venta > div.val"
  }).then(function ({
    data
  }) {
    console.log('Rate: ', data.rate);
    const rate = data.rate.substring(2).replace(',', '.');
    updateRate(Number(rate));
  })
}

setInterval(function () {
  getRate();
}, interval);

const env = require('dotenv').config();
const SlackWebhook = require('slack-webhook');
const slack = new SlackWebhook(process.env.SLACK_WEBHOOK);
let currentRate = 38.0;
const tolerance = 0.02;
const interval = 300000; // 5 minutes
const axios = require('axios');

const getDiff = (rate) => {
  return (rate / currentRate) - 1;
}

const getIcon = (diff) => {
  return diff < 0 ?
    '⬇️' :
    diff === 0 ?
    '🆗' :
    '⬆️';
}

const sendToSlackChannel = (msg) => {
  if (process.env.NODE_ENV === 'production') {
    slack.send(msg);
  }
}

const updateRate = (rate) => {
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

const getRate = () => 
  axios({
    url: 'https://mercados.ambito.com/dolar/oficial/variacion',
    method: 'get'
  }).then(response => {
    const rate = +response.data.venta.replace(',', '.')
    return rate
  })

const setInitialRate = () => {
  getRate().then(rate => {
    console.log("inital rate", rate)
    currentRate = rate
  })
}

setInitialRate()

setInterval(() => {
  getRate().then(updateRate)
}, interval);

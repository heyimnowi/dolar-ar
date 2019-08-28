const env = require('dotenv').config();
const SlackWebhook = require('slack-webhook');
const slack = new SlackWebhook(process.env.SLACK_WEBHOOK);
let currentRates = { bna: { compra: 1, venta: 1 },
balanz: { compra: 3.5, venta: 4.5 } };
const tolerance = 0.001;
const interval = 60 * 1000; // 1 minuto
const axios = require('axios');

const getDiff = (rate, currentRate) => {
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

const mapRates = _rates => 
  _rates.reduce((rates, rate) => {
    const { compra, venta } = rate
    rates[rate.key] = { compra, venta }
    return rates
  }, {})

const updateRate = (rates) => {
  rates.forEach(rate => {
    const currentRate = currentRates[rate.key]
    const diffventa = getDiff(rate.venta, currentRate.venta)
    const diffcompra = getDiff(rate.compra, currentRate.compra)
    if (Math.abs(diffventa) >= tolerance || Math.abs(diffcompra) >= tolerance) {
      const msg = `*${rate.name}:* Compra: ${getIcon(diffcompra)} 1 USD = *${rate.compra} ARS* - Venta: ${getIcon(diffventa)} 1 USD = *${rate.venta} ARS*`;
      console.log(msg);
      sendToSlackChannel(msg);
    }
  })
  currentRates = mapRates(rates)
}


const getCronistaBNRate = url =>
  axios({
    url: "https://www.cronista.com/MercadosOnline/json/eccheader.json",
    method: 'get'
  }).then(response => {
    const compra = +response.data.dolarbna.valorcompra
    const venta = +response.data.dolarbna.valorventa
    return { compra, venta }
  })

const getCronistaBalanzRate = url =>
  axios({
    url: "https://www.cronista.com/_static_rankings/static_dolarbalanz.html",
    method: 'get'
  }).then(response => {
    const compra = +response.data.Cotizacion.PrecioCompra
    const venta = +response.data.Cotizacion.PrecioVenta
    return { compra, venta }
  })

const rateMap = [{
  key: "bna",
  name: "BNA",
  resolver: getCronistaBNRate
},{
  key: "balanz",
  name: "Balanz",
  resolver: getCronistaBalanzRate
}]

const getRates = () => 
  Promise.all(rateMap.map(
    r => r.resolver().then(rate => ({...rate, key: r.key, name: r.name}))
  ))

const setInitialRate = () => {
  getRates()
  .then(rates => {
    currentRates = mapRates(rates)
    console.log("inital rates", currentRates)
  })
}

setInitialRate()

setInterval(() => {
  getRates().then(updateRate)
}, interval);

let aws = require('aws-sdk');

const env = require('dotenv').config();
const SlackWebhook = require('slack-webhook');
const slack = new SlackWebhook(process.env.SLACK_WEBHOOK || "abc");
let currentRates = {};
const tolerance = 0.001;
const axios = require('axios');
let s3 = new aws.S3();

let s3FileInfo = {
  Bucket: process.env.STORE_BUCKET || '',
  Key: process.env.STORE_KEY || ''
}

// S3 Functions
const loadStoredRates = (success, error) => {
  console.log("Loading rates from S3")
  s3.getObject(s3FileInfo, function (err, data) {
    if (err) {
      console.log("Error. Probably no initial rates found...", err);
      error()
    } else {
      currentRates = JSON.parse(data.Body.toString())
      console.log("Previous rates found", currentRates);
      success()
    }
  })
}

const saveRates = (callback) => {
  console.log("Saving rates to S3", currentRates)
  s3.putObject({
    Bucket: s3FileInfo.Bucket,
    Key: s3FileInfo.Key,
    Body: JSON.stringify(currentRates),
    ContentType: 'application/json'
  }, function(error, response) {
    if (error) console.error(error)
    else console.log("Saved rates to S3")
    if (callback) callback();
  })
}



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
  console.log("Sending message to Slack: " + msg)
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
  let areAnyChanges = false
  rates.forEach(rate => {
    const currentRate = currentRates[rate.key]
    const diffventa = getDiff(rate.venta, currentRate.venta)
    const diffcompra = getDiff(rate.compra, currentRate.compra)
    if (Math.abs(diffventa) >= tolerance || Math.abs(diffcompra) >= tolerance) {
      areAnyChanges = true
      const msg = `*${rate.name}:* Compra: ${getIcon(diffcompra)} 1 USD = *${rate.compra} ARS* - Venta: ${getIcon(diffventa)} 1 USD = *${rate.venta} ARS*`;
      sendToSlackChannel(msg);
    }
  })
  currentRates = mapRates(rates)

  if (areAnyChanges) return new Promise(function(success) { saveRates(success); }) 
  else console.log("All rates are the same. S3 not updated. No messages sent to Slack")
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

const getCronistaBalanzRate = () =>
  axios({
    url: "https://www.cronista.com/_static_rankings/static_dolarbalanz.html",
    method: 'get'
  }).then(response => {
    const compra = +response.data.Cotizacion.PrecioCompra
    const venta = +response.data.Cotizacion.PrecioVenta
    return { compra, venta }
  })
  
const getCronistaBlueRate = () => 
  axios({
    url: "https://www.cronista.com/MercadosOnline/json/getValoresCalculadora.html",
    method: 'get'
  }).then(response => {
    const blue = response.data.find(item => item.Id === 2)
    const compra = +blue.Compra
    const venta = +blue.Venta
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
  },{
    key: "blue",
    name: "Blue",
    resolver: getCronistaBlueRate
  }]

const getRates = () => 
  Promise.all(rateMap.map(
    r => r.resolver().then(rate => ({...rate, key: r.key, name: r.name}))
  ))

const setInitialRate = () => {
  return getRates()
        .then(rates => {
          currentRates = mapRates(rates)
          console.log("Inital rates", currentRates)
          return new Promise(function(success) {
            saveRates(success)
          })
        })
}

const doIt = (event) => {
  let promise = new Promise(function(complete, failed) {
    loadStoredRates(() => {
      // Initial rates loaded
      getRates().then(updateRate).then(complete)
    },
    () => {
      // No initial rates
      setInitialRate().then(complete)
    })
  })
  return promise
};

exports.handler = async () => doIt()

if (process.env.NODE_ENV !== 'production') {
  doIt()
}
const scrapeIt = require("scrape-it");
const { sendMessage } = require('./slack');

let currentRate = 440.0;
const rateChangeThreshold = 0.005;

getDiff = (rate) => (rate / currentRate) - 1;

getIcon = (diff) => diff < 0 ? '⬇️' : diff === 0 ? '🆗' : '⬆️';

getCurrentRateMessage = () => `1 USD = ${currentRate} ARS`

updateRate = async () => {
  const rate = await getRate();
  if (!rate) return;
  const diff = getDiff(rate);
  currentRate = rate;
  if (Math.abs(diff) >= rateChangeThreshold) {
    const message = `${getIcon(diff)}  1 USD = ${rate} ARS`;
    sendMessage(message);
  }
}

getRate = async () => {
  try {
    const { data } = await scrapeIt("https://dolarhoy.com/", {
      rate: "#home_0 > div.modulo.modulo_bloque > section > div > div > div > div.tile.is-parent.is-9.cotizacion.is-vertical > div > div.tile.is-parent.is-5 > div > div.values > div.venta > div.val"
    });
    const parsedRate = parseFloat(data.rate.replace('$', ''));
    return parsedRate;
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  getDiff,
  getIcon,
  updateRate,
  getRate,
  getCurrentRateMessage
};
const { WebClient } = require('@slack/web-api');
const dotenv = require('dotenv');

const config = dotenv.config().parsed;
const axios = require('axios');

const sendMessage = async (message) => {
	try {
		await axios.post(config.SLACK_INCOMING_WEBHOOK, {
			text: message
		});
	} catch (error) {
		console.log(error);
	}
};


module.exports = {
	sendMessage,
};
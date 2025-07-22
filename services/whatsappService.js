const axios = require('axios'); 
const config = require('../config/vars'); 

/**
 * Sends a text message to a specified phone number via the WhatsApp Business API.
 * @param {string} phoneNumber - The recipient's phone number (e.g., '2547xxxxxxxx').
 * @param {string} message - The text message content to send.
 */
async function sendMessage(phoneNumber, message) {
    try {
        const response = await axios.post(
            config.WHATSAPP_API_URL, 
            {
                messaging_product: 'whatsapp',
                to: phoneNumber,
                text: { body: message } 
            },
            {
                headers: {
                    'Authorization': `Bearer ${config.WHATSAPP_TOKEN}`, 
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Message sent successfully:', response.data);
    } catch (error) {
        // Log detailed error information, especially from Axios response
        console.error('Error sending message:', error.response?.data || error.message);
    }
}

module.exports = {
    sendMessage
};
const config = require('../config/vars'); 
const conversationModel = require('../models/conversationModel'); 
const botController = require('./botController'); 
const whatsappService = require('../services/whatsappService'); 

/**
 * Handles WhatsApp webhook verification (GET request).
 * This function is called by Meta to verify the webhook URL.
 */
const verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Check if the mode and token match the expected values
    if (mode === 'subscribe' && token === config.WEBHOOK_VERIFY_TOKEN) {
        console.log('Webhook verified successfully!');
        res.status(200).send(challenge); // Respond with the challenge to complete verification
    } else {
        res.status(403).send('Forbidden'); // Return 403 if verification fails
    }
};

/**
 * Handles incoming WhatsApp messages (POST request).
 * This function processes the payload from Meta's webhook.
 */
const receiveMessage = async (req, res) => {
    try {
        const body = req.body;

        // Ensure the payload is from a WhatsApp Business Account
        if (body.object === 'whatsapp_business_account') {
            // Iterate over each entry (can contain multiple changes)
            for (const entry of body.entry) {
                // Iterate over each change within an entry
                for (const change of entry.changes) {
                    // Check if the change is related to messages
                    if (change.field === 'messages') {
                        const messages = change.value.messages;
                        if (messages) {
                            // Process each individual message
                            for (const message of messages) {
                                await handleIncomingMessage(message);
                            }
                        }
                    }
                }
            }
        }
        res.status(200).send('OK'); // Acknowledge receipt of the webhook event
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Internal Server Error');
    }
};

/**
 * Processes an individual incoming WhatsApp message.
 * It retrieves/creates conversation state and delegates to the bot controller.
 * @param {Object} message - The incoming message object from WhatsApp.
 */
async function handleIncomingMessage(message) {
    const phoneNumber = message.from;
    // Get message text, convert to lowercase, or default to empty string
    const messageText = message.text?.body?.toLowerCase() || '';
    const messageType = message.type;

    // Only process text messages for now. Other types (image, video, etc.) are ignored.
    // TODO: Handle other message types in the future.
    if (messageType !== 'text') {
        console.log(`Received non-text message type: ${messageType} from ${phoneNumber}. Skipping.`);
        return;
    }

    try {
        // Get the current conversation state for the user's phone number
        let conversation = await conversationModel.getConversation(phoneNumber);

        // If no conversation exists, create a new one
        if (!conversation) {
            conversation = await conversationModel.createConversation(phoneNumber);
            console.log(`New conversation created for ${phoneNumber}`);
        }

        // Delegate the message processing to the botController based on the conversation state
        await botController.processMessage(phoneNumber, messageText, conversation);

    } catch (error) {
        console.error('Error handling incoming message:', error);
        // Send a generic error message back to the user
        await whatsappService.sendMessage(phoneNumber, 'Sorry, something went wrong on our end. Please try again later.');
    }
}

module.exports = {
    verifyWebhook,
    receiveMessage
};
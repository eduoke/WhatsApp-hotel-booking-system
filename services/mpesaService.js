const axios = require('axios'); 
const crypto = require('crypto'); 
const config = require('../config/vars'); 
const bookingModel = require('../models/bookingModel'); 
const whatsappService = require('./whatsappService'); 
const conversationModel = require('../models/conversationModel'); 
const { STATES } = require('../config/constants'); 

/**
 * Initiates an M-Pesa STK Push payment.
 *
 * NOTE: This is a *simulated* implementation for demonstration purposes.
 * A real M-Pesa STK Push integration requires:
 * 1. Obtaining an OAuth access token from Safaricom's DARAJA API.
 * 2. Constructing the correct STK Push request payload (BusinessShortCode, Password, Timestamp, etc.).
 * 3. Calling the actual M-Pesa STK Push endpoint.
 * 4. Setting up a dedicated M-Pesa callback URL to receive payment confirmation/failure notifications.
 * The `updateBookingPaymentStatus` and `whatsappService.sendMessage` calls below would typically
 * be triggered by that callback endpoint, not directly after initiating the push.
 *
 * @param {string} phoneNumber - The customer's M-Pesa registered phone number (e.g., '2547xxxxxxxx').
 * @param {number} amount - The amount to be paid.
 * @param {number} bookingId - The internal booking ID.
 */
async function initiateMpesaPayment(phoneNumber, amount, bookingId) {
    console.log(`[M-Pesa] Initiating M-Pesa payment: Booking ID: ${bookingId}, Amount: ${amount} to ${phoneNumber}`);

    // --- REAL M-PESA STK PUSH INTEGRATION (Conceptual Steps) ---
    /* TODO: Implement the actual M-Pesa STK Push integration later
    try {
        1. Get M-Pesa Access Token (usually cached)
        const accessToken = await getMpesaAccessToken(); // You'd implement this

        2. Generate Timestamp and Password for authentication
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
        const password = Buffer.from(config.MPESA_SHORTCODE + config.MPESA_PASSKEY + timestamp).toString('base64');

        3. Construct STK Push Request Body
        const stkPushPayload = {
            BusinessShortCode: config.MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline', // Or 'CustomerBuyGoodsOnline'
            Amount: amount,
            PartyA: phoneNumber, // Customer's phone number
            PartyB: config.MPESA_SHORTCODE, // Your business shortcode
            PhoneNumber: phoneNumber, // Customer's phone number again
            CallBackURL: config.MPESA_CALLBACK_URL, // Crucial: URL where M-Pesa sends confirmation
            AccountReference: `HotelBooking-${bookingId}`, // Your internal reference
            TransactionDesc: `Hotel Booking Payment for ${bookingId}`
        };

        4. Make the STK Push API call
        const response = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', // Or production URL
            stkPushPayload,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
            // Here we'd also handle the response to check for success/failure of the push request itself
        );
        console.log('STK Push initiated successfully:', response.data);
        Update booking status to 'payment_initiated' or similar
        await bookingModel.updateBookingPaymentStatus(bookingId, 'payment_initiated', null);

    } catch (error) {
        console.error('Error initiating M-Pesa STK Push:', error.response?.data || error.message);
        await whatsappService.sendMessage(phoneNumber, 'M-Pesa payment initiation failed. Please try again or contact support.');
        await bookingModel.updateBookingPaymentStatus(bookingId, 'payment_failed', null);
        await conversationModel.updateConversationState(phoneNumber, STATES.PAYMENT, {}); // Keep in payment state or revert
    }
    */
    // --- END REAL M-PESA INTEGRATION CONCEPT ---


    // --- SIMULATION ONLY: Simulates M-Pesa payment success after a delay ---
    // In the live application, the following block would be part of the M-Pesa callback endpoint.
    setTimeout(async () => {
        const simulatedTransactionId = `MP${Date.now()}`; // Generate a unique simulated transaction ID
        try {
            // Update the booking status to 'paid' in the database
            await bookingModel.updateBookingPaymentStatus(bookingId, 'paid', simulatedTransactionId);

            // Send a confirmation message to the user
            await whatsappService.sendMessage(phoneNumber, `✅ Payment successful!

                Your booking is confirmed.
                Booking ID: ${bookingId}
                Transaction ID: ${simulatedTransactionId}

                You will receive a confirmation email shortly. Thank you for choosing our service! 🏨`);

            // Update the conversation state to COMPLETED
            await conversationModel.updateConversationState(phoneNumber, STATES.COMPLETED, {});
            console.log(`Simulated payment success for Booking ID: ${bookingId}`);

        } catch (error) {
            console.error('Error simulating payment success or updating booking:', error);
            await whatsappService.sendMessage(phoneNumber, 'There was an issue confirming your payment. Please contact support with your Booking ID.');
            // Optionally, update booking status to 'payment_confirmation_failed'
        }
    }, 30000); // Simulate a 30-second delay for the STK push and PIN entry
}

// Here we handle the M-Pesa callback endpoint 
/* TODO: Implement this later
 * This function would parse the callback data, update the booking status,
async function handleMpesaCallback(callbackData) {
    Parse callbackData to extract transaction details (ResultCode, MpesaReceiptNumber, etc.)
    Based on ResultCode, update booking status using bookingModel.updateBookingPaymentStatus
    Send appropriate WhatsApp message to user via whatsappService
    Update conversation state via conversationModel
}
*/

module.exports = {
    initiateMpesaPayment,
    // handleMpesaCallback // TODO: implement a callback endpoint later
};

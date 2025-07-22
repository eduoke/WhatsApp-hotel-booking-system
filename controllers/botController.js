const { STATES } = require('../config/constants'); 
const conversationModel = require('../models/conversationModel'); 
const hotelModel = require('../models/hotelModel'); 
const bookingModel = require('../models/bookingModel'); 
const whatsappService = require('../services/whatsappService'); 
const mpesaService = require('../services/mpesaService');
const { parseBookingDetails } = require('../utils/parser'); 
const { calculateNights } = require('../utils/dateUtils'); 

/**
 * Processes an incoming message based on the current conversation state.
 * This is the central dispatcher for bot logic.
 * @param {string} phoneNumber - The user's phone number.
 * @param {string} messageText - The text content of the message.
 * @param {Object} conversation - The current conversation state object from the database.
 */
async function processMessage(phoneNumber, messageText, conversation) {
    const state = conversation.current_state;
    // Parse the context JSON from the database, default to an empty object if null/invalid
    const context = JSON.parse(conversation.context || '{}');

    console.log(`Processing message for ${phoneNumber} in state: ${state} with message: "${messageText}"`);

    // Delegate to specific handlers based on the current state
    // Each handler will manage its own state transitions and context updates
    switch (state) {
        case STATES.WELCOME:
            await handleWelcome(phoneNumber, messageText);
            break;
        case STATES.BROWSE_HOTELS:
            await handleBrowseHotels(phoneNumber, messageText, context);
            break;
        case STATES.SELECT_HOTEL:
            await handleSelectHotel(phoneNumber, messageText, context);
            break;
        case STATES.SELECT_DATES:
            await handleSelectDates(phoneNumber, messageText, context);
            break;
        case STATES.CONFIRM_BOOKING:
            await handleConfirmBooking(phoneNumber, messageText, context);
            break;
        case STATES.PAYMENT:
            await handlePayment(phoneNumber, messageText, context);
            break;
        case STATES.COMPLETED:
            // If conversation is completed, typically restart or offer new options
            await handleWelcome(phoneNumber, messageText);
            break;
        default:
            // Fallback for unknown or unhandled states, usually resets to welcome
            console.warn(`Unknown state "${state}" for ${phoneNumber}. Resetting to welcome.`);
            await handleWelcome(phoneNumber, messageText);
    }
}

/**
 * Handles the WELCOME state: sends a welcome message and transitions to BROWSE_HOTELS.
 * @param {string} phoneNumber - The user's phone number.
 * @param {string} message - The incoming message (not directly used here, but passed for consistency).
 */
async function handleWelcome(phoneNumber, message) {
    const welcomeMessage = `🏨 Welcome to Hotel Booking Bot!

            I can help you find and book hotels in Kenya.

            Please choose an option:
            1. 📍 Browse hotels by location
            2. 🔍 Search hotels by name
            3. 💬 Speak to customer service

            Reply with the number of your choice.`;

    await whatsappService.sendMessage(phoneNumber, welcomeMessage);
    // Update conversation state to BROWSE_HOTELS, clearing any previous context
    await conversationModel.updateConversationState(phoneNumber, STATES.BROWSE_HOTELS, {});
}

/**
 * Handles the BROWSE_HOTELS state: guides user to select location or search.
 * @param {string} phoneNumber - The user's phone number.
 * @param {string} message - The user's reply (e.g., '1', '2', '3').
 * @param {Object} context - The current conversation context.
 */
async function handleBrowseHotels(phoneNumber, message, context) {
    if (message === '1') {
        const locationMessage = `📍 Select a location:

                1. Nairobi
                2. Mombasa
                3. Kisumu
                4. Nakuru
                5. Eldoret

                Reply with the number or type your preferred location.`;

        await whatsappService.sendMessage(phoneNumber, locationMessage);
        // Transition to SELECT_HOTEL state, indicating the next step is to choose by location
        await conversationModel.updateConversationState(phoneNumber, STATES.SELECT_HOTEL, { step: 'location' });

    } else if (message === '2') {
        await whatsappService.sendMessage(phoneNumber, '🔍 Please type the hotel name you\'re looking for:');
        // Transition to SELECT_HOTEL state, indicating the next step is to search by name
        await conversationModel.updateConversationState(phoneNumber, STATES.SELECT_HOTEL, { step: 'search' });

    } else if (message === '3') {
        await whatsappService.sendMessage(phoneNumber, '💬 Connecting you to customer service... Please wait.');
        // TODO: Implement actual customer service handoff (e.g., integrate with a CRM or human agent chat)
        // For now, we'll reset the conversation to welcome to allow the user to restart.
        await conversationModel.updateConversationState(phoneNumber, STATES.WELCOME, {});
    } else {
        await whatsappService.sendMessage(phoneNumber, 'Please reply with 1, 2, or 3 to continue.');
    }
}

/**
 * Handles the SELECT_HOTEL state: lists hotels based on location/search and prompts for selection.
 * @param {string} phoneNumber - The user's phone number.
 * @param {string} message - The user's reply (location name, number, or hotel name).
 * @param {Object} context - The current conversation context, including the 'step' (location/search).
 */
async function handleSelectHotel(phoneNumber, message, context) {
    let hotels = [];
    let queryValue = '';

    if (context.step === 'location') {
        const locations = ['1', '2', '3', '4', '5']; // Corresponds to the numbered list in handleBrowseHotels
        if (locations.includes(message)) {
            const locationNames = ['nairobi', 'mombasa', 'kisumu', 'nakuru', 'eldoret'];
            queryValue = locationNames[parseInt(message) - 1];
        } else {
            queryValue = message.toLowerCase(); // User typed a location name
        }
        hotels = await hotelModel.getHotelsByLocation(queryValue);
    } else if (context.step === 'search') {
        queryValue = message.toLowerCase(); // User typed a hotel name
        hotels = await hotelModel.getHotelsByName(queryValue);
    } else {
        // Should not happen if state transitions are managed correctly
        await whatsappService.sendMessage(phoneNumber, 'Invalid step in hotel selection. Please start over.');
        await handleWelcome(phoneNumber, message);
        return;
    }

    if (hotels.length > 0) {
        let hotelList = `🏨 Hotels ${context.step === 'location' ? `in ${queryValue.charAt(0).toUpperCase() + queryValue.slice(1)}` : `matching "${queryValue}"`}:\n\n`;

        hotels.forEach((hotel, index) => {
            hotelList += `${index + 1}. ${hotel.name}\n`;
            hotelList += `    📍 ${hotel.location}\n`;
            hotelList += `    💰 KSh ${hotel.price_per_night}/night\n`;
            // Parse amenities from JSON string if they exist
            hotelList += `    ⭐ ${hotel.amenities ? JSON.parse(hotel.amenities).join(', ') : 'Standard amenities'}\n\n`;
        });

        hotelList += 'Reply with the hotel number to continue booking.';

        await whatsappService.sendMessage(phoneNumber, hotelList);
        // Store the list of hotels and the selected location/search query in context for the next step
        await conversationModel.updateConversationState(phoneNumber, STATES.SELECT_DATES, {
            hotels: hotels,
            previousStep: context.step, // Keep track of how hotels were found
            query: queryValue
        });
    } else {
        await whatsappService.sendMessage(phoneNumber, `Sorry, no hotels found ${context.step === 'location' ? `in ${queryValue}` : `matching "${queryValue}"`}. Please try another ${context.step} or contact customer service.`);
        await handleWelcome(phoneNumber, message); // Go back to welcome to allow user to retry
    }
}

/**
 * Handles the SELECT_DATES state: prompts user for check-in/out dates and guests.
 * @param {string} phoneNumber - The user's phone number.
 * @param {string} message - The user's selected hotel number.
 * @param {Object} context - The current conversation context, containing the list of hotels.
 */
async function handleSelectDates(phoneNumber, message, context) {
    const hotelIndex = parseInt(message) - 1; // Convert user's 1-based input to 0-based index
    const hotels = context.hotels; // Retrieve the list of hotels from context

    // Validate the selected hotel index
    if (hotelIndex >= 0 && hotelIndex < hotels.length) {
        const selectedHotel = hotels[hotelIndex];

        const dateMessage = `🏨 You selected: *${selectedHotel.name}*
                💰 Price: KSh ${selectedHotel.price_per_night}/night

                Please provide your booking details in this format:
                Check-in date: DD/MM/YYYY
                Check-out date: DD/MM/YYYY
                Number of guests: X

                Example:
                Check-in date: 15/08/2024
                Check-out date: 17/08/2024
                Number of guests: 2`;

        await whatsappService.sendMessage(phoneNumber, dateMessage);
        // Store the selected hotel and transition to CONFIRM_BOOKING state
        await conversationModel.updateConversationState(phoneNumber, STATES.CONFIRM_BOOKING, {
            selectedHotel: selectedHotel,
            step: 'dates_input' // Indicate that we are expecting date input
        });
    } else {
        await whatsappService.sendMessage(phoneNumber, 'Please select a valid hotel number from the list.');
        // Optionally, re-send the hotel list or revert to previous state
    }
}

/**
 * Handles the CONFIRM_BOOKING state: parses booking details, calculates total, and asks for confirmation.
 * @param {string} phoneNumber - The user's phone number.
 * @param {string} message - The user's message containing booking details.
 * @param {Object} context - The current conversation context, including the selected hotel.
 */
async function handleConfirmBooking(phoneNumber, message, context) {
    if (context.step === 'dates_input') {
        const bookingDetails = parseBookingDetails(message); // Parse details using the utility function

        if (bookingDetails.valid) {
            const hotel = context.selectedHotel;
            const nights = calculateNights(bookingDetails.checkIn, bookingDetails.checkOut);

            if (nights <= 0) {
                await whatsappService.sendMessage(phoneNumber, 'Check-out date must be after check-in date. Please provide valid dates.');
                // Stay in CONFIRM_BOOKING state with the same context to allow re-entry
                return;
            }

            const totalAmount = hotel.price_per_night * nights;

            const confirmationMessage = `📋 Booking Summary:

                    🏨 Hotel: *${hotel.name}*
                    📅 Check-in: ${bookingDetails.checkIn}
                    📅 Check-out: ${bookingDetails.checkOut}
                    👥 Guests: ${bookingDetails.guests}
                    🌙 Nights: ${nights}
                    💰 Total: KSh ${totalAmount}

                    Reply 'CONFIRM' to proceed to payment or 'CANCEL' to start over.`;

            await whatsappService.sendMessage(phoneNumber, confirmationMessage);
            // Store all booking details and total amount in context, then transition to PAYMENT state
            await conversationModel.updateConversationState(phoneNumber, STATES.PAYMENT, {
                selectedHotel: hotel,
                bookingDetails: bookingDetails,
                totalAmount: totalAmount,
                nights: nights
            });
        } else {
            await whatsappService.sendMessage(phoneNumber, 'I could not understand the booking details. Please provide them in the *exact format* shown above.');
            // Stay in CONFIRM_BOOKING state with the same context to allow re-entry
        }
    } else {
        // This case should ideally not be reached if state management is strict
        await whatsappService.sendMessage(phoneNumber, 'Please confirm your booking or cancel.');
    }
}

/**
 * Handles the PAYMENT state: initiates M-Pesa payment or cancels booking.
 * NOTE: This function will be extended to handle other payment methods in the future.
 * TODO: Stripe, PayPal, etc.
 * @param {string} phoneNumber - The user's phone number.
 * @param {string} message - The user's reply ('confirm' or 'cancel').
 * @param {Object} context - The current conversation context, including booking details and total amount.
 */
async function handlePayment(phoneNumber, message, context) {
    if (message.toLowerCase() === 'confirm') {
        // Create a booking record in the database with 'pending' status
        const bookingId = await bookingModel.createBooking(phoneNumber, context);

        const paymentMessage = `💳 Payment Required:

                Amount: KSh ${context.totalAmount}
                Booking ID: ${bookingId}

                You will receive an M-Pesa STK push shortly. Please enter your M-Pesa PIN to complete the payment.

                The payment request is being sent to ${phoneNumber}...`;

        await whatsappService.sendMessage(phoneNumber, paymentMessage);

        // Initiate M-Pesa STK Push. The actual status update to 'paid' should happen
        // in a separate M-Pesa callback endpoint after payment confirmation.
        // For this example, initiateMpesaPayment simulates this callback.
        await mpesaService.initiateMpesaPayment(phoneNumber, context.totalAmount, bookingId);

        // Note: The conversation state will be updated to COMPLETED by mpesaService
        // after the simulated payment success.
    } else if (message.toLowerCase() === 'cancel') {
        await whatsappService.sendMessage(phoneNumber, 'Booking cancelled. Feel free to start a new search anytime!');
        // Reset conversation to welcome state
        await handleWelcome(phoneNumber, 'start');
    } else {
        await whatsappService.sendMessage(phoneNumber, 'Please reply *CONFIRM* to proceed with payment or *CANCEL* to cancel booking.');
    }
}

module.exports = {
    processMessage,
    handleWelcome,
    handleBrowseHotels,
    handleSelectHotel,  
    handleSelectDates,
    handleConfirmBooking,   
    handlePayment
};
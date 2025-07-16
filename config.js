const config = {
    WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN,
    WEBHOOK_VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN,
    PHONE_NUMBER_ID: process.env.PHONE_NUMBER_ID,
    WHATSAPP_API_URL: `https://graph.facebook.com/v17.0/${process.env.PHONE_NUMBER_ID}/messages`,
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_USER: process.env.DB_USER || 'root',
    DB_PASS: process.env.DB_PASS || '',
    DB_NAME: process.env.DB_NAME || 'hotel_booking'
};

export default config;
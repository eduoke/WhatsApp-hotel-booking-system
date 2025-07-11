# About
A WhatsApp business tool for hotel reservations. This project combines messaging automation, payment processing, and booking management.

# WhatsApp Hotel Booking System - User Experience Flow

## Complete Customer Journey

### 1. **Initial Contact** 
**Customer:** Messages hotel WhatsApp Business number  
**Bot Response:**
```
🏨 Welcome to Hotel Booking Bot!

I can help you find and book hotels in Kenya. 

Please choose an option:
1. 📍 Browse hotels by location
2. 🔍 Search hotels by name  
3. 💬 Speak to customer service

Reply with the number of your choice.
```

### 2. **Location Selection**
**Customer:** Types "1"  
**Bot Response:**
```
📍 Select a location:

1. Nairobi
2. Mombasa  
3. Kisumu
4. Nakuru
5. Eldoret

Reply with the number or type your preferred location.
```

### 3. **Hotel Browsing** 
**Customer:** Types "1" (for Nairobi)  
**Bot Response:**
```
🏨 Hotels in Nairobi:

1. Sarova Stanley Hotel
   📍 Nairobi CBD
   💰 KSh 15,000/night
   ⭐ WiFi, Restaurant, Gym, Pool, Conference Rooms, Parking

2. Villa Rosa Kempinski  
   📍 Nairobi Westlands
   💰 KSh 25,000/night
   ⭐ WiFi, Spa, Restaurant, Bar, Gym, Pool, Business Center

3. Serena Hotel Nairobi
   📍 Nairobi CBD  
   💰 KSh 18,000/night
   ⭐ WiFi, Restaurant, Bar, Gym, Pool, Spa, Conference Rooms

Reply with the hotel number to continue booking.
```

### 4. **Hotel Selection & Booking Details**
**Customer:** Types "2" (for Villa Rosa Kempinski)  
**Bot Response:**
```
🏨 You selected: Villa Rosa Kempinski
💰 Price: KSh 25,000/night

Please provide your booking details in this format:
Check-in date: DD/MM/YYYY
Check-out date: DD/MM/YYYY  
Number of guests: X

Example:
Check-in date: 15/08/2024
Check-out date: 17/08/2024
Number of guests: 2
```

### 5. **Booking Information Entry**
**Customer:** Types:
```
Check-in date: 20/07/2024
Check-out date: 22/07/2024
Number of guests: 2
```

**Bot Response:**
```
📋 Booking Summary:

🏨 Hotel: Villa Rosa Kempinski
📍 Location: Nairobi Westlands  
📅 Check-in: 20/07/2024
📅 Check-out: 22/07/2024
👥 Guests: 2
🌙 Nights: 2
💰 Total: KSh 50,000

Reply 'CONFIRM' to proceed to payment or 'CANCEL' to start over.
```

### 6. **Payment Initiation**
**Customer:** Types "CONFIRM"  
**Bot Response:**
```
💳 Payment Required:

Amount: KSh 50,000
Booking ID: HB202407200234

You will receive an M-Pesa STK push shortly. Please enter your M-Pesa PIN to complete the payment.

The payment request is being sent to +254712345678...
```

**Immediately followed by:**
```
💳 Payment request sent to your phone (+254712345678)

Amount: KSh 50,000
Please check your phone for the M-Pesa prompt and enter your PIN.

⏰ You have 60 seconds to complete the payment.
```

### 7. **M-Pesa Payment Process**
**Customer's Phone:** Receives STK Push notification:
```
M-PESA STK PUSH
Pay Ksh 50,000.00 to Hotel Booking
Enter M-PESA PIN:
[PIN Entry Screen]
```

**Customer:** Enters PIN and confirms payment

### 8. **Payment Confirmation** 
**Bot Response:** (After successful payment)
```
✅ Payment Successful!

🏨 Hotel: Villa Rosa Kempinski
📍 Location: Nairobi Westlands
📅 Check-in:

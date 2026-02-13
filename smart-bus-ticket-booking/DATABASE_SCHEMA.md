# Database Schema for TRAVELO

## Collections/Tables Needed:

### 1. Users
- id (primary key)
- name
- email (unique)
- phone
- password (hashed)
- role (passenger/company)
- createdAt
- updatedAt

### 2. BusCompanies
- id (primary key)
- name
- email
- phone
- userId (foreign key to Users)
- licenseNumber
- createdAt

### 3. Buses
- id (primary key)
- companyId (foreign key)
- busNumber
- busType (Luxury, Standard, VIP, etc.)
- totalSeats
- amenities (array: wifi, ac, charging)
- status (active/inactive)

### 4. Routes
- id (primary key)
- companyId (foreign key)
- busId (foreign key)
- from
- to
- departureTime
- arrivalTime
- duration
- price
- daysOfWeek (array)
- status (active/inactive)

### 5. Bookings
- id (primary key)
- userId (foreign key)
- routeId (foreign key)
- busId (foreign key)
- ticketId (unique)
- passengerName
- passengerPhone
- travelDate
- seats (array)
- totalPrice
- paymentMethod
- paymentStatus (pending/completed/failed)
- bookingStatus (confirmed/cancelled)
- qrCode
- createdAt

### 6. Notifications
- id (primary key)
- userId (foreign key)
- bookingId (foreign key)
- type (reminder/confirmation/cancellation)
- message
- sentAt
- status (sent/pending)

## Next Steps:
1. Choose database (Firebase/MongoDB/PostgreSQL)
2. Set up authentication
3. Create API routes
4. Implement booking system
5. Add notification service

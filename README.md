# Cal.com Clone

A full-stack, responsive calendaring and booking application inspired by Cal.com. This application allows users to manage their event types, set their weekly availability, block out specific dates, and provides a seamless public scheduling interface for invitees to book meetings.

## 🚀 Features Implemented

### 1. **Event Types Management**
- Create, modify, and delete different meeting templates (e.g., 15-min chat, 30-min discovery call).
- Configure event duration, URL slugs, and theme colors.
- Define custom buffer times before and after events to prevent back-to-back meeting fatigue.
- Add custom questions to the booking form to gather required participant information.
- Toggle event types active/inactive.

### 2. **Availability & Schedule Control**
- **Weekly Schedule**: Set recurring open hours for each day of the week (Monday - Sunday).
- **Date Overrides**: Add exceptions to your regular schedule (e.g., mark a specific date as unavailable for vacation, or set custom hours for a one-off day).
- **Timezone Support**: Manage events and schedules accurately according to your local timezone.

### 3. **Public Booking Interface**
- Dedicated booking pages generated automatically via the event's URL slug.
- Real-time slot calculation based on your defined availability, date overrides, booked slots, and buffer times.
- Interactive calendar selection for invitees to choose the best date and time.
- Integrated forms to collect the invitee's name, email, and responses to custom questions.

### 4. **Bookings Dashboard**
- View and manage upcoming or past appointments in a centralized dashboard.
- Display detailed booking information, including custom responses and notes from the booker.

### 5. **User Settings**
- Manage global application settings.
- Configure primary timezone, user name, and email address.

---

## 💻 Tech Stack

- **Framework**: [Next.js (App Router)](https://nextjs.org/) - React framework for server-rendered UI and API routes.
- **Language**: TypeScript - For maintainable and type-safe code.
- **Database**: [Neon](https://neon.tech/) - Serverless Postgres database.
- **Styling**: Tailwind CSS - Utility-first CSS framework for rapid UI styling.
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) - Reusable accessible components built with Radix UI (`class-variance-authority`, `tailwind-merge`).
- **Icons**: Lucide React - Clean and consistent icon library.
- **Forms & Validation**: React Hook Form natively integrated with Zod for robust schema validation.
- **State Management & Data Fetching**: SWR - React Hooks for data fetching.
- **Date Handling**: `date-fns` and `react-day-picker` for calendar interactions and time formatting.
- **Notifications**: Sonner for elegant toast notifications.

---

## 🗄️ Database Design

The application uses a relational PostgreSQL database to handle scheduling logic. Below is the complete schema design and relationship breakdown.

### Entity-Relationship Diagram
- `event_types` (1) ─── (Many) `bookings`

### Complete Schema

1. **`event_types`**
Stores the configuration for different meeting templates.
- **`id`**: `SERIAL PRIMARY KEY`
- **`title`**: `VARCHAR(255)` - E.g., "30 Min Meeting"
- **`description`**: `TEXT` - Info shown to the user
- **`duration`**: `INTEGER` - Duration in minutes (Default: 30)
- **`slug`**: `VARCHAR(255)` - Unique URL identifier
- **`color`**: `VARCHAR(7)` - Theme color hex code
- **`buffer_before`**: `INTEGER` - Buffer minutes before the event
- **`buffer_after`**: `INTEGER` - Buffer minutes after the event
- **`custom_questions`**: `JSONB` - Array of custom form questions
- **`is_active`**: `BOOLEAN` - Active state toggle (Default: true)

2. **`availability`**
Stores the weekly recurring work schedule.
- **`id`**: `SERIAL PRIMARY KEY`
- **`day_of_week`**: `INTEGER` - Represents Mon-Sun (0-6). Has a `UNIQUE` constraint to prevent duplicate day definitions.
- **`start_time`**: `TIME` - When availability begins.
- **`end_time`**: `TIME` - When availability ends.
- **`is_available`**: `BOOLEAN` - Toggle to mark the day completely unavailable.

3. **`date_overrides`**
Used to handle exceptions to the base `availability` (vacations, holidays).
- **`id`**: `SERIAL PRIMARY KEY`
- **`override_date`**: `DATE UNIQUE` - The specific date modified.
- **`is_available`**: `BOOLEAN` - `false` entirely blocks the day, `true` permits custom hours.
- **`start_time`**: `TIME` - Custom start time if available.
- **`end_time`**: `TIME` - Custom end time if available.

4. **`settings`**
Global preferences for the single-user system.
- **`id`**: `SERIAL PRIMARY KEY`
- **`timezone`**: `VARCHAR(100)` - Base timezone (e.g. 'UTC', 'America/New_York')
- **`user_name`**: `VARCHAR(255)`
- **`user_email`**: `VARCHAR(255)`

5. **`bookings`**
Stores the actual scheduled appointments.
- **`id`**: `SERIAL PRIMARY KEY`
- **`event_type_id`**: `INTEGER` - `FOREIGN KEY` mapped to `event_types.id` (`ON DELETE CASCADE`).
- **`booker_name`**: `VARCHAR(255)`
- **`booker_email`**: `VARCHAR(255)`
- **`start_time`**: `TIMESTAMP` - The exact start time of the booking.
- **`end_time`**: `TIMESTAMP` - The exact end time of the booking (computed using duration).
- **`status`**: `VARCHAR(50)` - e.g., 'confirmed' or 'cancelled'.
- **`notes`**: `TEXT` - Additional context left by the booker.
- **`custom_responses`**: `JSONB` - User answers to custom questions defined in the `event_types`. 

> **Indexes:** Created on `bookings.start_time`, `bookings.event_type_id`, `event_types.slug`, and `date_overrides.override_date` for rapid query performance during open-slot calculations.

---

## 🛠️ Setup Instructions

Follow these instructions to get the project running in your local development environment.

### Prerequisites
- Node.js `v20.6.0` or higher (required for native `.env` loading).
- PostgreSQL database (You can easily provision one for free on [Neon](https://neon.tech/)).

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd cal-clone-main
```

### 2. Install Dependencies
The project uses `pnpm` as its package manager (inferred from `pnpm-lock.yaml`).
```bash
# If you don't have pnpm installed globally
npm install -g pnpm

pnpm install
```

### 3. Environment Setup
Create a `.env` file in the root directory and add your PostgreSQL database URL. 
```env
DATABASE_URL="postgresql://user:password@hostname/database"
```

### 4. Database Initialization
Run the database setup script to apply the database schema (and optional seed data). Because the setup script relies on environment variables, use the `--env-file` flag:
```bash
node --env-file=.env scripts/setup-db.js
```
*(This script will create all necessary tables and relationships within your Neon/Postgres database).*

### 5. Start the Development Server
```bash
pnpm dev
# or using npm
npm run dev
```

### 6. View the App
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. You can now begin configuring your event types and availability!

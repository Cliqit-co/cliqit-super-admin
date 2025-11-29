# Cliqit Super Admin Panel

A comprehensive Next.js 15 admin panel for managing the Cliqit influencer marketing platform. This internal tool prioritizes functionality, robustness, and efficiency over aesthetics.

## Features

### 🎯 Core Functionality
- **Influencer Vetting System**: Registration queue, vetting criteria management, approval/rejection workflow
- **User Management**: View all users, analytics, account status controls, role management
- **Application Oversight**: Monitor gig applications, track RSVPs, quality control, fraud detection
- **Platform Analytics**: User trends, success rates, health metrics, revenue analytics
- **Content Moderation**: Quality review, brand compliance, copyright detection
- **System Administration**: Database management, API monitoring, configuration

### 🛠 Tech Stack
- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS with Radix UI components
- **Forms**: React Hook Form + Zod validation
- **Database**: Nhost (GraphQL + PostgreSQL)
- **Notifications**: Firebase Admin SDK
- **Icons**: Lucide React
- **Charts**: Recharts

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database
- Nhost account
- Firebase project

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd cliqit-super-admin
   npm install
   ```

2. **Environment Setup**
   Create a `.env.local` file with the following variables:
   ```env
   # Nhost Configuration
   NEXT_PUBLIC_NHOST_SUBDOMAIN=your-subdomain
   NEXT_PUBLIC_NHOST_REGION=us-east-1
   NHOST_ADMIN_SECRET=your-admin-secret

   # Firebase Configuration
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-client-email
   FIREBASE_PRIVATE_KEY=your-private-key

   # Database Configuration
   DATABASE_URL=your-database-url
   ```

3. **Database Setup**
   - Set up your Nhost project
   - Configure PostgreSQL database
   - Run database migrations (if any)

4. **Firebase Setup**
   - Create a Firebase project
   - Generate service account credentials
   - Configure FCM for notifications
   - Set up the following environment variables:
     ```env
     FIREBASE_PROJECT_ID=your-project-id
     FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
     FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
     ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/
│   ├── dashboard/
│   │   ├── influencers/
│   │   │   ├── vetting/
│   │   │   ├── management/
│   │   │   └── analytics/
│   │   ├── applications/
│   │   ├── users/
│   │   ├── analytics/
│   │   ├── content/
│   │   └── system/
│   ├── api/
│   └── layout.tsx
├── components/
│   ├── dashboard/
│   ├── forms/
│   ├── tables/
│   ├── charts/
│   └── ui/
├── lib/
│   ├── nhost.ts
│   ├── notification-service.ts
│   ├── analytics.ts
│   └── utils.ts
└── types/
    ├── user.ts
    ├── application.ts
    └── analytics.ts
```

## Key Components

### Reusable UI Components
- **DataTable**: Advanced table with sorting, filtering, pagination
- **AnalyticsCard**: Standardized metric display cards
- **StatusBadge**: Consistent status indicators
- **ActionButtons**: Reusable action button groups
- **FilterPanel**: Advanced filtering interface

### Dashboard Pages
- **Main Dashboard**: Overview metrics and quick actions
- **Influencer Vetting**: Review and approve influencer applications
- **User Management**: Manage all platform users
- **Analytics**: Comprehensive platform insights
- **Applications**: Monitor and manage gig applications
- **Content Moderation**: Review and moderate content
- **System Admin**: Database and system management

## Database Schema

The application expects the following main entities:

### Users
- Basic user information
- Role-based access control
- Status management

### Influencers
- Extended user profile for influencers

## 🔔 Notification System

The application includes a comprehensive push notification system for user approval notifications.

### Features
- **User Approval Notifications**: Automatic notifications when influencers are approved/rejected
- **FCM Token Management**: Secure storage and retrieval of user FCM tokens
- **Notification History**: Complete audit trail of all sent notifications
- **Admin Testing Interface**: Tools for testing notifications and checking user token status
- **Error Handling**: Comprehensive error handling with detailed logging

### Database Schema
```sql
-- FCM Tokens Table
CREATE TABLE fcm_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  fcm_token TEXT NOT NULL,
  platform TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification History Table
CREATE TABLE notification_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN NOT NULL,
  error_message TEXT
);
```

### Usage
1. **Automatic Notifications**: Notifications are automatically sent when users are approved/rejected in the influencer vetting page
2. **Testing**: Use the Notifications page (`/dashboard/notifications`) to test notifications and check user FCM token status
3. **Monitoring**: All notifications are logged in the database for audit purposes

### Configuration
The notification system requires Firebase Admin SDK credentials. If not configured, the system will use mock notifications for development.
- Social media profiles
- Vetting status and scores
- Verification status

### Applications
- Gig applications
- Status tracking
- Review notes and attachments

### Analytics
- Platform metrics
- User behavior data
- Performance indicators

## API Integration

### Nhost GraphQL
- User management queries
- Influencer vetting operations
- Application status updates
- Analytics data retrieval

### Firebase Admin SDK
- Push notifications
- User messaging
- System alerts

## Security Features

- Role-based access control
- Input validation and sanitization
- Secure API endpoints
- Authentication middleware
- Audit logging

## Performance Optimizations

- React.memo for component optimization
- useMemo for expensive calculations
- Proper caching strategies
- Optimized bundle size
- Loading states and skeletons

## Development Guidelines

### Code Style
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Component composition over inheritance

### Testing
- Unit tests for utilities
- Integration tests for API calls
- E2E tests for critical workflows

### Deployment
- Vercel deployment ready
- Environment variable configuration
- Database migration scripts
- Monitoring and logging setup

## Contributing

1. Follow the established code style
2. Write comprehensive tests
3. Update documentation
4. Submit pull requests for review

## License

Internal use only - Cliqit Platform
# Echno - Web Interface

<div align="center">
  <img src="public/echno.png" alt="Echno Logo" width="120" height="120">
  
  <h3>A Complete Construction Management Solution</h3>
  <p>An Open Source modern web interface built with Next.js 16</p>

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?style=for-the-badge&logo=springboot)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Keycloak](https://img.shields.io/badge/Keycloak-OIDC-000000?style=for-the-badge&logo=keycloak)](https://www.keycloak.org/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-Components-18181b?style=for-the-badge)](https://ui.shadcn.com/)

</div>

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Development](#development)
- [Deployment](#deployment)
- [API Integration](#api-integration)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 About

The Echno Attendance web interface is built with **Next.js 16**, providing a modern, responsive, and performant web application for attendance management. This web app complements the Flutter mobile application, offering a seamless cross-platform experience for administrators and employees.

### Key Highlights

- ⚡ **Next.js 16** with App Router for optimal performance
- 🎨 **shadcn/ui** for polished, accessible component primitives
- 🔐 **Keycloak OpenID Connect** for centralized authentication
- 🧠 **Spring Boot REST API** powering business logic
- � **PostgreSQL** for transactional data persistence
- 🌐 **Server-Side Rendering (SSR)** and static prefetch for SEO
- 📱 **Progressive Web App (PWA)** capabilities
- 🚀 **Optimized Bundle Size** with automatic code splitting

---

## ✨ Features

### 🔐 Authentication & Authorization

- Secure login via Keycloak OpenID Connect flows
- Role-based access control (Admin, Manager, Employee, etc.) mapped from Keycloak roles
- Short-lived access tokens with refresh token rotation
- Self-service account management through Keycloak console

### 👥 Organization Management

- Create and manage multiple organizations
- Organization profile with logo upload
- Employee invitation system with secure codes
- Department and designation management

### 📅 Attendance Tracking

- Real-time attendance submissions via Spring Boot REST endpoints
- GPS-based location verification with backend geofencing rules
- QR code-based check-in/check-out integrated with the API
- Attendance history, exports, and anomaly detection
- Calendar view with aggregated status indicators

### 📊 Analytics & Reporting

- Comprehensive attendance analytics sourced from PostgreSQL views
- Export reports (PDF, CSV, Excel)
- Visual dashboards with charts
- Custom date range reports
- Employee productivity metrics

### 🏢 Employee Management

- Employee profiles and details
- Department-wise employee listing
- Reporting hierarchy visualization
- Shift timing management
- Salary information (admin only)

### 📋 Leave Management

- Leave application and approval workflow
- Leave balance tracking
- Leave history and calendar
- Multiple leave types support

### 📦 Additional Modules

- Project management integration
- Task assignment and tracking
- Inventory management
- Compliance and audit logs

---

## 🛠 Tech Stack

### Core Framework

- **Next.js 16** - React framework with App Router
- **React 19** - UI library with Server Components
- **TypeScript 5.0+** - Type-safe development

### Backend & Database

- **Spring Boot 3.x** - REST API and business services
- **PostgreSQL 16** - Relational database
- **Flyway** or **Liquibase** - Database migrations
- **Keycloak** - OpenID Connect identity provider

### State Management

- **React Context API** - Global state management
- **Zustand** or **Redux Toolkit** - Complex state management
- **TanStack Query (React Query)** - Server state management

### UI & Styling

- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Re-usable component library
- **Framer Motion** - Animation library
- **Lucide Icons** - Icon set

### Form Handling & Validation

- **React Hook Form** - Performant form library
- **Zod** - TypeScript-first schema validation

### Data Visualization

- **Recharts** or **Chart.js** - Chart libraries
- **FullCalendar** - Calendar component

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Jest** & **React Testing Library** - Testing

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.17.0 or higher)
- **npm** (v9.0.0 or higher) or **yarn** (v1.22.0 or higher) or **pnpm** (v8.0.0 or higher)
- **Git** (v2.30.0 or higher)

### System Requirements

| Component | Minimum | Recommended |
| --------- | ------- | ----------- |
| Node.js   | v18.17  | v20.x LTS   |
| RAM       | 4 GB    | 8 GB        |
| Storage   | 500 MB  | 1 GB        |

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/tornotron/echno-web
cd echno-web
```

### 2. Install Dependencies

Choose your preferred package manager:

```bash
# Using npm
npm install

# Using yarn
yarn install

# Using pnpm
pnpm install
```

### 3. Environment Setup

Create a `.env.local` file in the web directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your environment configuration:

```env
# Backend REST API
NEXT_PUBLIC_API_URL=https://api.echno.com
NEXT_PUBLIC_API_VERSION=v1

# Keycloak OpenID Connect
KEYCLOAK_CLIENT_ID=your-client-id
KEYCLOAK_ISSUER=https://your-keycloak-domain/realms/your-realm

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Feature Flags
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_ENABLE_PWA=true

# Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

### Keycloak Configuration

To set up authentication with Keycloak using PKCE:

1. **Install and Start Keycloak**: Follow the [Keycloak documentation](https://www.keycloak.org/getting-started/getting-started-docker) to run Keycloak locally or use a hosted instance.

2. **Create a Realm**: Create a new realm (e.g., `echno-realm`) in Keycloak admin console.

3. **Create a Client**:
   - Client ID: `echno-web-client` (or your preferred name)
   - Client Type: `OpenID Connect`
   - Access Type: `public` (no client secret required for PKCE)
   - Valid Redirect URIs: `http://localhost:3000/api/auth/callback/keycloak`
   - Web Origins: `http://localhost:3000`
   - Enable PKCE: `S256` (should be enabled by default)

4. **PKCE Flow**: NextAuth automatically handles PKCE (Proof Key for Code Exchange) for enhanced security in public clients.

5. **Update Environment Variables**: Replace the placeholder values in `.env.local` with your actual Keycloak configuration:
   - `KEYCLOAK_ISSUER`: Your Keycloak issuer URL (e.g., `http://localhost:8080/realms/your-realm`)
   - `KEYCLOAK_CLIENT_ID`: Your client ID

6. **Create Users**: Add users in Keycloak and assign appropriate roles for role-based access control.

### 4. Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Start Backend Services

- Launch the Spring Boot API (see [echno-api](https://github.com/tornotron/echno-api))
- Ensure PostgreSQL is running with the required schemas and credentials
- Start the Keycloak server with the `echno-realm` configuration

---

## 📁 Project Structure

```
web/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Authentication routes
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── (dashboard)/             # Protected dashboard routes
│   │   ├── organizations/
│   │   ├── attendance/
│   │   ├── employees/
│   │   ├── leaves/
│   │   ├── reports/
│   │   └── layout.tsx
│   ├── api/                     # API routes / server actions
│   │   ├── auth/
│   │   ├── organizations/
│   │   └── attendance/
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   ├── layouts/                 # Layout components
│   ├── forms/                   # Form components
│   ├── charts/                  # Chart components
│   └── shared/                  # Shared components
├── lib/                         # Utility libraries
│   ├── api/                     # API clients (REST)
│   ├── auth/                    # Keycloak helpers
│   ├── utils/                   # Utility functions
│   ├── hooks/                   # Custom React hooks
│   └── validations/             # Zod schemas
├── types/                       # TypeScript type definitions
├── stores/                      # State management stores
├── constants/                   # Constants and enums
├── public/                      # Static assets
│   ├── icons/
│   ├── images/
│   └── favicon.png
├── styles/                      # Additional styles
├── tests/                       # Test files
├── .env.local                   # Environment variables (local)
├── .env.example                 # Environment variables template
├── next.config.js               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Dependencies
└── README.md                    # This file
```

---

## ⚙️ Configuration

### Next.js Configuration

The `next.config.js` file contains important configurations:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['cdn.echno.com', 'assets.echno.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.echno.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  // PWA Configuration
  // Add next-pwa if needed
};

module.exports = nextConfig;
```

### API Client Configuration

REST calls to the Spring Boot backend are centralized in `lib/api/client.ts`:

```typescript
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use(async (config) => {
  // Inject access token from Keycloak session storage
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('kc-token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
```

Keycloak tokens are managed in `lib/auth/keycloak.ts`, which wraps the official JavaScript adapter and exposes helpers for client-side and server-side session validation.

---

## 💻 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check
```

### Code Style

This project follows:

- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** strict mode
- **Airbnb** style guide (modified)

### Git Workflow

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature"

# Push to remote
git push origin feature/your-feature-name

# Create a Pull Request on GitHub
```

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Configure environment variables
4. Deploy automatically on every push

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

### Docker

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

Build and run:

```bash
docker build -t echno-web .
docker run -p 3000:3000 echno-web
```

### Other Platforms

- **Netlify**: Connect repository and deploy
- **AWS Amplify**: Follow AWS Amplify hosting guide
- **Google Cloud Run**: Build container and deploy
- **Azure Static Web Apps**: Connect GitHub repository

---

## 🔌 API Integration

### REST API Endpoints

The web app communicates with backend services:

```typescript
// lib/api/organizations.ts
export const organizationApi = {
  // Get all organizations for a user
  getOrganizations: async (userId: number) => {
    const response = await fetch(`${API_URL}/organizations/user/${userId}`);
    return response.json();
  },

  // Create organization
  createOrganization: async (data: CreateOrganizationDto) => {
    const response = await fetch(`${API_URL}/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Update organization
  updateOrganization: async (id: number, data: UpdateOrganizationDto) => {
    const response = await fetch(`${API_URL}/organizations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};
```

### Real-time Data Sync

The backend exposes server-sent events for live attendance updates:

```typescript
export const subscribeToAttendance = (
  organizationId: number,
  onMessage: (attendance: AttendanceEvent) => void
) => {
  const eventSource = new EventSource(
    `${process.env.NEXT_PUBLIC_API_URL}/attendance/stream?organizationId=${organizationId}`,
    { withCredentials: true }
  );

  eventSource.onmessage = (event) => {
    const payload = JSON.parse(event.data) as AttendanceEvent;
    onMessage(payload);
  };

  eventSource.onerror = () => {
    eventSource.close();
  };

  return () => eventSource.close();
};
```

---

## 🧪 Testing

### Unit Tests

```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage
```

Example test:

```typescript
import { render, screen } from '@testing-library/react';
import { OrganizationCard } from '@/components/organizations/organization-card';

describe('OrganizationCard', () => {
  it('renders organization name', () => {
    const org = {
      id: 1,
      organizationName: 'Test Org',
      organizationEmail: 'test@org.com',
    };

    render(<OrganizationCard organization={org} />);
    expect(screen.getByText('Test Org')).toBeInTheDocument();
  });
});
```

### E2E Tests

Consider using **Playwright** or **Cypress** for E2E testing:

```bash
npm install -D @playwright/test
npx playwright test
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](../CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Run tests and linting
6. Submit a pull request

### Code Review Process

1. All PRs require at least one approval
2. CI/CD checks must pass
3. Code coverage should not decrease
4. Follow the coding standards

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

## 📞 Contact & Support

- **Project Maintainer**: [@tornotron](https://github.com/tornotron)
- **Repository**: [echno-web](https://github.com/tornotron/echno-web)
- **Issues**: [GitHub Issues](https://github.com/tornotron/echno-web/issues)
- **Discussions**: [GitHub Discussions](https://github.com/tornotron/echno-web/discussions)

---

## 🙏 Acknowledgments

- [Next.js Team](https://nextjs.org) for the amazing framework
- [Vercel](https://vercel.com) for hosting and deployment platform
- [Spring Boot](https://spring.io/projects/spring-boot) for the backend framework
- [PostgreSQL](https://www.postgresql.org) for reliable data storage
- [Keycloak](https://www.keycloak.org) for identity and access management
- [shadcn/ui](https://ui.shadcn.com) for beautiful components
- [Tailwind CSS](https://tailwindcss.com) for utility-first CSS

---

<div align="center">
  <p>Made with ❤️ by the Echno Team</p>
  <p>
    <a href="#echno-attendance---web-interface">Back to Top ↑</a>
  </p>
</div>

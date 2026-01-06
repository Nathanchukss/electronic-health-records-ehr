# MedRecord - Healthcare Patient Management System

A secure, full-stack healthcare patient management system built for medical staff to manage patient records, track medical history, and maintain comprehensive audit logs.

## 🌐 Live Website

Visit the live portfolio: [View Portfolio](https://medrecord-ehr.lovable.app)

## Overview

MedRecord is designed for healthcare facilities to streamline patient data management with role-based access control, ensuring that sensitive medical information is only accessible to authorized personnel.

## Features

- **Patient Registry** - Create, view, edit, and search patient records with comprehensive demographic information
- **Medical Records Tracking** - Document diagnoses, treatments, medications, and provider notes
- **Role-Based Access Control** - Three distinct roles (Admin, Doctor, Nurse) with appropriate permissions
- **Audit Logging** - Complete activity tracking for compliance and security (admin-only access)
- **Staff Management** - Manage healthcare staff accounts and role assignments
- **Secure Authentication** - Email/password authentication with automatic email confirmation

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe development
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Accessible component library
- **React Router** - Client-side routing
- **TanStack Query** - Server state management
- **React Hook Form + Zod** - Form handling and validation
- **Lucide React** - Icon library

### Backend (Lovable Cloud / Supabase)
- **PostgreSQL** - Relational database
- **Row-Level Security (RLS)** - Fine-grained data access control
- **Supabase Auth** - Authentication and user management
- **Edge Functions** - Serverless backend logic

## Database Schema

| Table | Description |
|-------|-------------|
| `profiles` | Staff user profiles linked to auth users |
| `user_roles` | Role assignments (admin, doctor, nurse) |
| `patients` | Patient demographics and contact information |
| `medical_records` | Patient medical history and clinical notes |
| `audit_logs` | System activity tracking for compliance |

## User Roles & Permissions

| Action | Admin | Doctor | Nurse |
|--------|-------|--------|-------|
| View Patients | ✓ | ✓ | ✓ |
| Create Patients | ✓ | ✓ | ✓ |
| Update Patients | ✓ | ✓ | ✓ |
| Delete Patients | ✓ | ✗ | ✗ |
| View Medical Records | ✓ | ✓ | ✓ |
| Create Medical Records | ✓ | ✓ | ✓ |
| Update Medical Records | ✓ | ✓ | ✗ |
| Delete Medical Records | ✓ | ✗ | ✗ |
| View Audit Logs | ✓ | ✗ | ✗ |
| Manage Staff | ✓ | ✗ | ✗ |

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Local Development

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## Security

- All database tables are protected with Row-Level Security (RLS) policies
- Authentication required for all data access
- Audit logging tracks all significant user actions
- Role-based permissions enforced at database level

## Sample Accounts

**Admin Account**  
Full name: Admin Guest  
Email: adminguest@emory.com  
Password: Adminguest1

**Doctor Account**  
Full name: Doctor Guest  
Email: doctorguest@emory.com  
Password: Doctorguest1

**Nurse Account**  
Full name: Nurse Guest  
Email: nurseguest@emory.com  
Password: Nurseguest1


## 📄 License

MIT License - feel free to use and modify for your own projects.

---

**Built with Lovable by Nathan Nwaokocha**

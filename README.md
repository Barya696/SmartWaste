<h1 align="center">Hi 👋, I'm Baria Gaougue</h1>
<h3 align="center">A passionate full-stack developer from Chad-Rwanda</h3>

- 🔭 I’m currently working on **[SmartWaste — EcoBrazza Waste Management System](https://github.com/Barya696/SmartWaste)**

- Description: **SmartWaste is a full-stack web application designed to digitize and streamline municipal waste management operations in Brazzaville, Republic of the Congo. The platform connects citizens, waste collectors, waste-collection supervisors, recycling supervisors, and administrators through a centralized system for waste reporting, task assignment, collection tracking, partner recycling, compensation, and institutional oversight. Citizens can submit geo-tagged waste reports with photos and track status from pending to compensated; collectors receive and complete assigned collection tasks; waste supervisors manage collector workloads and assign reports; recycling supervisors handle partner assignment, material breakdown, compensation configuration, and downloadable receipts; and administrators monitor users, districts, analytics, and system security. The system features role-based dashboards, session-based authentication, real-time notifications per role, eco-points and badge configuration, tax/share/material pricing rules, audit-style security event logging, and district-level reporting. Built with Spring Boot, React with TypeScript, Vite, and PostgreSQL, SmartWaste improves operational efficiency, transparency, and accountability across the waste collection and recycling lifecycle.**

- 📫 How to reach me **baryaelimelec@gmail.com**

---

## 🌍 SmartWaste Overview

SmartWaste (EcoBrazza) replaces fragmented, manual waste-handling workflows with a unified digital platform for Brazzaville’s districts.

### 👥 User Roles

| Role | Key capabilities |
|------|------------------|
| **Citizen** | Report waste, track reports, resubmit stale reports, view compensation & eco-points |
| **Collector** | View assigned tasks, complete collections, track recycling credits |
| **Waste Supervisor** | Dashboard stats, assign collectors, manage collector roster |
| **Recycling Supervisor** | Assign recycling partners, compensate citizens/collectors, receipt preview & downloads |
| **Administrator** | User management, reports, districts, analytics, system settings, security alerts |

### 🔔 Notifications (by role)

- **Citizen:** Assigned · Recycled · Compensated
- **Collector:** Assigned task · Compensated
- **Waste Supervisor:** Submitted waste report · Resubmission
- **Recycling Supervisor:** Collected waste waiting for recycling
- **Admin:** Failed login · Failed signup · Server errors · Security alerts

### 🛠 Tech Stack

**Backend**
- Java 21 · Spring Boot · Spring Security · Spring Data JPA
- PostgreSQL · Spring Mail

**Frontend**
- React · TypeScript · Vite
- React Router · Tailwind CSS · Radix UI · Lucide Icons · Recharts

---

## 📁 Project Structure

```
SmartWaste/
├── backend/          # Spring Boot REST API (port 8080)
│   └── src/main/java/com/smartWaste/project/
│       ├── controller/
│       ├── service/
│       ├── model/
│       └── config/
└── frontend/         # React + Vite SPA (port 5173)
    └── src/
        ├── app/      # Pages, layouts, routes, context
        └── services/ # API clients
```

---

## 🚀 Getting Started

### Prerequisites

- Java 21+
- Node.js 18+
- PostgreSQL 14+
- Maven

### 1. Database

Create a PostgreSQL database:

```sql
CREATE DATABASE smartwaste;
```

Update credentials in `backend/src/main/resources/application.properties` if needed.

### 2. Backend

```bash
cd backend
mvn clean spring-boot:run
```

API runs at **http://localhost:8080**

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at **http://localhost:5173**

---

## 🔌 Main API Modules

| Module | Endpoint prefix | Purpose |
|--------|-----------------|---------|
| Auth | `/api/auth` | Login, signup, password reset |
| Users | `/api/users` | User CRUD & profiles |
| Reports | `/api/reports` | Waste report lifecycle |
| Assignments | `/api/assignments` | Collector task assignment |
| Partners | `/api/partners` | Recycling partner management |
| Assign Partner | `/api/assign-partner` | Link collected waste to partners |
| Compensations | `/api/compensations` | Financial compensation |
| Receipts | `/api/receipts` | Downloaded receipt history |
| Notifications | `/api/notifications` | Role-based notifications |
| Config | `/api/material-prices`, `/api/tax-config`, `/api/share-config` | Pricing & rules |

---

## 📍 Brazzaville Districts Supported

Poto-Poto · Moungali · Bacongo · Makélékélé · Plateau des 15 Ans · Ouenzé · Mfilou · Talangaï

---

<h3 align="left">Connect with me:</h3>
<p align="left">
<a href="https://www.topcoder.com/members/0000" target="blank"><img align="center" src="https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/topcoder.svg" alt="0000" height="30" width="40" /></a>
</p>

<h3 align="left">Languages and Tools:</h3>
<p align="left">
<a href="https://www.figma.com/" target="_blank" rel="noreferrer"> <img src="https://www.vectorlogo.zone/logos/figma/figma-icon.svg" alt="figma" width="40" height="40"/> </a>
<a href="https://www.java.com" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/java/java-original.svg" alt="java" width="40" height="40"/> </a>
<a href="https://www.postgresql.org" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/postgresql/postgresql-original-wordmark.svg" alt="postgresql" width="40" height="40"/> </a>
<a href="https://reactjs.org/" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original-wordmark.svg" alt="react" width="40" height="40"/> </a>
<a href="https://spring.io/" target="_blank" rel="noreferrer"> <img src="https://www.vectorlogo.zone/logos/springio/springio-icon.svg" alt="spring" width="40" height="40"/> </a>
<a href="https://www.typescriptlang.org/" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/typescript/typescript-original.svg" alt="typescript" width="40" height="40"/> </a>
<a href="https://vitejs.dev/" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/vitejs/vitejs-original.svg" alt="vite" width="40" height="40"/> </a>
</p>

---

<p align="center">Built with 💚 for cleaner cities — Brazzaville, Republic of the Congo</p>

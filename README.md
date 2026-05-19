# EduPath Backend API

EduPath is an educational technology (EdTech) platform designed to help students discover their optimal career paths. The system analyzes a student's academic profile and learning behavior, integrating these metrics with an Artificial Intelligence (AI) prediction engine to generate accurate and personalized career recommendations.

This repository contains the core backend service (RESTful API) that acts as the primary data orchestrator between the client interface, the main relational database, and the external AI prediction server.

## Tech Stack

The system is built using a modern, efficient, and enterprise-grade architecture to ensure high responsiveness and robust security:

- **Runtime:** Node.js
- **Framework:** Express.js
- **Relational Database:** PostgreSQL (stores user entities, assessments, and recommendation history, heavily optimized with indexing and `JSONB` data types)
- **In-Memory Cache:** Redis (implemented for lightning-fast retrieval of cached recommendations)
- **Authentication:** JSON Web Token (JWT)
- **AI Integration:** Axios (communicating with external ML FastAPI) & Groq API (powered by LLaMA 3.3 for intelligent narrative explanation generation)
- **Input Validation:** Zod (strict, centralized schema validation middleware)
- **Security:** Express-Rate-Limit (DDoS protection and AI quota management)

## Database Architecture (ERD)

The database structure is designed relationally to ensure data integrity without redundancy.

![EduPath ERD Design](docs/assets/erd-edupath-v2.svg)

_(Note: The diagram above is exported directly from our DBML design schema)._

## Core API Modules

This backend system is divided into 5 main API modules:

1. **Authentication Module:** User registration and secure login.
2. **User Profile Module:** Identity and student school data management.
3. **Assessment Module:** Recording academic scores (Math, Physics, etc.) and behavioral metrics (self-study hours, absence days) with strict payload validation via Zod.
4. **Recommendation Module (AI Integration):** A proxy that securely sends assessment data to the ML server, utilizes Groq API for analytical reasoning, prevents duplicate processing, and caches the final results using Redis. Protected by strict rate limiters.
5. **Master Data Module:** Static reference catalog for career paths and majors.

**Full Technical Specifications:**

- Detailed API request/response contracts can be found in the [`API-CONTRACT.md`](API-CONTRACT.md) file.

## Local Installation Guide

To run the development server on your local machine, follow these steps:

1. **Clone the Repository**
   ```bash
   git clone https://github.com/gdekapw17/edupath-backend.git
   cd EduPath-Backend
   ```
1. **Install Dependencies**
   ```bash
   npm install
   ```
1. **Environment Configuration**

   Copy the sample configuration file and adjust the values with your PostgreSQL credentials, JWT secret, Redis URL, and Groq API Key.

   ```bash
   cp .env.example .env
   ```

1. **Run the Server**
   ```bash
   npm run dev
   ```
   The server will run on http://localhost:3000/api/v1.

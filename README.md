# BE-SurveyApp

Backend for **SurveyApp** (Node.js + TypeScript + PostgreSQL + i18n).  
This project implements APIs for surveys, questions, invitations, and email/response tracking.

---

## 🏗️ Technologies

- Node.js 20+  
- TypeScript  
- PostgreSQL  
- pg (node-postgres)  
- @prisma/adapter-pg
- dotenv for environment variables  
- Jest for testing  
- i18next for localization  
- nodemon + ts-node for development

---

## 📁 Project Structure


BE-SurveyApp/
├─ src/
│ ├─ controllers/ # API logic
│ ├─ routes/ # API endpoints
│ ├─ services/ # Business logic / DB queries
│ ├─ db/
│ │ └─ client.ts # PostgreSQL connection
│ └─ index.ts # Entry point
├─ locales/ # i18n translation files
├─ tests/ # Jest tests
├─ .env.example # Example environment variables
├─ tsconfig.json
├─ package.json
└─ .gitignore


---

## ⚡ Installation & Local Setup

1. Clone the repository:

git clone https://github.com/BolteAdrian/BE-SurveyApp.git
cd BE-SurveyApp

2. Install dependencies:

npm install

3. Configure .env:

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=surveyapp
PORT=3000
NODE_ENV=development

4. Setup the database (create DB, run migrations, generate Prisma client, seed data):

npm run db:setup

> This command will:
> - create the database if it does not exist  
> - run Prisma migrations  
> - generate the Prisma client  
> - seed the database with demo data  

5. Start the backend in development mode:

npm run dev

6. For production build + start:

npm run build
npm run start

## 🏃‍♂️ Available Scripts
Script	Description
npm run dev	Start the backend in development mode (hot reload with nodemon + ts-node)
npm run build	Compile TypeScript to JavaScript (output in dist/)
npm run start	Run the compiled production server (dist/index.js)
npm run db:setup	Create database (if missing), run Prisma migrations, seed minimal data
npm run db:migrate	Apply pending Prisma migrations
npm run db:seed	Seed the database with minimal demo data
npm run test	Run Jest tests

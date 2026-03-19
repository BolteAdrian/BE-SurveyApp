# BE-SurveyApp

Backend for **SurveyApp** (Node.js + TypeScript + PostgreSQL + i18n).  
This project implements APIs for surveys, questions, invitations, and email/response tracking.

---

## 🏗️ Technologies

- Node.js 20+  
- TypeScript  
- PostgreSQL  
- pg (node-postgres)  
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

DATABASE_URL=postgresql://user:password@localhost:5432/surveyapp
PORT=3000
NODE_ENV=development

4. Start the backend in development mode:

npm run dev

5. For production build + start:

npm run build
npm run start

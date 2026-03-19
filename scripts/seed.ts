import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import config from "../src/config";

const pool = new Pool({
  connectionString: config.database.url,
});
const adapter = new PrismaPg(pool as any); // PrismaPg expects a pg.Pool, but types are not perfectly aligned, so we cast to any
const prisma = new PrismaClient({ adapter });
export default prisma;

async function main() {
  // -----------------------------
  // 1. Create a demo user / owner
  // -----------------------------
  const user = await prisma.user.create({
    data: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Demo Admin",
      email: "admin@example.com",
    },
  });

  // -----------------------------
  // 2. Create a demo survey
  // -----------------------------
  const survey = await prisma.survey.create({
    data: {
      title: "Demo Survey",
      description: "This is a demo survey for testing",
      slug: "demo-survey",
      status: "draft",
      ownerId: user.id,
      questions: {
        create: [
          {
            title: "What is your favorite color?",
            type: "choice",
            required: true,
            maxSelections: 2,
            order: 1,
            options: {
              create: [
                { label: "Red", order: 1 },
                { label: "Blue", order: 2 },
                { label: "Green", order: 3 },
              ],
            },
          },
          {
            title: "Any additional comments?",
            type: "text",
            required: false,
            maxLength: 500,
            order: 2,
          },
        ],
      },
    },
  });

  // -----------------------------
  // 3. Create email list with contacts
  // -----------------------------
  const emailList = await prisma.emailList.create({
    data: {
      ownerId: user.id,
      name: "Demo Contact List",
      emailContacts: {
        create: [
          { email: "alice@example.com", name: "Alice" },
          { email: "bob@example.com", name: "Bob" },
        ],
      },
    },
    include: { emailContacts: true }, // we need IDs for invitations
  });

  // -----------------------------
  // 4. Create invitations
  // -----------------------------
  for (const contact of emailList.emailContacts) {
    await prisma.invitation.create({
      data: {
        surveyId: survey.id,
        contactId: contact.id,
        tokenHash: `${contact.email}-token-demo`,
        sentAt: new Date(),
      },
    });
  }

  // -----------------------------
  // 5. Create responses and answers
  // -----------------------------
  const firstInvitation = await prisma.invitation.findFirst({
    where: { contactId: emailList.emailContacts[0].id },
  });

  if (firstInvitation) {
    const response = await prisma.response.create({
      data: {
        surveyId: survey.id,
        invitationId: firstInvitation.id,
        submittedAt: new Date(),
      },
    });

    // answers for choice question
    const choiceQuestion = await prisma.question.findFirst({
      where: { surveyId: survey.id, type: "choice" },
      include: { options: true },
    });

    if (choiceQuestion && choiceQuestion.options.length >= 2) {
      await prisma.answerChoice.createMany({
        data: [
          {
            responseId: response.id,
            questionId: choiceQuestion.id,
            optionId: choiceQuestion.options[0].id,
          },
          {
            responseId: response.id,
            questionId: choiceQuestion.id,
            optionId: choiceQuestion.options[1].id,
          },
        ],
      });
    }

    // answer for text question
    const textQuestion = await prisma.question.findFirst({
      where: { surveyId: survey.id, type: "text" },
    });

    if (textQuestion) {
      await prisma.answerText.create({
        data: {
          responseId: response.id,
          questionId: textQuestion.id,
          textValue: "This is a demo comment",
        },
      });
    }
  }

  console.log("Full seed completed!");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

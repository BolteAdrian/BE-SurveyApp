import i18next from "i18next";
import Backend from "i18next-fs-backend";
import middleware from "i18next-http-middleware";
import path from "path";

export async function initI18n(app: any) {
  await i18next
    .use(Backend)
    .use(middleware.LanguageDetector)
    .init({
      fallbackLng: "ro",
      backend: {
        loadPath: path.join(__dirname, "../locales/{{lng}}/translation.json")
      },
      detection: {
        order: ["querystring", "header"],
        caches: false
      }
    });

  app.use(middleware.handle(i18next));
}
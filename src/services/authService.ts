import prisma from "../db/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { IUser } from "../entities/IUser";
import config from "../config";
import { t } from "i18next";

const JWT_SECRET = config.jwtSecret;

export const authService = {
  /**
   * Register a new user
   * Hashes the password and stores the user in the database.
   * Returns the user object without the password.
   * @param name User's name
   * @param email User's email
   * @param password User's plaintext password
   * @returns User object without password
   */
  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<Omit<IUser, "password">> {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Remove password from returned object
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  /**
   * Login an existing user
   * Checks email and password, returns a JWT token if valid.
   * @param email User's email
   * @param password User's plaintext password
   * @returns JWT token string
   */
  async login(email: string, password: string): Promise<{ token: string; user: Omit<IUser, "password"> }> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw new Error(t("AUTH.INVALID_CREDENTIALS"));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error(t("AUTH.INVALID_CREDENTIALS"));
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "15h",
    });

    return { token, user };
  },
};

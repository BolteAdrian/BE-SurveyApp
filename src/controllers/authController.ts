import { Request, Response } from "express";
import { authService } from "../services/authService";

/**
 * Controller for authentication routes
 */
export const authController = {
  /**
   * Register a new user
   * @route POST /auth/register
   */
  async register(req: Request, res: Response) {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: req.t("AUTH.REGISTER_FAILED"),
      });
    }

    try {
      const user = await authService.register(name, email, password);
      res.status(201).json(user); // Created
    } catch (error: any) {
      console.error(error);
      res.status(403).json({
        message: req.t("AUTH.REGISTER_FAILED"),
      }); // Forbidden
    }
  },

  /**
   * Login an existing user
   * @route POST /auth/login
   */
  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: req.t("AUTH.LOGIN_FAILED"),
      });
    }

    try {
      const data = await authService.login(email, password);
      res.status(200).json({ data }); // OK
    } catch (error: any) {
      console.error(error);
      res.status(401).json({
        message: req.t("AUTH.LOGIN_FAILED"),
      }); // Unauthorized
    }
  },
};

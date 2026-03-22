import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config";

export const authenticate = (req:Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: req.t("AUTH.UNAUTHORIZED") });
  }

  const token = authHeader.split(" ")[1];

  try {
    jwt.verify(token, config.jwtSecret);
    next();
  } catch (err) {
    console.error("Auth failed:", err);
    return res.status(401).json({ error: req.t("AUTH.INVALID_CREDENTIALS") });
  }
};
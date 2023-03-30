import { Request, Response } from "express";

export const login = async (
  req: Request,
  res: Response,
  next: Function
): Promise<any> => {
  return res.status(200).json({ message: "Login successful" });
};

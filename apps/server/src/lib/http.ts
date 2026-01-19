import type { NextFunction, Request, Response } from "express";

export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function sendBadRequest(res: Response, message: string) {
  res.status(400).json({ error: message });
}

export function sendNotFound(res: Response, message: string) {
  res.status(404).json({ error: message });
}


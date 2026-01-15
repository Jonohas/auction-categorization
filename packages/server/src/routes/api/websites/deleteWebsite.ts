import type { Request, Response } from "express";
import { prisma } from "../../../lib/db";
import { sanitizeId } from "../../../lib/sanitization";

export const deleteWebsite = async (req: Request, res: Response) => {
  try {
    const { id } = req.body as { id?: string };

    // Sanitize input
    const sanitizedId = sanitizeId(id);

    if (!sanitizedId) {
      return res.status(400).json({ error: "Invalid website ID" });
    }

    const scraper = await prisma.scraper.findUnique({
      where: { id: sanitizedId },
    });

    if (!scraper) {
      return res.status(404).json({ error: "Website not found" });
    }

    await prisma.scraper.delete({
      where: { id: sanitizedId },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete website" });
  }
};

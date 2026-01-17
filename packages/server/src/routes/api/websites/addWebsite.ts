import type { Request, Response } from "express";
import { prisma } from "../../../lib/db";
import { sanitizeUrl } from "../../../lib/sanitization";
import { makeAbsoluteUrl } from "../../../scrapers";

export const addWebsite = async (req: Request, res: Response) => {
  try {
    const { url } = req.body as { url?: string };

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Validate URL
    const sanitizedUrl = sanitizeUrl(url);
    if (!sanitizedUrl) {
      return res.status(400).json({ error: "Invalid URL" });
    }

    // Check if website already exists
    const existing = await prisma.scraper.findUnique({
      where: { url: sanitizedUrl },
    });

    if (existing) {
      return res.status(400).json({ error: "Website already exists" });
    }

    // Generate a name from the URL
    const hostname = new URL(sanitizedUrl).hostname.replace("www.", "");
    const namePart = hostname.split(".")[0] ?? "";
    const name = namePart.charAt(0).toUpperCase() + namePart.slice(1);

    const scraper = await prisma.scraper.create({
      data: {
        url: sanitizedUrl,
        name: `${name} Auctions`,
        imageUrl: makeAbsoluteUrl(sanitizedUrl, "/favicon.ico"),
        enabled: true,
      },
    });

    res.json({ success: true, scraper });
  } catch (error) {
    res.status(500).json({ error: "Failed to add website" });
  }
};

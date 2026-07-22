import prisma from "../prisma/client";

/**
 * Generate a URL-friendly slug from a title.
 * Appends a short unique suffix to ensure uniqueness in DB.
 */
export async function generateSlug(title: string): Promise<string> {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  // Check uniqueness; append random suffix if collision
  let slug = base;
  let exists = await prisma.event.findUnique({ where: { slug } });
  let attempt = 0;

  while (exists) {
    attempt++;
    const suffix = Math.random().toString(36).slice(2, 6);
    slug = `${base}-${suffix}`;
    exists = await prisma.event.findUnique({ where: { slug } });
    if (attempt > 10) {
      slug = `${base}-${Date.now()}`;
      break;
    }
  }

  return slug;
}

export const prerender = false;

import type { APIRoute } from "astro";
import type { ICommentFormData } from "../../types/comments";

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

// Helper function to generate simple slug with UUID-like ID
function generateSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 20); // Limit length

  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);

  return `${baseSlug}-${timestamp}-${randomId}`;
}

// Helper function to get comment level and root parent
async function getCommentHierarchy(parentId: string) {
  try {
    const commentsDir = path.join(process.cwd(), "src/content/comments");
    const parentFilePath = path.join(commentsDir, `${parentId}.md`);

    if (!existsSync(parentFilePath)) {
      return { level: 1, rootParentId: null };
    }

    const fs = await import("node:fs/promises");
    const content = await fs.readFile(parentFilePath, "utf-8");

    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      return { level: 1, rootParentId: null };
    }

    const frontmatter = frontmatterMatch[1];
    const parentIdMatch = frontmatter.match(/parentId:\s*(.+)/);
    const levelMatch = frontmatter.match(/level:\s*(\d+)/);
    const rootParentIdMatch = frontmatter.match(/rootParentId:\s*(.+)/);

    if (!parentIdMatch) {
      // This is a level 1 comment, so reply will be level 2
      return { level: 2, rootParentId: parentId };
    }

    const parentLevel = levelMatch ? parseInt(levelMatch[1]) : 2;
    const rootParentId = rootParentIdMatch ? rootParentIdMatch[1] : parentId;

    // Max 3 levels
    const newLevel = Math.min(parentLevel + 1, 3);

    return { level: newLevel, rootParentId };
  } catch (error) {
    console.error("Failed to get comment hierarchy:", error);
    return { level: 2, rootParentId: parentId };
  }
}

// Helper function to create markdown frontmatter
function createFrontmatter(
  data: ICommentFormData,
  slug: string,
  level: number,
  rootParentId: string | null,
): string {
  const now = new Date();

  let frontmatter = `---
name: ${data.name}
date: ${now.toISOString().split("T")[0]}
level: ${level}`;

  if (data.parentId) {
    frontmatter += `\nparentId: ${data.parentId}`;
  }

  if (rootParentId) {
    frontmatter += `\nrootParentId: ${rootParentId}`;
  }

  if (level < 3) {
    frontmatter += `\nhasReplies: false`;
  }

  frontmatter += "\n---\n\n";

  return frontmatter;
}

// Helper function to update parent comment to mark it has replies
async function updateParentComment(parentId: string) {
  try {
    const commentsDir = path.join(process.cwd(), "src/content/comments");
    const parentFilePath = path.join(commentsDir, `${parentId}.md`);

    if (existsSync(parentFilePath)) {
      const fs = await import("node:fs/promises");
      const content = await fs.readFile(parentFilePath, "utf-8");

      // Update hasReplies to true
      const updatedContent = content.replace(
        /hasReplies:\s*(false|true)/,
        "hasReplies: true",
      );

      await fs.writeFile(parentFilePath, updatedContent, "utf-8");
    }
  } catch (error) {
    console.error("Failed to update parent comment:", error);
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    const data: ICommentFormData = {
      parentId: (formData.get("parentId") as string) || undefined,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      message: formData.get("message") as string,
      saveAuthorData: formData.get("saveAuthorData") === "on",
    };

    // Validate required fields
    if (!data.name || !data.email || !data.message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get hierarchy info
    const { level, rootParentId } = data.parentId
      ? await getCommentHierarchy(data.parentId)
      : { level: 1, rootParentId: null };

    // Check if trying to reply to level 3 comment
    if (level > 3) {
      return new Response(
        JSON.stringify({ error: "Maximum comment depth reached" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const slug = generateSlug(data.name);

    // Create the markdown content
    const frontmatter = createFrontmatter(data, slug, level, rootParentId);
    const markdownContent = frontmatter + data.message;

    // Ensure comments directory exists
    const commentsDir = path.join(process.cwd(), "src/content/comments");
    if (!existsSync(commentsDir)) {
      await mkdir(commentsDir, { recursive: true });
    }

    // Write the new comment file
    const filePath = path.join(commentsDir, `${slug}.md`);
    await writeFile(filePath, markdownContent, "utf-8");

    // If this is a reply, update the parent comment
    if (data.parentId) {
      await updateParentComment(data.parentId);
    }

    const response = {
      success: true,
      message: data.parentId
        ? "Reply submitted successfully!"
        : "Comment submitted successfully!",
      slug: slug,
      level: level,
      saveAuthorData: data.saveAuthorData,
      authorData: data.saveAuthorData
        ? {
            name: data.name,
            email: data.email,
          }
        : null,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing comment submission:", error);
    return new Response(JSON.stringify({ error: "Failed to submit comment" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

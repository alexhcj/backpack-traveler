export const prerender = false;

import type { APIRoute } from "astro";
import type { ICommentFormData } from "../../types/comments";

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

// Helper function to generate slug from name
function generateSlug(name: string, parentId?: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  const timestamp = Date.now();

  if (parentId) {
    return `${baseSlug}-reply-to-${parentId}-${timestamp}`;
  }

  return `${baseSlug}-comment-${timestamp}`;
}

// Helper function to create markdown frontmatter
function createFrontmatter(data: ICommentFormData, slug: string): string {
  const now = new Date();

  let frontmatter = `---
name: ${data.name}
date: ${now.toISOString().split("T")[0]}`;

  if (data.parentId) {
    frontmatter += `\nparentId: ${data.parentId}`;
  } else {
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

    const slug = generateSlug(data.name, data.parentId);

    // Create the markdown content
    const frontmatter = createFrontmatter(data, slug);
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

    // Handle saveAuthorData (store in localStorage via response)
    const response = {
      success: true,
      message: data.parentId
        ? "Reply submitted successfully!"
        : "Comment submitted successfully!",
      slug: slug,
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

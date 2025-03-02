// handlers/create-notion-project-doc.ts
import axios from "axios";
import { logConsole } from "../../../utils";

/**
 * Creates a Notion page (PRD) with project details and milestones.
 * Called by Risha when breaking down an idea into an MVP.
 */
export async function createNotionProjectDoc(inputData: {
  parentDatabaseId: string;
  title: string;
  description: string;
  milestones: string[];
  createdBy: string;
  sessionId: string;
}) {
  try {
    const payload = {
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: inputData.title,
              },
            },
          ],
        },
        Description: {
          rich_text: [
            {
              text: {
                content: inputData.description,
              },
            },
          ],
        },
        // Assuming the database has a multi-select property called "Milestones"
        Milestones: {
          multi_select: inputData.milestones.map((ms) => ({ name: ms })),
        },
      },
      children: [
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            text: [{ type: "text", text: { content: "Project Overview" } }],
          },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            text: [{ type: "text", text: { content: inputData.description } }],
          },
        },
      ],
    };

    const response = await axios.post(
      "https://api.notion.com/v1/pages",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
      }
    );

    logConsole.info(`Notion page created: ${response.data.id}`);
    return {
      message: "Notion project document created successfully",
      pageId: response.data.id,
      pageUrl: response.data.url || null,
    };
  } catch (error: any) {
    logConsole.error("Error creating Notion project document:", error);
    return {
      error: error.name || "NotionCreationError",
      message: error.message,
    };
  }
}

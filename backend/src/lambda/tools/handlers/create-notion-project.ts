// handlers/create-notion-project-doc.ts
import axios from "axios";
import {
  logConsole,
  sendCharacterMessage,
  sendGodMessage,
} from "../../../utils";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

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
  characterId: string;
  sessionId: string;
}) {
  try {
    await sendCharacterMessage(
      inputData.characterId,
      inputData.sessionId,
      docClient,
      `Creating the project document on notion, one second...`
    );

    const milestonesText = inputData.milestones
      .map((ms) => `• ${ms}`)
      .join("\n");

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
        Milestones: {
          rich_text: [
            {
              text: {
                content: milestonesText,
              },
            },
          ],
        },
      },
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

    await sendGodMessage(inputData.sessionId, docClient, {
      createdBy: inputData.createdBy,
      characterId: inputData.characterId,
      createdAt: new Date().toISOString(),
      eventName: "prd_created",
      metadata: {
        id: response.data.id,
        url: response.data.url,
      },
    });

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

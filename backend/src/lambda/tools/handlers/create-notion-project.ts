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

interface NotionGithubInput {
  parentDatabaseId: string;
  title: string;
  description: string;
  milestones: string[];
  createdBy: string;
  characterId: string;
  sessionId: string;
}

/**
 * Creates a Notion project document (PRD) and a GitHub repository for the project.
 */
export async function createNotionProjectDoc(inputData: NotionGithubInput) {
  try {
    await sendCharacterMessage(
      inputData.characterId,
      inputData.sessionId,
      docClient,
      `Creating the project document on Notion, one second...`
    );

    const milestonesText = inputData.milestones
      .map((ms) => `• ${ms}`)
      .join("\n");

    const notionPayload = {
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        Name: { title: [{ text: { content: inputData.title } }] },
        Description: {
          rich_text: [{ text: { content: inputData.description } }],
        },
        Milestones: { rich_text: [{ text: { content: milestonesText } }] },
      },
    };

    const notionResponse = await axios.post(
      "https://api.notion.com/v1/pages",
      notionPayload,
      {
        headers: {
          Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
      }
    );

    logConsole.info(`Notion page created: ${notionResponse.data.id}`);
    const notionUrl = notionResponse.data.url;

    await sendGodMessage(inputData.sessionId, docClient, {
      createdBy: inputData.createdBy,
      characterId: inputData.characterId,
      createdAt: new Date().toISOString(),
      eventName: "prd_created",
      metadata: { Notion_doc: notionUrl },
    });

    await sendCharacterMessage(
      inputData.characterId,
      inputData.sessionId,
      docClient,
      `Creating GitHub repository for project, one second...`
    );

    const githubPayload = {
      name: inputData.title,
      description: inputData.description,
      private: false,
      auto_init: true,
    };

    const githubResponse = await axios.post(
      "https://api.github.com/user/repos",
      githubPayload,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    logConsole.info(`GitHub repo created: ${githubResponse.data.full_name}`);
    const repoUrl = githubResponse.data.html_url;

    await sendGodMessage(inputData.sessionId, docClient, {
      createdBy: inputData.createdBy,
      characterId: inputData.characterId,
      createdAt: new Date().toISOString(),
      eventName: "repo_created",
      metadata: { github_repo: repoUrl },
    });

    return {
      message: "Notion PRD and GitHub repository created successfully",
      notionUrl,
      repoUrl,
    };
  } catch (error: any) {
    logConsole.error("Error creating Notion PRD or GitHub repo:", error);
    return {
      error: error.name || "NotionGithubCreationError",
      message: error.message,
    };
  }
}

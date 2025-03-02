// projectToolHandler.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { ConversationMessage, ParticipantRole } from "multi-agent-orchestrator";
import { logConsole, sendCharacterMessage } from "../../utils";
import { createNotionProjectDoc } from "./handlers/create-notion-project";
import { publishProjectOnVercel } from "./handlers/deploy-vercel-project";

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const projectToolDescriptions = [
  {
    toolSpec: {
      name: "Create_Notion_Project_Doc_Tool",
      description:
        "Creates a Notion page (PRD) with project details, description, and milestones.",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            parentDatabaseId: {
              type: "string",
              description:
                "The Notion database ID where the project PRD should be created.",
            },
            title: {
              type: "string",
              description: "The title of the project.",
            },
            description: {
              type: "string",
              description: "Detailed project description and requirements.",
            },
            milestones: {
              type: "array",
              items: { type: "string" },
              description: "An array of milestone names for the project.",
            },
            createdBy: {
              type: "string",
              description: "The user performing the action (e.g., 'user_xxx').",
            },
            sessionId: {
              type: "string",
              description: "Session ID for the current conversation.",
            },
          },
          required: [
            "parentDatabaseId",
            "title",
            "description",
            "milestones",
            "createdBy",
            "sessionId",
          ],
        },
      },
    },
  },
  {
    toolSpec: {
      name: "Publish_Vercel_Project_Tool",
      description:
        "Creates a GitHub repository and deploys the project on Vercel, returning the project URL.",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            projectName: {
              type: "string",
              description: "The name of the project.",
            },
            projectDescription: {
              type: "string",
              description: "A brief description of the project.",
            },
            branch: {
              type: "string",
              description: "The branch to deploy (default is 'main').",
            },
            createdBy: {
              type: "string",
              description: "The user performing the action (e.g., 'user_xxx').",
            },
            sessionId: {
              type: "string",
              description: "Session ID for the current conversation.",
            },
          },
          required: [
            "projectName",
            "projectDescription",
            "createdBy",
            "sessionId",
          ],
        },
      },
    },
  },
];

export async function projectToolHandler(
  response: Response,
  conversation: ConversationMessage[]
) {
  logConsole.info(
    `Project Tool fired with response: ${JSON.stringify(response)} ${JSON.stringify(conversation)}`
  );

  // If there is text content, relay it using the helper
  if (
    response?.content?.[0]?.text &&
    response?.content?.[0]?.toolUse?.input?.sessionId &&
    response?.content?.[0]?.toolUse?.input?.createdBy
  ) {
    await sendCharacterMessage(
      response.content[0].toolUse.input.createdBy,
      response.content[0].toolUse.input.sessionId,
      docClient,
      response.content[0].text
    );
  }

  const toolResults = await Promise.all(
    response.content.map(async (contentBlock: any) => {
      if (!("toolUse" in contentBlock)) return null;
      const { toolUse } = contentBlock;
      let result;

      try {
        switch (toolUse.name) {
          case "Create_Notion_Project_Doc_Tool":
            result = await createNotionProjectDoc(toolUse.input);
            break;
          case "Publish_Vercel_Project_Tool":
            result = await publishProjectOnVercel(toolUse.input);
            break;
          default:
            logConsole.warn(`Tool ${toolUse.name} not found`);
            return null;
        }

        logConsole.info(
          `Response from ${toolUse.name}: ${JSON.stringify(result)}`
        );
        return {
          toolResult: {
            toolUseId: toolUse.toolUseId,
            content: [{ json: { result } }],
          },
        };
      } catch (error) {
        logConsole.error(`Error executing ${toolUse.name}: ${error}`);
        return {
          toolResult: {
            toolUseId: toolUse.toolUseId,
            content: [{ json: { error: error } }],
          },
        };
      }
    })
  );

  const validResults = toolResults.filter((result) => result !== null);
  return { role: ParticipantRole.USER, content: validResults };
}

interface Response {
  content: Content[];
  role: string;
}

interface Content {
  text?: string;
  toolUse?: ToolUse;
}

interface ToolUse {
  input: any;
  name: string;
  toolUseId: string;
}

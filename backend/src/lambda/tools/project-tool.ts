// projectToolHandler.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { ConversationMessage, ParticipantRole } from "multi-agent-orchestrator";
import { logConsole, sendCharacterMessage } from "../../utils";
import { createNotionProjectDoc } from "./handlers/create-notion-project";
import { publishProjectOnVercel } from "./handlers/deploy-vercel-project";
import { createPad19Listing } from "./handlers/create-pad19-listing";

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
            characterId: {
              type: "string",
              description: "The character that is performing the action. This will always be Risha.",
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
            characterId: {
              type: "string",
              description: "The character that is performing the action. This will always be Risha.",
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
  {
    toolSpec: {
      name: "Create_Pad19_Listing_Tool",
      description:
        "Creates a new project listing in Supabase for PAD19, adding the startup to the PAD19 listings.",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the startup/project.",
            },
            description: {
              type: "string",
              description: "Project description and details.",
            },
            
            link: {
              type: "string",
              description: "URL for the project website.",
            },
            requester: {
              type: "string",
              description: "The wallet address of user performing the action (e.g., 'Ox36..374')",
            },
            users: {
              type: "string",
              description: "The number of users (e.g., '12.5k'), default to 0.",
            },
            stars: {
              type: "number",
              description: "Number of stars, default to 0",
            },
            launchedAt: {
              type: "string",
              description: "Launch date or relative time (e.g., '2d ago').",
            },
            status: {
              type: "string",
              enum: ["In Queue", "Live"],
              description: "The current status of the startup.",
            },
            metrics: {
              type: "object",
              properties: {
                dau: {
                  type: "string",
                  description: "Daily active users.",
                },
                revenue: {
                  type: "string",
                  description: "24h revenue.",
                },
              },
              required: ["dau", "revenue"],
            },
            createdBy: {
              type: "string",
              description: "The user performing the action (e.g., 'user_xxx')",
            },
            characterId: {
              type: "string",
              description: "The character that is performing the action. This will always be Risha.",
          },
            sessionId: {
              type: "string",
              description: "Session ID for the current conversation.",
            },
          },
          required: [
            "name",
            "description",
            "logo",
            "link",
            "requester",
            "users",
            "stars",
            "launchedAt",
            "status",
            "metrics",
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
            case "create_pad19_listing":
              result = await createPad19Listing(toolUse.input);
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

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { ConversationMessage, ParticipantRole } from "multi-agent-orchestrator";
import { logConsole, sendCharacterMessage } from "../../utils";
import { createImage } from "./handlers/create-image-handler";
import { createTweet } from "./handlers/create-tweet-handler";
import { getGrokAnalysis } from "./handlers/get-grok-information-handler";
import { getTweets } from "./handlers/get-tweets-handler";
import { createPad19Listing } from "./handlers/create-pad19-listing";
import createInterface from "./handlers/create-interface-handler";

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const twitterToolDescription = [
  {
    toolSpec: {
      name: "Create_Tweet_Tool",
      description:
        "Creates a tweet given a message, ensuring URLs are left intact",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description:
                "The message to tweet which can include a link to the NFT to promote",
            },
            createdBy: {
              type: "string",
              description:
                "The user that is performing the action. (starts with 'user_' and will look something like 'user_2nCKty8ggdPrOyvsNgupp1oDd9Y')",
            },
            characterId: {
              type: "string",
              description:
                "The character that is performing the action. This will always be Monad.",
            },
            sessionId: {
              type: "string",
              description: "The session that is performing the action.",
            },
          },
          required: ["message", "createdBy", "characterId", "sessionId"],
        },
      },
    },
  },
  {
    toolSpec: {
      name: "Fetch_Tweets_Tool",
      description: "Fetches tweets from the twitter API",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            userHandle: {
              type: "string",
              description:
                "The Twitter handle to fetch tweets from. (e.g. 'elonmusk')",
            },
          },
        },
      },
    },
  },
  {
    toolSpec: {
      name: "Get_Grok_Information_Tool",
      description:
        "Fetches information about a user's Twitter account, or the current Web3 and crypto landscape is no userHandle is provided",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            userHandle: {
              type: "string",
              description:
                "The Twitter handle to fetch information about, or leave blank to get information about the current Web3 and crypto landscape",
            },
            createdBy: {
              type: "string",
              description:
                "The user that is performing the action. (starts with 'user_' and will look something like 'user_2nCKty8ggdPrOyvsNgupp1oDd9Y')",
            },
            characterId: {
              type: "string",
              description:
                "The character that is performing the action. This will always be Jaden.",
            },
            sessionId: {
              type: "string",
              description: "The session that is performing the action.",
            },
          },
          required: ["createdBy", "characterId", "sessionId"],
        },
      },
    },
  },
  {
    toolSpec: {
      name: "Create_Image_Tool",
      description:
        "Creates an image for logo using the project details and save the image url to be used for logo when creating pad19 listing",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "The prompt to create an image with.",
            },
            imageName: {
              type: "string",
              description:
                "The name of the image to create. This should be a short name for the image based on the prompt. Should not include spaces, underscores, or special characters.",
            },
            createdBy: {
              type: "string",
              description:
                "The user that is performing the action. (starts with 'user_' and will look something like 'user_2nCKty8ggdPrOyvsNgupp1oDd9Y')",
            },
            characterId: {
              type: "string",
              description:
                "The character that is performing the action. This will always be Pearl.",
            },
            sessionId: {
              type: "string",
              description: "The session that is performing the action.",
            },
          },
          required: ["prompt", "createdBy", "characterId", "sessionId"],
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
            logo: {
              type: "string",
              description:
                "image url for the project. use the image created with the Create_Image_Tool",
            },
            link: {
              type: "string",
              description: "URL for the project website.",
            },
            requester: {
              type: "string",
              description:
                "The wallet address of user performing the action (e.g., '0x71...5B16')",
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
              description:
                "Launch date or relative time (e.g., '2d ago'), default to the current date and time.",
            },
            status: {
              type: "string",
              enum: ["In Queue", "Live"],
              description: "The current status of the startup. default to live",
            },
            metrics: {
              type: "object",
              properties: {
                dau: {
                  type: "string",
                  description: "Daily active users. default to 0",
                },
                revenue: {
                  type: "string",
                  description: "24h revenue. default to 0",
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
              description:
                "The character that is performing the action. This will always be Pearl.",
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
  {
    toolSpec: {
      name: "Create_Interface_Tool",
      description:
        "Creates a UI interface from design specifications, returning the code to be displayed in a code editor.",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            designSpec: {
              type: "string",
              description:
                "The design instructions from Pearl (primary color, secondary, pages, layout and responsiveness etc.).",
            },
            framework: {
              type: "string",
              description:
                "The frontend framework to use (Default to Next.js).",
              default: "Next.js",
            },
            componentType: {
              type: "string",
              description: "The type of component to create.",
              enum: ["Page"],
              default: "Page",
            },
            styleFramework: {
              type: "string",
              description: "The CSS framework to use.",
              default: "Tailwind",
            },
            responsive: {
              type: "boolean",
              description: "Whether the interface should be responsive.",
              default: true,
            },
            darkMode: {
              type: "boolean",
              description: "Whether to include dark mode support.",
              default: false,
            },
            createdBy: {
              type: "string",
              description: "The user performing the action (e.g., 'user_xxx').",
            },
            characterId: {
              type: "string",
              description:
                "The character that is performing the action. This will always be Qwen.",
            },
            sessionId: {
              type: "string",
              description: "Session ID for the current conversation.",
            },
          },
          required: ["designSpec", "createdBy", "characterId", "sessionId"],
        },
      },
    },
  },
];

export async function twitterToolHandler(
  response: Response,
  conversation: ConversationMessage[]
) {
  logConsole.info(
    `Twitter Tool fired with response: ${JSON.stringify(response)} ${JSON.stringify(conversation)}`
  );

  if (!response.content) {
    throw new Error("No content blocks in response");
  }

  if (
    response?.content?.[0]?.text &&
    response?.content?.[0]?.toolUse?.input?.characterId &&
    response?.content?.[0]?.toolUse?.input?.sessionId
  ) {
    await sendCharacterMessage(
      response.content[0].toolUse.input.characterId,
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
          case "Create_Tweet_Tool":
            result = await createTweet(
              toolUse.input.message,
              toolUse.input.sessionId,
              toolUse.input.characterId,
              toolUse.input.createdBy
            );
            break;
          case "Get_Grok_Information_Tool":
            result = await getGrokAnalysis(
              toolUse.input.createdBy,
              toolUse.input.characterId,
              toolUse.input.sessionId,
              toolUse.input.userHandle
            );
            break;

          case "Create_Image_Tool":
            result = await createImage({
              imageName: toolUse.input.imageName,
              createdBy: toolUse.input.createdBy,
              characterId: toolUse.input.characterId,
              sessionId: toolUse.input.sessionId,
              prompt: toolUse.input.prompt,
            });
            break;

          case "Fetch_Tweets_Tool":
            result = await getTweets(toolUse.input.userHandle);
            break;

          case "Create_Interface_Tool":
            result = await createInterface(toolUse.input);
            break;

          case "Create_Pad19_Listing_Tool":
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

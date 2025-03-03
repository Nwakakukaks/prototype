import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Context, SQSEvent } from "aws-lambda";
import {
  BedrockClassifier,
  BedrockLLMAgent,
  AnthropicAgent,
  DynamoDbChatStorage,
  MultiAgentOrchestrator,
} from "multi-agent-orchestrator";
import { ConnectionItem, logConsole, sendCharacterMessage } from "../utils";
import { createItem, getItem } from "./dynamo_v3";
import { CharacterWallet } from "./tools/handlers/create-wallet-handler";
import {
  SOFTWARE_ENGINEER_PROMPT,
  INTERFACE_DESIGNER_PROMPT,
  MARKET_ANALYST_PROMPT,
  GROWTH_EXPERT_PROMPT,
  PRODUCT_MANAGER_PROMPT,
} from "./tools/persona";
import {
  twitterToolDescription,
  twitterToolHandler,
} from "./tools/twitter-tool";
import { walletToolDescription, walletToolHandler } from "./tools/wallet-tool";
import "dotenv/config";
import { Anthropic } from "@anthropic-ai/sdk";
import {
  projectToolDescriptions,
  projectToolHandler,
} from "./tools/project-tool";

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const TABLE_NAME = process.env.CORE_TABLE_NAME as string;
const WSS_TABLE_NAME = process.env.WSS_TABLE_NAME as string;
const TTL_DURATION = 3600; // in seconds

const dynamoDbStorage = new DynamoDbChatStorage(
  TABLE_NAME,
  process.env.AWS_REGION as string,
  "ttl",
  TTL_DURATION
);

// getModelId.ts
const getModelId = (agentName: string) => {
  switch (agentName) {
    case "Jaden":
      return "anthropic.claude-3-haiku-20240307-v1:0";
    case "Qwen":
      return "anthropic.claude-3-haiku-20240307-v1:0";
    case "Risha":
      return "anthropic.claude-3-haiku-20240307-v1:0";
    case "Pearl":
      return "anthropic.claude-3-haiku-20240307-v1:0";
    case "Monad":
      return "anthropic.claude-3-haiku-20240307-v1:0";
    default:
      return "anthropic.claude-3-haiku-20240307-v1:0";
  }
};

export default getModelId;

const recursiveOptions = {
  maxRecursions: 10,
};

export interface InvokeModelPayload {
  connectionId: string;
  stage: string;
  domainName: string;
  chatMode: "RECURSIVE" | "STANDARD";
  sendersWalletAddress: string;
  createdBy: string;
  characterId: string;
  sessionId: string;
  temperature: number;
  data: string;
  maxTokens: number;
  topP: number;
}

const logger = new Logger({
  logLevel: "INFO",
  serviceName: "OrchestratorService",
});

// Pearl Agent (Interface Designer)
const pearlAgent = new BedrockLLMAgent({
  name: "Pearl",
  streaming: false,
  description:
    "You are Pearl, an innovative interface designer tasked with transforming MVP specifications into intuitive and visually appealing UI/UX designs. Collaborate closely with Risha to understand project requirements and incorporate feedback from the end user. Your designs should align with the overall project vision and complement the technical work.",
  modelId: getModelId("Pearl"),
  inferenceConfig: { temperature: 0 },
  saveChat: true,
});
pearlAgent.setSystemPrompt(INTERFACE_DESIGNER_PROMPT);

// Jaden Agent
const jadenAgent = new BedrockLLMAgent({
  name: "Jaden",
  streaming: false,
  modelId: getModelId("Jaden"),
  inferenceConfig: {
    temperature: 0,
  },
  description:
    'You are Jaden, a cool, laid-back market analysis expert who provides current risk assessments and trading recommendations for specified crypto token assets. You analyze market trends and assets using analytical tools when provided with a contract address, offering clear "Buy", "Sell", or "Hold" recommendations with brief explanations. You cannot create resources; you only analyze them. You collaborate closely with Risha and Qwen by providing them with recommendations, with Qwen by informing him about new assets that may require technical setups like smart contracts or pools and with Monad by sharing insights that could enhance marketing strategies. If suggesting pairs for uniswap pools. Lean on your colleagues for help when needed, and always communicate with them by name to coordinate tasks effectively.',
  saveChat: true,
});
jadenAgent.setSystemPrompt(MARKET_ANALYST_PROMPT);

// Qwen Agent (Smart Contract & Deployment)
const qwenAgent = new BedrockLLMAgent({
  name: "Qwen",
  streaming: false,
  description:
    "You are Qwen, a laid-back smart contract and Web3 expert. Your responsibilities include deploying token smart contracts and building the technical infrastructure. In this project, you must deploy the smart contract and then develop a Next.js frontend that connects to it. Once your work is complete, inform Risha so that he can review the project with the end user before the final Vercel deployment is triggered.",
  modelId: getModelId("Qwen"),
  inferenceConfig: { temperature: 0 },
  saveChat: true,
  toolConfig: {
    tool: walletToolDescription as any, // Qwen only uses his wallet tools
    useToolHandler: walletToolHandler,
    toolMaxRecursions: 10,
  },
});
qwenAgent.setSystemPrompt(SOFTWARE_ENGINEER_PROMPT);

// Monad Agent (Marketing Expert)
const monadAgent = new BedrockLLMAgent({
  name: "Monad",
  streaming: false,
  description: `You are Monad, a creative marketing expert focused on growing the Web3 and crypto brand. Your primary goal is to create concise and engaging marketing content that effectively promotes the project. Collaborate with your colleagues to understand the project’s key features and craft messaging that resonates with the target audience.  You create marketing content such as tweets and images in a casual, engaging manner, keeping messages under 200 characters without emojis, exclamation points, or hashtags. You collaborate closely with Qwen by providing images ("imageKey" and "NFTName") for NFT creation, and with Jaden by incorporating his market insights into your marketing strategies. At times, you will be called upon to think creatively about how to grow the business and social media audience, checking market data, or exploring Twitter for content ideas. Lean on your colleagues for help when needed, and always communicate with them by name to coordinate tasks effectively.`,
  modelId: getModelId("Monad"),
  inferenceConfig: { temperature: 0 },
  saveChat: true,
  toolConfig: {
    tool: twitterToolDescription as any,
    useToolHandler: twitterToolHandler,
    toolMaxRecursions: 10,
  },
});
monadAgent.setSystemPrompt(GROWTH_EXPERT_PROMPT);

// Risha Agent (Product Manager)
const rishaAgent = new BedrockLLMAgent({
  name: "Risha",
  streaming: false,
  description:
    "You are Risha, a practical and visionary product manager who turns ideas into viable MVPs. Your main role is to document the project’s vision by creating detailed PRD documents in Notion with project details and milestones. Once the document is created, assign tasks to Pearl and await Qwen’s technical work. When Qwen finishes deploying the smart contract and building the Next.js frontend, review the completed project with the end user and only then trigger the Vercel deployment.",
  modelId: getModelId("Risha"),
  inferenceConfig: { temperature: 0 },
  saveChat: true,
  toolConfig: {
    tool: projectToolDescriptions as any,
    useToolHandler: projectToolHandler,
    toolMaxRecursions: 5,
  },
});
rishaAgent.setSystemPrompt(PRODUCT_MANAGER_PROMPT);

const customClassifier = new BedrockClassifier({
  modelId: getModelId("Classifier"),
  inferenceConfig: {
    maxTokens: 4000,
    temperature: 0,
    topP: 0.9,
  },
});

const orchestrator = new MultiAgentOrchestrator({
  storage: dynamoDbStorage,
  classifier: customClassifier,
  config: {
    USE_DEFAULT_AGENT_IF_NONE_IDENTIFIED: true,
    LOG_AGENT_CHAT: true,
    LOG_CLASSIFIER_CHAT: true,
    LOG_CLASSIFIER_RAW_OUTPUT: true,
    LOG_CLASSIFIER_OUTPUT: true,
    LOG_EXECUTION_TIMES: true,
  },
  logger: logger,
});

orchestrator.addAgent(jadenAgent);
orchestrator.addAgent(monadAgent);
orchestrator.addAgent(qwenAgent);
orchestrator.addAgent(pearlAgent);
orchestrator.addAgent(rishaAgent);

// Let Monad be the default agent
orchestrator.setDefaultAgent(rishaAgent);

async function streamResponseToCharacter(
  characterId: string,
  sessionId: string,
  docClient: DynamoDBDocumentClient,
  chunk: string
) {
  try {
    await sendCharacterMessage(characterId, sessionId, docClient, chunk);
  } catch (error) {
    logConsole.error(
      `Failed to stream response to character ${characterId}:`,
      error
    );
    throw error;
  }
}

export const handler = async (
  event: SQSEvent,
  context: Context
): Promise<void> => {
  logConsole.info("Received event:", JSON.stringify(event, null, 2));
  let currentRecursion = 0;
  for (const record of event.Records) {
    const _event = JSON.parse(record.body) as InvokeModelPayload;
    const {
      sessionId,
      createdBy,
      characterId,
      sendersWalletAddress,
      data,
      chatMode,
    } = _event;
    await handleMessage(
      sessionId,
      createdBy,
      characterId,
      chatMode,
      sendersWalletAddress,
      data,
      currentRecursion
    );
  }
};

const handleMessage = async (
  sessionId: string,
  createdBy: string,
  characterId: string,
  mode: "RECURSIVE" | "STANDARD",
  sendersWalletAddress: string,
  data: string,
  currentRecursion: number
) => {
  let responseCharacterId;
  try {
    const agents = orchestrator.getAllAgents();
    orchestrator.classifier.setSystemPrompt(
      `
      {{AGENT_DESCRIPTIONS}}
      {{HISTORY}}
      {{CUSTOM_PLACEHOLDER}}
      `,
      {
        CUSTOM_PLACEHOLDER:
          "Important: If a message starts with 'Hey <Agent Name>,' ensure you route the message to the Agent specified as <Agent Name>.",
      }
    );

    const unixTimestampInMillis = Math.floor(Date.now());
    const messageObject = {
      PK: `session#${sessionId}`,
      SK: `message#${unixTimestampInMillis}`,
      createdAt: new Date().toISOString(),
      createdBy,
      message: data,
      ttl: unixTimestampInMillis / 1000 + TTL_DURATION,
      sessionId,
      characterId,
    };
    await createItem(
      messageObject.PK,
      messageObject.SK,
      messageObject,
      TABLE_NAME,
      docClient
    );

    // Get all the wallet addresses for all agents before asking the question
    const wallets = [];
    for (const agent of Object.values(agents)) {
      const wallet = await getItem<CharacterWallet>(
        "wallet",
        `${createdBy}#${agent.name}`,
        TABLE_NAME,
        docClient
      );
      wallets.push({
        agent: agent.name,
        address: wallet?.walletAddress,
      });
    }

    const message = `
      <metadata>
        <created_by>${createdBy}</created_by>
        <session_id>${sessionId}</session_id>
        <character_id>${characterId}</character_id>
        <senders_wallet_address>${sendersWalletAddress}</senders_wallet_address>
      </metadata>

      Only use the <metadata> as extra context. Do not consider the metadata as part of the agent selection or routing process. Here is the message:
      <message>New message from: ${characterId}: ${data}</message>`;

    // Use the retry helper to call routeRequest
    // const response = await routeRequestWithRetry(
    //   message,
    //   createdBy,
    //   sessionId,
    //   {
    //     characterId,
    //     createdBy,
    //     sessionId,
    //     sendersWalletAddress,
    //     wallets: wallets
    //       .map((w) => `${w.agent}: ${w.address || null}`)
    //       .join(", "),
    //   }
    // );

    // const message = _event.data
    const response = await orchestrator.routeRequest(
      message,
      createdBy,
      sessionId,
      {
        characterId,
        createdBy,
        sessionId,
        sendersWalletAddress,
        wallets: wallets
          .map((w) => `${w.agent}: ${w.address || null}`)
          .join(", "),
      }
    );

    responseCharacterId = response.metadata.agentName;
    const targetConnection = await getItem<ConnectionItem>(
      `session#${sessionId}`,
      `character#${responseCharacterId}`,
      WSS_TABLE_NAME,
      docClient
    );

    const responseUnixTimestampInMillis = Math.floor(Date.now());
    const responseMessageObject = {
      PK: `session#${sessionId}`,
      SK: `message#${responseUnixTimestampInMillis}`,
      createdAt: new Date().toISOString(),
      createdBy,
      message: response.output.toString(),
      ttl: responseUnixTimestampInMillis / 1000 + TTL_DURATION,
      sessionId,
      characterId: responseCharacterId,
    };
    await createItem(
      messageObject.PK,
      messageObject.SK,
      responseMessageObject,
      TABLE_NAME,
      docClient
    );

    if (targetConnection) {
      logConsole.info(`> Agent ID: ${response.metadata.agentId}`);
      logConsole.info(`> Agent Name: ${response.metadata.agentName}`);
      logConsole.info(`> User Input: ${response.metadata.userInput}`);
      logConsole.info(`> User ID: ${response.metadata.userId}`);
      logConsole.info(`> Session ID: ${response.metadata.sessionId}`);
      logConsole.info(
        `> Additional Parameters:`,
        response.metadata.additionalParams
      );
      logConsole.info(`\n> Response: ${JSON.stringify(response)}`);

      if (response.streaming === true) {
        logConsole.info("\n** RESPONSE STREAMING ** \n");
        for await (const chunk of response.output) {
          logConsole.info("Streaming chunk to character:", chunk);
          if (typeof chunk === "string") {
            await streamResponseToCharacter(
              responseCharacterId,
              sessionId,
              docClient,
              chunk
            );
          } else {
            console.error("Received unexpected chunk type:", typeof chunk);
          }
        }
      } else {
        // Handle non-streaming response
        logConsole.info("\n** RESPONSE ** \n");

        await sendCharacterMessage(
          responseCharacterId,
          sessionId,
          docClient,
          response.output.toString()
        );
      }
    }

    if (currentRecursion >= recursiveOptions.maxRecursions) {
      logConsole.info(`Max recursion reached: ${currentRecursion}`);
      return;
    }

    // If mode is "RECURSIVE", add an 8 second delay before calling routeRequest again
    if (mode === "RECURSIVE") {
      await new Promise((resolve) => setTimeout(resolve, 8000));
      return await handleMessage(
        sessionId,
        createdBy,
        responseCharacterId,
        mode,
        sendersWalletAddress,
        response.output.toString(),
        currentRecursion + 1
      );
    }
  } catch (error) {
    console.error(`Failed to process message: ${error}`);
    // Send error message through character message system if possible
    if (responseCharacterId && sessionId) {
      await sendCharacterMessage(
        responseCharacterId,
        sessionId,
        docClient,
        JSON.stringify({
          error: "Something went wrong, please try again in a few moments.",
        })
      );
    }
    throw error;
  }
};

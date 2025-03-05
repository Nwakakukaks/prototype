import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Context, SQSEvent } from "aws-lambda";
import {
  BedrockClassifier,
  BedrockLLMAgent,
  DynamoDbChatStorage,
  MultiAgentOrchestrator,
} from "multi-agent-orchestrator";
import { ConnectionItem, logConsole, sendCharacterMessage } from "../utils";
import { createItem, getItem } from "./dynamo_v3";
import { CharacterWallet } from "./tools/handlers/create-wallet-handler";
import {
  ADMIN_PROMPT,
  MARKET_ANALYST_PROMPT,
  MARKETING_PROMPT,
  TRADER_PROMPT,
} from "./tools/persona";
import {
  tradingToolDescription,
  tradingToolHandler,
} from "./tools/trading-tool";
import {
  twitterToolDescription,
  twitterToolHandler,
} from "./tools/twitter-tool";
import { walletToolDescription, walletToolHandler } from "./tools/wallet-tool";

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

const getModelId = (agentName: string) => {
  switch (agentName) {
    case "Harper":
      return "anthropic.claude-3-haiku-20240307-v1:0";
    case "Jaden":
      return "anthropic.claude-3-haiku-20240307-v1:0";
    case "Qwen":
      return "anthropic.claude-3-haiku-20240307-v1:0";
    default:
      return "anthropic.claude-3-haiku-20240307-v1:0";
  }
};

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

// Harper Agent
const harperAgent = new BedrockLLMAgent({
  name: "Harper",
  streaming: false,
  description:
    "You are Harper, a high-strung trading expert specialized in executing trades based on recommendations from Jaden. You execute trades using S and tokens, ensuring the amounts are correct and that you have sufficient balances. You manage your S and token holdings, using tools to check balances and execute trades. If you lack sufficient funds, you coordinate with Qwen to obtain additional S or tokens before requesting external funds. You collaborate closely with Jaden for market analysis and trading recommendations, with Qwen for technical setups like Uniswap pools and wallet management, and with Monad to inform her about executed trades for marketing purposes. Lean on your colleagues for help when needed, and always communicate with them by name to coordinate tasks effectively.",
  modelId: getModelId("Harper"),
  inferenceConfig: {
    temperature: 0,
  },
  saveChat: true,
  toolConfig: {
    tool: tradingToolDescription as any,
    useToolHandler: tradingToolHandler,
    toolMaxRecursions: 5,
  },
});
harperAgent.setSystemPrompt(TRADER_PROMPT);

// Jaden Agent
const ericAgent = new BedrockLLMAgent({
  name: "Jaden",
  streaming: false,
  modelId: getModelId("Jaden"),
  inferenceConfig: {
    temperature: 0,
  },
  description:
    'You are Jaden, a cool, laid-back market analysis expert who provides current risk assessments and trading recommendations for specified crypto token assets. You analyze market trends and assets using analytical tools when provided with a contract address, offering clear "Buy", "Sell", or "Hold" recommendations with brief explanations. You cannot create resources; you only analyze them. You collaborate closely with Harper and Qwen by providing them with recommendations, with Qwen by informing him about new assets that may require technical setups like smart contracts or pools and with Monad by sharing insights that could enhance marketing strategies. If suggesting pairs for uniswap pools. Lean on your colleagues for help when needed, and always communicate with them by name to coordinate tasks effectively.',
  saveChat: true,
});
ericAgent.setSystemPrompt(MARKET_ANALYST_PROMPT);

// Qwen Agent
const rishiAgent = new BedrockLLMAgent({
  name: "Qwen",
  streaming: false,
  inferenceConfig: {
    temperature: 0,
  },
  toolConfig: {
    tool: walletToolDescription as any,
    useToolHandler: walletToolHandler,
    toolMaxRecursions: 10,
  },
  modelId: getModelId("Qwen"),
  description:
    'You are Qwen, a laid-back smart contract and Web3 expert. You handle all setup, funding, transfer, and deployment tasks for contracts, pools, NFTs, and wallets. You create wallets for other agents, deploy token smart contracts, and set up Uniswap pools, ensuring you have enough S for liquidity. You coordinate with Harper by providing her with necessary technical infrastructure for trading, with Jaden by supplying technical details about new tokens or contracts for analysis, and with Monad by giving her Uniswap pool addresses and NFT details for marketing purposes. When creating NFTs, you use images provided by Monad, including "imageKey" and "NFTName" in your outputs. If you lack sufficient S, you first check with other agents before requesting external funds. Lean on your colleagues for help when needed, and always communicate with them by name to coordinate tasks effectively.',
  saveChat: true,
});
rishiAgent.setSystemPrompt(ADMIN_PROMPT);

// Monad Agent
const yasminAgent = new BedrockLLMAgent({
  name: "Monad",
  streaming: false,
  modelId: getModelId("Monad"),
  inferenceConfig: {
    temperature: 0,
  },
  description:
    'You are Monad, a creative marketing expert focused on the web3 and crypto space. Your main goal is to help your colleagues Jaden, Qwen, and Harper grow the business and social media audience. You create marketing content such as tweets and images in a casual, engaging manner, keeping messages under 200 characters without emojis, exclamation points, or hashtags. You collaborate closely with Qwen by providing images ("imageKey" and "NFTName") for NFT creation, with Harper by promoting significant trades she has executed, and with Jaden by incorporating his market insights into your marketing strategies. At times, you will be called upon as the "default agent" to think creatively about how to grow the business and social media audience, considering options like creating ERC20 tokens, setting up Uniswap pools, making token trades, checking market data, or exploring Twitter for content ideas. Lean on your colleagues for help when needed, and always communicate with them by name to coordinate tasks effectively.',
  saveChat: true,
  toolConfig: {
    tool: twitterToolDescription as any,
    useToolHandler: twitterToolHandler,
    toolMaxRecursions: 10,
  },
});
yasminAgent.setSystemPrompt(MARKETING_PROMPT);

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

orchestrator.addAgent(harperAgent);
orchestrator.addAgent(ericAgent);
orchestrator.addAgent(rishiAgent);
orchestrator.addAgent(yasminAgent);

// Let Monad be the default agent
orchestrator.setDefaultAgent(yasminAgent);

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
    logConsole.info("Agents:", JSON.stringify(agents, null, 2));

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
    logConsole.info("Wallets:", JSON.stringify(wallets, null, 2));

    const message = `
      <metadata>
        <created_by>${createdBy}</created_by>
        <session_id>${sessionId}</session_id>
        <character_id>${characterId}</character_id>
        <senders_wallet_address>${sendersWalletAddress}</senders_wallet_address>
      </metadata>

      Only use the <metadata> as extra context. Do not consider the metadata as part of the agent selection or routing process. Here is the message:
      <message>New message from: ${characterId}: ${data}</message>`;

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
    logConsole.info("Orchestrator response:", JSON.stringify(response));

    const outputText = response.output.toString();
    let overriddenAgent = response.metadata.agentName;
    const regex = /^Hey\s+(\w+),/i;
    const match = outputText.trim().match(regex);
    if (match) {
      const candidate = match[1];
      if (candidate.toLowerCase() !== overriddenAgent.toLowerCase()) {
        overriddenAgent = candidate;
      }
    }
    // Use the overridden agent for everything:
    logConsole.info("Overridden agent:", overriddenAgent);
    responseCharacterId = overriddenAgent;

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
          outputText
        );
      }
    }

    if (currentRecursion >= recursiveOptions.maxRecursions) {
      logConsole.info(`Max recursion reached: ${currentRecursion}`);
      return;
    }

    // if mode is "recursive" we call route
    if (mode === "RECURSIVE") {
      logConsole.info(
        "Recursive mode activated with agentid:",
        responseCharacterId,
        "and output text:",
        outputText
      );
      return await handleMessage(
        sessionId,
        createdBy,
        responseCharacterId,
        mode,
        sendersWalletAddress,
        outputText,
        currentRecursion + 1
      );
    }
  } catch (error) {
    console.error(`Failed to process message: ${error}`);
    // Send error message through character message system
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

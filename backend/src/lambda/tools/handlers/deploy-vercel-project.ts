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

interface VercelInput {
  projectName: string;
  branch: string;
  createdBy: string;
  characterId: string;
  sessionId: string;
}

/**
 * Publishes a project on Vercel, now independent from GitHub repo creation.
 */
export async function publishProjectOnVercel(inputData: VercelInput) {
  try {
    await sendCharacterMessage(
      inputData.characterId,
      inputData.sessionId,
      docClient,
      `Triggering Vercel deployment...`
    );

    const deploymentPayload = {
      name: inputData.projectName,
      gitSource: {
        type: "github",
        repo: `nwakakukaks/${inputData.projectName}`,
        branch: "main",
      },
    };

    const vercelResponse = await axios.post(
      "https://api.vercel.com/v13/deployments",
      deploymentPayload,
      {
        headers: {
          Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    logConsole.info(`Vercel deployment initiated: ${vercelResponse.data.id}`);
    const projectUrl = vercelResponse.data.url;

    await sendGodMessage(inputData.sessionId, docClient, {
      createdBy: inputData.createdBy,
      characterId: inputData.characterId,
      createdAt: new Date().toISOString(),
      eventName: "vercel_deployment",
      metadata: { live_link: projectUrl },
    });

    return {
      message: "Project published successfully on Vercel",
      projectUrl,
      deploymentId: vercelResponse.data.id,
    };
  } catch (error: any) {
    logConsole.error("Error publishing project on Vercel:", error);
    return {
      error: error.name || "VercelPublishError",
      message: error.message,
    };
  }
}

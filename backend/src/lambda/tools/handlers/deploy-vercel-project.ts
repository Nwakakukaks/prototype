import axios from "axios";
import {
  logConsole,
  sendCharacterMessage,
  sendGodMessage,
} from "../../../utils";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

/**
 * Helper: Creates a GitHub repository for the project.
 */
async function createGithubRepo(repoName: string, description: string) {
  try {
    const payload = {
      name: repoName,
      description: description,
      private: false,
      auto_init: true,
    };

    const response = await axios.post(
      "https://api.github.com/user/repos",
      payload,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    logConsole.info(`GitHub repo created: ${response.data.full_name}`);
    return {
      fullName: response.data.full_name,
      htmlUrl: response.data.html_url,
    };
  } catch (error: any) {
    logConsole.error("Error creating GitHub repo:", error);
    throw new Error(`GitHubRepoCreationError: ${error.message}`);
  }
}

/**
 * Publishes a project on Vercel by first creating a GitHub repository.
 */
export async function publishProjectOnVercel(inputData: {
  projectName: string;
  projectDescription: string;
  branch?: string;
  createdBy: string;
  sessionId: string;
  characterId: string;
}) {
  const dynamoClient = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(dynamoClient);

  try {
    await sendCharacterMessage(
      inputData.characterId,
      inputData.sessionId,
      docClient,
      `Creating GitHub repository, one second...`
    );

    const repoData = await createGithubRepo(
      inputData.projectName,
      inputData.projectDescription
    );

    await sendGodMessage(inputData.sessionId, docClient, {
      createdBy: inputData.createdBy,
      characterId: inputData.characterId,
      createdAt: new Date().toISOString(),
      eventName: "repo_created",
      metadata: {
        github_repo: repoData.htmlUrl,
      },
    });

    if (process.env.RUN_VERCEL_DEPLOY !== "true") {
      return {
        message: "GitHub repo created successfully.",
        repoUrl: repoData.htmlUrl,
      };
    }

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
        repoId: repoData.fullName,
        branch: inputData.branch || "main",
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
      metadata: {
        live_link: projectUrl,
      },
    });

    return {
      message: "Project published successfully on Vercel",
      repoUrl: repoData.htmlUrl,
      projectUrl: projectUrl,
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

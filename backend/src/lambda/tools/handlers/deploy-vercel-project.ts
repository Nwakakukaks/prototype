// handlers/publish-vercel-project.ts
import axios from "axios";
import { logConsole } from "../../../utils";

/**
 * Helper: Creates a GitHub repository for the project.
 */
async function createGithubRepo(repoName: string, description: string) {
  try {
    const payload = {
      name: repoName,
      description: description,
      private: false,
      auto_init: true, // Initialize repository with a README
    };

    const response = await axios.post("https://api.github.com/user/repos", payload, {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

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
 * Publishes a project on Vercel by first creating a GitHub repository, then triggering a deployment.
 * Called by Risha (or Qwen if needed) after the frontend/backend is ready.
 */
export async function publishProjectOnVercel(inputData: {
  projectName: string;
  projectDescription: string;
  branch?: string;
  createdBy: string;
  sessionId: string;
}) {
  try {
    // Step 1: Create GitHub repository
    const repoData = await createGithubRepo(inputData.projectName, inputData.projectDescription);

    // Step 2: Trigger Vercel deployment using repository details
    const deploymentPayload = {
      name: inputData.projectName,
      gitSource: {
        type: "github",
        repoId: repoData.fullName, 
        branch: inputData.branch || "main",
      },
      // Additional deployment settings can be added here.
    };

    const vercelResponse = await axios.post("https://api.vercel.com/v13/deployments", deploymentPayload, {
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    logConsole.info(`Vercel deployment initiated: ${vercelResponse.data.id}`);
    const projectUrl = vercelResponse.data.url;

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

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import axios from "axios";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  logConsole,
  sendCharacterMessage, 
  sendGodMessage,
} from "../../../utils";

const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });
const s3Client = new S3Client();
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export async function createImage({
  createdBy,
  characterId,
  sessionId,
  imageName,
  prompt,
}: {
  createdBy: string;
  characterId: string;
  sessionId: string;
  imageName: string;
  prompt: string;
}) {
  logConsole.info("Starting image creation process", {
    createdBy,
    characterId,
    sessionId,
  });
  logConsole.info("Using prompt:", prompt);

  await sendCharacterMessage(
    characterId,
    sessionId,
    docClient,
    `Drawing logo for our project, one second...`
  );

  // Construct request payload
  const requestBody = {
    taskType: "TEXT_IMAGE",
    textToImageParams: {
      text: prompt,
    },
    imageGenerationConfig: {
      numberOfImages: 1,
      height: 1024,
      width: 1024,
      cfgScale: 8.0,
      seed: Math.floor(Math.random() * 1000000),
    },
  };
  logConsole.info(
    "Constructed request body for image generation:",
    requestBody
  );

  try {
    logConsole.info("Invoking Bedrock model:", getModelId());
    const command = new InvokeModelCommand({
      modelId: getModelId(),
      contentType: "application/json",
      body: JSON.stringify(requestBody),
    });

    logConsole.info("Sending request to Bedrock...");
    const response = await bedrockClient.send(command);
    if (!response.body)
      throw new Error("Failed to invoke model: No response body.");

    logConsole.info("Successfully received response from Bedrock");
    const { images } = JSON.parse(response.body.transformToString()) as {
      images: string[];
    };
    if (!images || images.length === 0) throw new Error("No images generated.");

    // Define S3 bucket and key using standardized format
    const bucketName = process.env.IMAGE_FILE_S3_BUCKET_NAME as string;
    const baseKey = `character-${createdBy}-${sessionId}-${characterId}`;
    const imageKey = `${baseKey}/image.png`;
    const thumbnailKey = `${baseKey}/thumbnail.png`;

    logConsole.info("Preparing to upload to S3", { bucketName, imageKey });

    // Upload image to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: imageKey,
        Body: Buffer.from(images[0], "base64"),
        ContentEncoding: "base64",
        ContentType: "image/png",
      })
    );
    logConsole.info("Successfully uploaded main image to S3");

    // Upload thumbnail
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: thumbnailKey,
        Body: Buffer.from(images[0], "base64"),
        ContentEncoding: "base64",
        ContentType: "image/png",
      })
    );
    logConsole.info("Successfully uploaded thumbnail to S3");
    const url = await createPresignedUrl(imageKey);

    // where the notification events are called / sent
    await sendGodMessage(sessionId, docClient, {
      createdBy,
      characterId,
      createdAt: new Date().toISOString(),
      eventName: "image_created",
      metadata: {},
    });

    await sendCharacterMessage(
      characterId,
      sessionId,
      docClient,
      `Okay i'll send it to the Office so you can see it.`
    );

    logConsole.info("Image generation and upload complete", {
      imageName,
      imageKey,
    });
    return {
      message: `Image created successfully with imageKey: ${imageKey} and NFTName: ${imageName}`,
      imageName,
      imageKey,
      url,
      description: prompt,
    };
  } catch (error) {
    await sendCharacterMessage(
      characterId,
      sessionId,
      docClient,
      `I'm sorry, but I encountered an error while creating your image. Please try again.`
    );
    logConsole.error("Error in image creation process:", error);
    throw new Error(`Image creation failed: ${error}`);
  }
}

const createPresignedUrl = async (imageKey: string): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: process.env.IMAGE_FILE_S3_BUCKET_NAME as string,
    Key: imageKey,
  });
  const url = await getSignedUrl(s3Client, command, { expiresIn: 86400 }); // 86400 seconds = 24 hours
  return url;
};

const getModelId = () => {
  return "amazon.titan-image-generator-v2:0";
};


export async function createPad19Listing(inputData: {
  name: string;
  description: string;
  logo: string;
  link: string;
  requester: string;
  users: string;
  stars: number;
  launchedAt: string;
  status: string;
  metrics: { dau: string; revenue: string };
  createdBy: string;
  characterId: string;
  sessionId: string;
}) {
  try {
    
    await sendCharacterMessage(
      inputData.characterId,
      inputData.sessionId,
      docClient,
      `listing project on pad19, one second...`
    );

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const apiUrl = `${supabaseUrl}/rest/v1/pad19_listings`;

    // Post the new listing to Supabase
    const response = await axios.post(apiUrl, inputData, {
      headers: {
        apikey: supabaseAnonKey!,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
    });

    logConsole.info(`Pad19 listing created: ${JSON.stringify(response.data)}`);

    
    await sendGodMessage(inputData.sessionId, docClient, {
      createdBy: inputData.createdBy,
      characterId: inputData.characterId,
      createdAt: new Date().toISOString(),
      eventName: "listed_on_pad19",
      metadata: {
        Pad19_link: 'http:localhost:3000/pad19', // change to live link 
      },
    });

    return {
      message: "Pad19 listing created successfully",
      data: 'http:localhost:3000/pad19',
    };
  } catch (error: any) {
    logConsole.error("Error creating Pad19 listing:", error);
    return {
      error: error.name || "Pad19ListingCreationError",
      message: error.message,
    };
  }
}

/**
 * Interface for the input data of the CreateInterface tool
 */
export interface CreateInterfaceInput {
  designSpec: string;
  framework: string;
  componentType: "Page";
  styleFramework: string;
  responsive: boolean;
  darkMode: boolean;
  createdBy: string;
  characterId: string;
  sessionId: string;
}

/**
 * Interface for the response structure
 */
export interface InterfaceResult {
  message: string;
  code: InterfaceCode;
  error?: string;
}

/**
 * Interface for the code structure returned to the frontend
 */
export interface InterfaceCode {
  fileName: string;
  language: string;
  content: string;
  framework: string;
  styleFramework: string;
  componentType: string;
}

/**
 * Creates a UI interface from design specifications by calling the Grok API.
 * Generates Next.js code styled with TailwindCSS in a single-page component.
 */
export async function createInterface(
  inputData: CreateInterfaceInput
): Promise<InterfaceResult> {
  try {
    // Send initial message to character
    await sendCharacterMessage(
      inputData.characterId,
      inputData.sessionId,
      docClient,
      `On it, creating the interface from Pearl's designs...`
    );

    const promptSystem = `
You are an expert UI developer proficient in Next.js and TailwindCSS. Your task is to generate a single-page UI interface as a complete, self-contained React component. The output should be formatted as valid Next.js code (TypeScript) using TailwindCSS for styling. The code must begin with the 'use client' directive and import React. It must include a header, a main body, and a footer. Below is an example of the expected formatting:

'use client';
import React from 'react';

export default function Page() {
  return (
    <div className="flex flex-col min-h-screen">
      <header>
        {/* Header content */}
      </header>
      <main>
        {/* Main content */}
      </main>
      <footer>
        {/* Footer content */}
      </footer>
    </div>
  );
}

Ensure your generated code follows this format exactly. Do not include any commentary or additional text—output only the code.
    `;

    const promptUser = `Generate a complete page component based on the following design specifications:

    - Framework: ${inputData.framework || "Next.js"}
    - Component Type: ${inputData.componentType || "Page"}
    - Style Framework: ${inputData.styleFramework || "TailwindCSS"}
    - Responsive: ${inputData.responsive !== false ? "Yes" : "No"}
    - Dark Mode: ${inputData.darkMode ? "Yes" : "No"}
    
    Detailed Design Specification:
    ${inputData.designSpec}
    
    The generated code must be a self-contained, standalone React component that begins with the 'use client' directive and includes all necessary imports. The component should include a header, a main section, and a footer. Output only the code, without any commentary.`;

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      throw new Error("XAI_API_KEY environment variable is not set");
    }

    // Call the Grok Chat API using fetch
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: promptSystem },
            { role: "user", content: promptUser },
          ],
          model: "llama-3.3-70b-versatile",
          stream: false,
          temperature: 0,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const generatedCode = data.choices[0].message.content;

    if (!generatedCode) {
      throw new Error("No code was generated by the Grok API");
    }

    // Format the code result
    const codeResult: InterfaceCode = {
      fileName: "Page.tsx",
      language: "typescript",
      content: generatedCode,
      framework: inputData.framework || "Next.js",
      styleFramework: inputData.styleFramework || "TailwindCSS",
      componentType: inputData.componentType || "Page",
    };

    await sendGodMessage(inputData.sessionId, docClient, {
      createdBy: inputData.createdBy,
      characterId: inputData.characterId,
      createdAt: new Date().toISOString(),
      eventName: "interface_created",
      metadata: {
        code: codeResult,
      },
    });

    logConsole.info(codeResult);

    return {
      message: "UI interface code generated successfully",
      code: codeResult,
    };
  } catch (error: any) {
    logConsole.error("Error generating interface code:", error);
    return {
      message: `Failed to generate interface code: ${error.message}`,
      code: {
        fileName: "Main.tsx",
        language: "typescript",
        content: "",
        framework: inputData.framework || "Next.js",
        styleFramework: inputData.styleFramework || "TailwindCSS",
        componentType: inputData.componentType || "Page",
      },
      error: error.name || "InterfaceGenerationError",
    };
  }
}
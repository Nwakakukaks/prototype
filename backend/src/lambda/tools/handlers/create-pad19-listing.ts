import axios from "axios";
import { logConsole, sendCharacterMessage, sendGodMessage } from "../../../utils";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

/**
 * Creates a new project idea listing in Supabase for PAD19.
 * Called by Pearl after breaking down idea into an MVP.
 */
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

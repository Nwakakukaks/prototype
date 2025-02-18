import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { logConsole } from "../utils";
import { createItem, getItem } from './dynamo_v3';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sqsClient = new SQSClient({});

const TABLE_NAME = process.env.CORE_TABLE_NAME as string;
const TTL_DURATION = 3600; // in seconds

interface AgentRequest {
  userId: string;
  query: string;
  contextData?: {
    walletAddress?: string;
    tokenAddress?: string;
    chainId?: string;
  };
}

interface InvokeModelPayload {
  connectionId: string;
  stage: string;
  domainName: string;
  chatMode: 'RECURSIVE' | 'STANDARD';
  sendersWalletAddress: string;
  createdBy: string;
  characterId: string;
  sessionId: string;
  temperature: number;
  data: string;
  maxTokens: number;
  topP: number;
}

export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  logConsole.info('Received event:', JSON.stringify(event, null, 2));
  
  try {
    // Extract user ID from JWT claims
    const userId = event.requestContext.authorizer?.jwt.claims.sub as string;
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized: User ID not found in token' })
      };
    }
    
    // Check if this is a GET request to /v1/callAgent
    if (event.httpMethod === 'GET' && event.path === '/v1/callAgent') {
      // Parse query parameters
      const query = event.queryStringParameters?.query || '';
      const walletAddress = event.queryStringParameters?.walletAddress;
      const tokenAddress = event.queryStringParameters?.tokenAddress;
      const customChainId = event.queryStringParameters?.chainId || process.env.CHAIN_ID;
      
      if (!query) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Missing required parameter: query' })
        };
      }
      
      // Create a unique session ID for this interaction
      const sessionId = uuidv4();
      const requestId = uuidv4();
      const timestamp = new Date().toISOString();
      const unixTimestampInMillis = Math.floor(Date.now());
      
      // Prepare message for AI processing
      const message = `
        <metadata>
          <created_by>${userId}</created_by>
          <session_id>${sessionId}</session_id>
          <character_id>User</character_id>
          <senders_wallet_address>${walletAddress || ''}</senders_wallet_address>
        </metadata>
        
        <message>${query}</message>
      `;
      
      // Create request record in DynamoDB
      const agentRequest: AgentRequest = {
        userId,
        query,
        contextData: {
          walletAddress,
          tokenAddress,
          chainId: customChainId
        }
      };
      
      // Store the request in DynamoDB for tracking
      await createItem(
        `USER#${userId}`,
        `AGENT_REQUEST#${requestId}`,
        {
          requestId,
          userId,
          query,
          contextData: agentRequest.contextData,
          status: 'PENDING',
          createdAt: timestamp,
          updatedAt: timestamp,
          ttl: Math.floor(Date.now() / 1000) + TTL_DURATION
        },
        TABLE_NAME,
        docClient
      );
      
      // Prepare payload for SQS
      const payload: InvokeModelPayload = {
        connectionId: 'API-' + requestId, // Special connection ID format for API requests
        stage: process.env.STAGE || 'prod',
        domainName: process.env.DOMAIN_NAME || '',
        chatMode: 'STANDARD', // Using standard mode for API calls
        sendersWalletAddress: walletAddress || '',
        createdBy: userId,
        characterId: 'User', // Default character ID for API requests
        sessionId,
        temperature: 0, // Default temperature
        data: query,
        maxTokens: 4000, // Default max tokens
        topP: 0.9, // Default top-p
      };
      
      // Send message to SQS for processing
      const send = await sqsClient.send(new SendMessageCommand({
        QueueUrl: process.env.SQS_QUEUE_URL,
        MessageBody: JSON.stringify(payload)
      }));
      
      logConsole.info(`Sent message to SQS: ${send.MessageId}`);
      
      // Return a response to the client
      return {
        statusCode: 200,
        body: JSON.stringify({
          requestId,
          sessionId,
          status: 'PENDING',
          message: 'Agent request received and is being processed',
          estimatedProcessingTime: '5-10 seconds'
        })
      };
    }
    
    // Handle unsupported requests
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'An error occurred while processing your request',
        errorId: uuidv4()
      })
    };
  }
};
import * as cdk from "aws-cdk-lib";
import { aws_apigatewayv2, Duration } from "aws-cdk-lib";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import { WebSocketStage } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpJwtAuthorizer } from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import {
  HttpLambdaIntegration,
  WebSocketLambdaIntegration,
} from "aws-cdk-lib/aws-apigatewayv2-integrations";
import {
  AttributeType,
  BillingMode,
  StreamViewType,
  Table,
  TableEncryption,
} from "aws-cdk-lib/aws-dynamodb";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import "dotenv/config";

export class ProtoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Log all environment variables to help debug which ones are missing
    console.log("Environment variables:");
    console.log("CHAIN_ID:", process.env.CHAIN_ID);
    console.log("ANTHROPIC_API_KEY:", process.env.ANTHROPIC_API_KEY);
    console.log("ELECTRO_RPC_URL:", process.env.ELECTRO_RPC_URL);
    console.log(
      "UNISWAP_V2_ROUTER_ADDRESS:",
      process.env.UNISWAP_V2_ROUTER_ADDRESS
    );
    console.log("DOMAIN_NAME:", process.env.DOMAIN_NAME);
    console.log("STAGE:", process.env.STAGE);
    console.log("EXPLORER_API_KEY:", process.env.EXPLORER_API_KEY);
    console.log("WETH_ADDRESS:", process.env.WETH_ADDRESS);
    console.log("USDC_ADDRESS:", process.env.USDC_ADDRESS);
    console.log("TWITTER_APP_KEY:", process.env.TWITTER_APP_KEY);
    console.log("TWITTER_APP_SECRET:", process.env.TWITTER_APP_SECRET);
    console.log("TWITTER_ACCESS_TOKEN:", process.env.TWITTER_ACCESS_TOKEN);
    console.log("TWITTER_ACCESS_SECRET:", process.env.TWITTER_ACCESS_SECRET);
    console.log(
      "READ_TWITTER_ACCESS_APP_KEY:",
      process.env.READ_TWITTER_ACCESS_APP_KEY
    );
    console.log(
      "READ_TWITTER_ACCESS_APP_SECRET:",
      process.env.READ_TWITTER_ACCESS_APP_SECRET
    );
    console.log(
      "READ_TWITTER_ACCESS_ACCESS_TOKEN:",
      process.env.READ_TWITTER_ACCESS_ACCESS_TOKEN
    );
    console.log(
      "READ_TWITTER_ACCESS_ACCESS_SECRET:",
      process.env.READ_TWITTER_ACCESS_ACCESS_SECRET
    );

    const requiredEnvVars = [
      "CHAIN_ID",
      "ELECTRO_RPC_URL",
      "UNISWAP_V2_ROUTER_ADDRESS",
      "STAGE",
      "EXPLORER_API_KEY",
      "WETH_ADDRESS",
      "DOMAIN_NAME",
      "TWITTER_APP_KEY",
      "TWITTER_APP_SECRET",
      "TWITTER_ACCESS_TOKEN",
      "TWITTER_ACCESS_SECRET",
      "READ_TWITTER_ACCESS_APP_KEY",
      "READ_TWITTER_ACCESS_APP_SECRET",
      "READ_TWITTER_ACCESS_ACCESS_TOKEN",
      "READ_TWITTER_ACCESS_ACCESS_SECRET",
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );
    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(", ")}`
      );
    }

    const emptyVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]?.trim()
    );
    if (emptyVars.length > 0) {
      throw new Error(
        `These environment variables are empty: ${emptyVars.join(", ")}`
      );
    }

    console.log(`Deploying for chain id: ${process.env.CHAIN_ID}`);

    const bedrockAccess = new PolicyStatement({
      actions: ["bedrock:Retrieve", "bedrock:Invoke*"],
      resources: ["*"],
    });

    // The code that defines your stack goes here
    const coreTable = new Table(this, "CoreTable", {
      partitionKey: { name: "PK", type: AttributeType.STRING },
      sortKey: { name: "SK", type: AttributeType.STRING },
      encryption: TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: "ttl",
      stream: StreamViewType.NEW_IMAGE,
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    const httpApi = new cdk.aws_apigatewayv2.HttpApi(this, "vOneApi", {
      apiName: "vOneApi",
      description: "API for versionOne",
      corsPreflight: {
        allowCredentials: false,
        allowHeaders: ["Authorization", "Content-Type", "X-Requested-With"],
        maxAge: cdk.Duration.minutes(10),
        allowMethods: [
          cdk.aws_apigatewayv2.CorsHttpMethod.OPTIONS,
          cdk.aws_apigatewayv2.CorsHttpMethod.GET,
          cdk.aws_apigatewayv2.CorsHttpMethod.DELETE,
          cdk.aws_apigatewayv2.CorsHttpMethod.PUT,
          cdk.aws_apigatewayv2.CorsHttpMethod.POST,
        ],
        allowOrigins: [
          "http://localhost:3000",
          "https://prototype1.vercel.app",
        ],
      },
      disableExecuteApiEndpoint: false,
    });

    const issuer = "https://many-griffon-15.clerk.accounts.dev";
    const audience = ["aws"];
    const httpApiAuthorizer = new HttpJwtAuthorizer(
      "prodHttpApiAuthorizer",
      issuer,
      {
        jwtAudience: audience,
        identitySource: ["$request.header.Authorization"],
      }
    );

    const chatQueueDLQ = new cdk.aws_sqs.Queue(this, "vOneChatQueueDLQ", {
      visibilityTimeout: Duration.seconds(300),
    });
    const chatQueue = new cdk.aws_sqs.Queue(this, "vOneChatQueue", {
      visibilityTimeout: Duration.seconds(300),
      deadLetterQueue: {
        queue: chatQueueDLQ,
        maxReceiveCount: 1,
      },
    });

    const s3Bucket = new Bucket(this, "vOneS3Bucket");

    // Websockets
    const websocketTable = new Table(this, "vOneWebSocketConnections", {
      partitionKey: { name: "PK", type: AttributeType.STRING },
      sortKey: { name: "SK", type: AttributeType.STRING },
      timeToLiveAttribute: "ttl",
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    const environmentVariables = {
      CORE_TABLE_NAME: coreTable.tableName,
      WSS_TABLE_NAME: websocketTable.tableName,

      // RPC
      ELECTRO_RPC_URL: process.env.ELECTRO_RPC_URL as string,
      ELECTROEUM_RPC_URL: process.env.ELECTROEUM_RPC_URL as string,
      POLYGON_RPC_URL: process.env.POLYGON_RPC_URL as string,

      // API Gateway
      DOMAIN_NAME: process.env.DOMAIN_NAME as string,
      STAGE: process.env.STAGE as string,

      // Tokens
      WETH_ADDRESS: process.env.WETH_ADDRESS as string, // Base Mainnet WETH Address

      // Twitter Read Access (different keys for read and write)
      READ_TWITTER_ACCESS_APP_KEY: process.env
        .READ_TWITTER_ACCESS_APP_KEY as string,
      READ_TWITTER_ACCESS_APP_SECRET: process.env
        .READ_TWITTER_ACCESS_APP_SECRET as string,
      READ_TWITTER_ACCESS_ACCESS_TOKEN: process.env
        .READ_TWITTER_ACCESS_ACCESS_TOKEN as string,
      READ_TWITTER_ACCESS_ACCESS_SECRET: process.env
        .READ_TWITTER_ACCESS_ACCESS_SECRET as string,

      // Explorer
      EXPLORER_API_KEY: process.env.EXPLORER_API_KEY as string,

      // Pinata
      PINATA_API_KEY: process.env.PINATA_API_KEY as string,
      PINATA_SECRET_API_KEY: process.env.PINATA_SECRET_API_KEY as string,
      PINATA_JWT: process.env.PINATA_JWT as string,

      // Twitter
      TWITTER_APP_KEY: process.env.TWITTER_APP_KEY as string,
      TWITTER_APP_SECRET: process.env.TWITTER_APP_SECRET as string,
      TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN as string,
      TWITTER_ACCESS_SECRET: process.env.TWITTER_ACCESS_SECRET as string,

      // CDP
      WALLET_KEY_NAME: process.env.WALLET_KEY_NAME as string,
      WALLET_PRIVATE_KEY: process.env.WALLET_PRIVATE_KEY as string,

      // Chain
      CHAIN_ID: process.env.CHAIN_ID as string,
      UNISWAP_V2_FACTORY_ADDRESS: process.env
        .UNISWAP_V2_FACTORY_ADDRESS as string,
      UNISWAP_V2_ROUTER_ADDRESS: process.env
        .UNISWAP_V2_ROUTER_ADDRESS as string, // https://docs.uniswap.org/contracts/v3/reference/deployments/base-deployments

      // S3
      IMAGE_FILE_S3_BUCKET_NAME: s3Bucket.bucketName,

      // XAI
      XAI_API_KEY: process.env.XAI_API_KEY as string,

      // SQS
      SQS_QUEUE_URL: chatQueue.queueUrl,

      NOTION_TOKEN: process.env.NOTION_TOKEN as string,
      VERCEL_TOKEN: process.env.VERCEL_TOKEN as string,
      NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID as string,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN as string,
    };

    const apiHandler = new NodejsFunction(this, "APIHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handler",
      memorySize: 512,
      timeout: cdk.Duration.seconds(20),
      environment: environmentVariables,
      entry: "src/lambda/api.ts",
    });
    coreTable.grantReadWriteData(apiHandler);

    // Agent Route
    httpApi.addRoutes({
      path: "/v1/callAgent",
      integration: new HttpLambdaIntegration(
        "vOneApiApiIntegration",
        apiHandler
      ),
      methods: [apigatewayv2.HttpMethod.GET],
      authorizer: httpApiAuthorizer,
    });

    // Socket Queue connector
    const chatQueueHandler = new NodejsFunction(this, "vOneChatProcessor", {
      runtime: Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: Duration.seconds(30),
      environment: environmentVariables,
      entry: "src/lambda/queueChatHandler.ts",
      handler: "handler",
    });
    chatQueue.grantSendMessages(chatQueueHandler);
    websocketTable.grantReadWriteData(chatQueueHandler);

    // The core business logic layer that handles agent integration
    const websocketChatProcessorHandler = new NodejsFunction(
      this,
      "vOneWebsocketChatProcessorHandler",
      {
        runtime: Runtime.NODEJS_20_X,
        environment: environmentVariables,
        timeout: Duration.minutes(5),
        memorySize: 512,
        entry: "src/lambda/queueChatExecutor.ts",
        handler: "handler",
      }
    );
    s3Bucket.grantReadWrite(websocketChatProcessorHandler);
    websocketTable.grantReadData(websocketChatProcessorHandler);
    chatQueue.grantConsumeMessages(websocketChatProcessorHandler);
    websocketChatProcessorHandler.addEventSource(
      new cdk.aws_lambda_event_sources.SqsEventSource(chatQueue)
    );

    const websocketIntegration = new WebSocketLambdaIntegration(
      "vOneChatIntegration",
      chatQueueHandler
    );
    const websocketApi = new aws_apigatewayv2.WebSocketApi(
      this,
      "vOneChatWebSocketApi",
      {
        apiName: "ChatWebSocketApi",
        routeSelectionExpression: "$request.body.action",
        description: "WebSocket API for real-time chat of agents",
        disconnectRouteOptions: {
          integration: websocketIntegration,
        },
        connectRouteOptions: {
          integration: websocketIntegration,
        },
      }
    );

    const websocketStage = new WebSocketStage(this, `vOneStage`, {
      webSocketApi: websocketApi,
      stageName: "prod",
      autoDeploy: true,
    });

    const connectionsArns = this.formatArn({
      service: "execute-api",
      resourceName: `${websocketStage.stageName}/POST/*`,
      resource: websocketApi.apiId,
    });

    websocketChatProcessorHandler.addToRolePolicy(
      new PolicyStatement({
        actions: ["execute-api:ManageConnections"],
        resources: [connectionsArns],
      })
    );

    websocketApi.addRoute("sendMessage", {
      integration: new WebSocketLambdaIntegration(
        "SendMessageIntegration",
        chatQueueHandler
      ),
    });

    coreTable.grantReadWriteData(websocketChatProcessorHandler);
    websocketChatProcessorHandler.addToRolePolicy(bedrockAccess);
  }
}

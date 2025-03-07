
# CDK TypeScript Project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Testing 

Please follow these steps to set up and test the environment:

### 1. Prepare Environment Variables
- Copy the sample environment file to create your configuration:
  ```bash
  cp .env.sample .env
  ```
- Open the `.env` file and fill in all the required values.

### 2. Install Project Dependencies
- Install the necessary packages:
  ```bash
  npm install
  ```

### 3. Bootstrap the AWS Environment
- Bootstrap your AWS account to set up the necessary resources for deployment:
  ```bash
  npx cdk bootstrap
  ```

### 4. Deploy the CDK Stack to AWS
- Deploy the stack with the following command:
  ```bash
  npx cdk deploy
  ```

### 5. Verify the Deployment
- Once the deployment is complete, verify that the stack and all associated resources are correctly created by checking the AWS Management Console.


## Useful Commands

- **Build the project:**  
  ```bash
  npm run build
  ```
- **Watch for changes and compile:**  
  ```bash
  npm run watch
  ```
- **Run unit tests:**  
  ```bash
  npm run test
  ```
- **View CloudFormation template:**  
  ```bash
  npx cdk synth
  ```
- **Compare deployed stack with current state:**  
  ```bash
  npx cdk diff
  ```

#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'dotenv/config';
import 'source-map-support/register';
import { SonicStack } from '../lib/backend-stack';

const account = process.env.AWS_ACCOUNT

const app = new cdk.App();
new SonicStack(app, 'SonicStack', {
  env: {
    account: account,
    region: 'sa-east-1',
  }
});
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'dotenv/config';
import 'source-map-support/register';
import { ProtoStack } from '../lib/backend-stack';

const account = process.env.AWS_ACCOUNT

const app = new cdk.App();
new ProtoStack(app, 'ProtoStack', {
  env: {
    account: account,
    region: 'us-east-1',
  }
});
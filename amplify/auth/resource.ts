import { defineAuth } from '@aws-amplify/backend';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as cdk from 'aws-cdk-lib';


/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
});

const stack = new cdk.Stack();
export const userPool = new cognito.UserPool(stack, 'UserPool', {
  selfSignUpEnabled: true,
  signInAliases: { email: true },
  autoVerify: { email: true },
  standardAttributes: {
    email: {
      required: true,
      mutable: false,
    },
  },
});
export const userPoolClient = new cognito.UserPoolClient(stack, 'UserPoolClient', {
  userPool,
});

export const userPoolId = userPool.userPoolId;
export const userPoolClientId = userPoolClient.userPoolClientId;

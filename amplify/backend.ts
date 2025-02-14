import { defineBackend } from '@aws-amplify/backend';
import { Stack } from 'aws-cdk-lib';
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  RestApi,
  MockIntegration,
  PassthroughBehavior,
} from 'aws-cdk-lib/aws-apigateway';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { HelloWorldLambdaStack } from './functions/helloworld/resources';
import { auth } from './auth/resource';

const backend = defineBackend({
  auth,
});

// バックエンドに HelloWorld カスタム Lambda スタックを追加します。
const helloWorldLambdaStack = new HelloWorldLambdaStack(
  backend.createStack('HelloWorldLambdaStack'), 'helloWorldLambdaResource', {
    projectName: 'c-elect-meg-cloud',
    environment: 'poc',
    lambdaProtectedSubnet1: 'subnet-051a99ad5edb338a1',
    lambdaProtectedSubnet2: 'subnet-08809bd4cc0d61ae6',
    lambdaSecurityGroupID: 'sg-043e1d90db0533260',
    lambdaArchiveBucketName: 'wireless-sensing-poc-lambda-archive-ap-northeast-1',
    lambdaArchiveBucketObjectKey: 'lambda_for_snowflake_connect/lambda_function.zip',
    lambdaArchiveObjectVersionID: '385Q2wcOZweFiJzbhH0WtL.iwD8GUqNb',
    snowflakeConnectLayerArn: 'arn:aws:lambda:ap-northeast-1:864981750279:layer:snowflake_connector_layer:4',
    lambdaHandler: 'lambda_function.lambda_handler',
    lambdaMemorySize: 256,
    lambdaTimeout: 30,
    lambdaRuntime: 'python3.9',
    ssmParameterNameForSnowflakePassword: '/snowflake/password',
    ssmParameterNameForSnowflakeAccount: '/snowflake/account',
    ssmParameterNameForSnowflakeUser: '/snowflake/user',
    ssmParameterNameForSnowflakeDatabase: '/snowflake/database',
    ssmParameterNameForSnowflakeSchema: '/snowflake/schema',
  }
);

// 新しいAPIスタックを作成します。
const apiStack = backend.createStack('api-stack');

// API Gateway を作成します。
const api = new RestApi(apiStack, 'ApiGateway', {
  restApiName: 'myRestApi',
  deploy: true,
  deployOptions: {
    stageName: 'dev',
  },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS, // 信頼できるドメインに制限
    allowMethods: Cors.ALL_METHODS, // 必要なメソッドのみ許可
    allowHeaders: Cors.DEFAULT_HEADERS, // 必要なヘッダーのみ許可
  },
});

// Cognito User Pools authorizer を作成します。
const cognitoAuth = new CognitoUserPoolsAuthorizer(apiStack, 'CognitoAuth', {
  cognitoUserPools: [backend.auth.resources.userPool],
});

// Lambda統合を作成します。
const lambdaIntegration = new LambdaIntegration(helloWorldLambdaStack.snowflakeConnectLambda, {
  requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
});

// リソースパスを作成し、Cognito認証を追加します。
const dataPath = api.root.addResource('data');
dataPath.addMethod('GET', lambdaIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuth,
});

// OPTIONSメソッドの追加
dataPath.addMethod('OPTIONS', new MockIntegration({
  integrationResponses: [{
    statusCode: '200',
    responseParameters: {
      'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
      'method.response.header.Access-Control-Allow-Methods': "'GET,OPTIONS'",
      'method.response.header.Access-Control-Allow-Origin': "'*'",
  },
}), {
  methodResponses: [{
    statusCode: '200',
    responseParameters: {
      'method.response.header.Access-Control-Allow-Headers': true,
      'method.response.header.Access-Control-Allow-Methods': true,
      'method.response.header.Access-Control-Allow-Origin': true,
    },
  }],
});

// API GatewayのAPI URLをamplify_outputs.jsonに出力
backend.addOutput({
  custom: {
    apiGatewayInvokeURL: api.url,
  },
});
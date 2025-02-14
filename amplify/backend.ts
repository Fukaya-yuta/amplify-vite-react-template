import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { HelloWorldLambdaStack } from './functions/helloworld/resources';
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  RestApi,
  MockIntegration,
  PassthroughBehavior,
} from "aws-cdk-lib/aws-apigateway";

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

const api = new RestApi(helloWorldLambdaStack, 'ApiGateway', {
  restApiName: `api`,
  description: 'API Gateway for Snowflake Connect Lambda',
});

const lambdaIntegration = new LambdaIntegration(helloWorldLambdaStack.snowflakeConnectLambda, {
  requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
});

const resource = api.root.addResource('data');
resource.addMethod('GET', lambdaIntegration);

// OPTIONSメソッドの追加
resource.addMethod('OPTIONS', new MockIntegration({
  integrationResponses: [{
    statusCode: '200',
    responseParameters: {
      'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
      'method.response.header.Access-Control-Allow-Methods': "'GET,OPTIONS'",
      'method.response.header.Access-Control-Allow-Origin': "'*'",
    },
  }],
  passthroughBehavior: PassthroughBehavior.NEVER,
  requestTemplates: {
    'application/json': '{"statusCode": 200}',
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
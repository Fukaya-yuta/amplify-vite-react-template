import { defineBackend } from '@aws-amplify/backend';
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { LambdaStack } from './functions/lambda/resources';
import { auth } from './auth/resource';
import { VpcStack } from './vpc/vpc-stack';
import { SecurityGroupStack } from './sg/sg-stack';

const backend = defineBackend({
  auth,
});

// VPC Stackの定義
const vpcStack = new VpcStack(backend.createStack('VpcStack'), 'VpcResource', {
    projectName: 'c-elect-meg-cloud',
    environment: 'poc',
    VPCCIDR: '172.16.0.0/16',
    NATPublicSubnetCIDR1: '172.16.0.0/24',
    NATPublicSubnetCIDR2: '172.16.1.0/24',
    LambdaProtectedSubnetCIDR1: '172.16.2.0/24',
    LambdaProtectedSubnetCIDR2: '172.16.3.0/24',
    VPCFlowLogsRetainInDays: 30,
  }
);

// Security Group Stackの定義
const securityGroupStack = new SecurityGroupStack(backend.createStack('SecurityGroupStack'), 'SecurityGroupResource', {
    projectName: 'c-elect-meg-cloud',
    environment: 'poc',
    VPCID: vpcStack.vpcId, // VPC StackからVPC IDを取得
    NATGatewayCIDR: '172.16.0.0/23',
  }
);

const helloWorldLambdaStack = new LambdaStack(
  backend.createStack('LambdaStack'), 'LambdaResource', {
    projectName: 'c-elect-meg-cloud',
    environment: 'poc',
    lambdaProtectedSubnet1: vpcStack.lambdaProtectedSubnet1Id, // VPC StackからSubnet IDを取得
    lambdaProtectedSubnet2: vpcStack.lambdaProtectedSubnet2Id, // VPC StackからSubnet IDを取得
    lambdaSecurityGroupID: securityGroupStack.lambdaSgId, // Security Group StackからSecurity Group IDを取得
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

// API Gateway を作成します。
const apiStack = backend.createStack('api-stack');
const api = new RestApi(apiStack, 'ApiGateway', {
  restApiName: 'myRestApi',
  deploy: true,
  deployOptions: {
    stageName: 'dev',
  },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS,
    allowMethods: Cors.ALL_METHODS,
    allowHeaders: Cors.DEFAULT_HEADERS,
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

// API GatewayのAPI URLをamplify_outputs.jsonに出力
backend.addOutput({
  custom: {
    apiGatewayInvokeURL: api.url,
  },
});

import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { HelloWorldLambdaStack } from './functions/helloworld/resources';

const backend = defineBackend({
  auth,
});

// バックエンドに HelloWorld カスタム Lambda スタックを追加します。
new HelloWorldLambdaStack(
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
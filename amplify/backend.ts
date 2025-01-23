import { defineBackend } from '@aws-amplify/backend';
import { HelloWorldLambdaStack } from './functions/helloworld/resources';

const backend = defineBackend({
  parameters: {
    ProjectName: 'c-elect-meg-cloud2',
    Environment: 'poc',
    LambdaProtectedSubnet1: 'subnet-051a99ad5edb338a1',
    LambdaProtectedSubnet2: 'subnet-08809bd4cc0d61ae6',
    LambdaSecurityGroupID: 'sg-043e1d90db0533260',
    LambdaArchiveBucketName: 'wireless-sensing-poc-lambda-archive-ap-northeast-1',
    LambdaArchiveBucketObjectKey: 'lambda_for_snowflake_connect/lambda_function.zip',
    LambdaArchiveObjectVersionID: '385Q2wcOZweFiJzbhH0WtL.iwD8GUqNb',
    SnowflakeConnectLayerArn: 'arn:aws:lambda:ap-northeast-1:864981750279:layer:snowflake_connector_layer:4',
    LambdaHandler: 'lambda_function.lambda_handler',
    LambdaMemorySize: 256,
    LambdaTimeout: 30,
    LambdaRuntime: 'python3.9',
    SSMParameterNameForSnowflakePassword: '/snowflake/password',
    SSMParameterNameForSnowflakeAccount: '/snowflake/account',
    SSMParameterNameForSnowflakeUser: '/snowflake/user',
    SSMParameterNameForSnowflakeDatabase: '/snowflake/database',
    SSMParameterNameForSnowflakeSchema: '/snowflake/schema',
  },
});

// バックエンドに HelloWorld カスタム Lambda スタックを追加します。
new HelloWorldLambdaStack(
  backend.createStack('HelloWorldLambdaStack'), 'helloWorldLambdaResource', {}
);
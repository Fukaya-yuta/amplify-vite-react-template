import { Stack, StackProps, Duration, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

interface HelloWorldLambdaStackProps extends StackProps {
  projectName: string;
  environment: string;
  lambdaProtectedSubnet1: string;
  lambdaProtectedSubnet2: string;
  lambdaSecurityGroupID: string;
  lambdaArchiveBucketName: string;
  lambdaArchiveBucketObjectKey: string;
  lambdaArchiveObjectVersionID: string;
  snowflakeConnectLayerArn: string;
  lambdaHandler: string;
  lambdaMemorySize: number;
  lambdaTimeout: number;
  lambdaRuntime: string;
  ssmParameterNameForSnowflakePassword: string;
  ssmParameterNameForSnowflakeAccount: string;
  ssmParameterNameForSnowflakeUser: string;
  ssmParameterNameForSnowflakeDatabase: string;
  ssmParameterNameForSnowflakeSchema: string;
}

export class HelloWorldLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props: HelloWorldLambdaStackProps) {
    super(scope, id, props);

    const lambdaRole = new iam.Role(this, 'SnowflakeConnectLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        LambdaAccessForSnowflakeConnect: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['ssm:GetParameter', 'ssm:GetParameters', 'kms:Decrypt'],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['logs:CreateLogGroup'],
              resources: [`arn:aws:logs:${this.region}:${this.account}:*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
              resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/${props.projectName}-${props.environment}-snowflake-connect:*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['ec2:CreateNetworkInterface', 'ec2:DescribeNetworkInterfaces', 'ec2:DeleteNetworkInterface'],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    const snowflakeConnectLambda = new lambda.Function(this, 'SnowflakeConnectLambda', {
      vpc: ec2.Vpc.fromVpcAttributes(this, 'Vpc', {
        vpcId: 'vpc-12345678',
        availabilityZones: ['ap-northeast-1a', 'ap-northeast-1c'],
        publicSubnetIds: [props.lambdaProtectedSubnet1, props.lambdaProtectedSubnet2],
      }),
      vpcSubnets: {
        subnets: [
          ec2.Subnet.fromSubnetId(this, 'Subnet1', props.lambdaProtectedSubnet1),
          ec2.Subnet.fromSubnetId(this, 'Subnet2', props.lambdaProtectedSubnet2),
        ],
      },
      securityGroups: [ec2.SecurityGroup.fromSecurityGroupId(this, 'SecurityGroup', props.lambdaSecurityGroupID)],
      code: lambda.Code.fromBucket(
        s3.Bucket.fromBucketName(this, 'LambdaArchiveBucket', props.lambdaArchiveBucketName),
        props.lambdaArchiveBucketObjectKey,
        props.lambdaArchiveObjectVersionID
      ),
      handler: props.lambdaHandler,
      runtime: lambda.Runtime.PYTHON_3_9,
      memorySize: props.lambdaMemorySize,
      timeout: Duration.seconds(props.lambdaTimeout),
      environment: {
        SNOWFLAKE_USER: props.ssmParameterNameForSnowflakeUser,
        SNOWFLAKE_PASSWORD: props.ssmParameterNameForSnowflakePassword,
        SNOWFLAKE_ACCOUNT: props.ssmParameterNameForSnowflakeAccount,
        SNOWFLAKE_DATABASE: props.ssmParameterNameForSnowflakeDatabase,
        SNOWFLAKE_SCHEMA: props.ssmParameterNameForSnowflakeSchema,
      },
      layers: [lambda.LayerVersion.fromLayerVersionArn(this, 'SnowflakeConnectLayer', props.snowflakeConnectLayerArn)],
      role: lambdaRole,
      allowPublicSubnet: true,
    });

    const api = new apigateway.RestApi(this, 'ApiGateway', {
      restApiName: `${props.projectName}-${props.environment}-api`,
      description: 'API Gateway for Snowflake Connect Lambda',
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(snowflakeConnectLambda, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    const resource = api.root.addResource('data');
    resource.addMethod('GET', lambdaIntegration);

    new CfnOutput(this, 'SnowflakeConnectLambdaArn', {
      value: snowflakeConnectLambda.functionArn,
      exportName: 'SnowflakeConnectLambdaArn',
    });

    new CfnOutput(this, 'ApiGatewayInvokeURL', {
      value: api.url,
      exportName: 'ApiGatewayInvokeURL',
    });
  }
}
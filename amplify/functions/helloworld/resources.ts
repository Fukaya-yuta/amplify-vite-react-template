import { Stack, StackProps, Duration, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface HelloWorldLambdaStackProps extends StackProps {
  projectName: string;
  environment: string;
  lambdaProtectedSubnet1: ec2.ISubnet;
  lambdaProtectedSubnet2: ec2.ISubnet;
  lambdaSecurityGroupID: ec2.ISecurityGroup;
  lambdaArchiveBucketName: string;
  lambdaArchiveBucketObjectKey: string;
  lambdaArchiveObjectVersionID: string;
  snowflakeConnectLayerArn: string;
  lambdaHandler: string;
  lambdaMemorySize: number;
  lambdaTimeout: number;
  lambdaRuntime: lambda.Runtime;
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
        publicSubnetIds: ['subnet-051a99ad5edb338a1', 'subnet-08809bd4cc0d61ae6'],
      }),
      vpcSubnets: {
        subnets: [props.lambdaProtectedSubnet1, props.lambdaProtectedSubnet2],
      },
      securityGroups: [props.lambdaSecurityGroupID],
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
    });

    new CfnOutput(this, 'SnowflakeConnectLambdaArn', {
      value: snowflakeConnectLambda.functionArn,
      exportName: 'SnowflakeConnectLambdaArn',
    });
  }
}
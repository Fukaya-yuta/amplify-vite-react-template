import { Stack, StackProps, CfnOutput, Fn, Tags, Duration } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';

interface VpcStackProps extends StackProps {
    projectName: string;
    environment: string;
    VPCCIDR: string;
    NATPublicSubnetCIDR1: string;
    NATPublicSubnetCIDR2: string;
    LambdaProtectedSubnetCIDR1: string;
    LambdaProtectedSubnetCIDR2: string;
    VPCFlowLogsRetainInDays: number;
}

export class VpcStack extends Stack {
    public readonly vpcId: string;
    public readonly lambdaProtectedSubnet1Id: string;
    public readonly lambdaProtectedSubnet2Id: string;
    public readonly lambdaProtectedSubnet1: ec2.ISubnet;
    public readonly lambdaProtectedSubnet2: ec2.ISubnet;

    constructor(scope: Construct, id: string, props: VpcStackProps) {
        super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'VPC', {
        cidr: props.VPCCIDR,
        enableDnsSupport: true,
        enableDnsHostnames: true,
            maxAzs: 2, // AZの最大数を2に設定
            subnetConfiguration: [], // サブネットは後で個別に作成
    });

    Tags.of(vpc).add('ProjectName', props.projectName);
    Tags.of(vpc).add('Environment', props.environment);

    // Internet Gateway
    const internetGateway = new ec2.CfnInternetGateway(this, 'InternetGateway', {
        tags: [ { key: 'keyname', value: `${props.projectName}-${props.environment}-igw` },
                { key: 'ProjectName', value: props.projectName },
                { key: 'Environment', value: props.environment } ],
    });

    const internetGatewayAttachment = new ec2.CfnVPCGatewayAttachment(this, 'InternetGatewayAttachment', {
        vpcId: vpc.vpcId,
        internetGatewayId: internetGateway.ref,
    });

    // VPC Flow Logs (prd環境のみ)
    if (props.environment === 'prd') {
        const vpcFlowLogGroup = new logs.LogGroup(this, 'VPCFlowLogGroup', {
            logGroupName: `/aws/vpc/flowlogs/${props.projectName}-${props.environment}-vpc`,
            retention: props.VPCFlowLogsRetainInDays,
        });
        const vpcFlowLogsRoleForCWLogs = new iam.Role(this, 'VPCFlowLogsRoleForCWLogs', {
            roleName: `VPCFlowLogsRoleForCWLogs-${props.projectName}-${props.environment}`,
            assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
        });
        vpcFlowLogsRoleForCWLogs.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
            ],
            resources: [vpcFlowLogGroup.logGroupArn + ':*'],
        });
        new ec2.FlowLog(this, 'VPCFlowLogToCWLog', {
            resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
            trafficType: ec2.FlowLogTrafficType.ALL,
            destination: ec2.FlowLogDestination.toCloudWatchLogs(vpcFlowLogGroup, vpcFlowLogsRoleForCWLogs),
        });
        // S3 Bucket for Flow Logs
        const vpcFlowLogBucket = new s3.Bucket(this, 'VPCFlowLogBucket', {
            bucketName: `${props.projectName}-${props.environment}-vpc-flowlogs`,
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            lifecycleRules: [
                {
                    transitions: [
                        {
                            storageClass: s3.StorageClass.GLACIER,
                            transitionAfter: Duration.days(365),
                        },
                    ],
                    expiration: cdk.Duration.days(1825),
                    enabled: true,
                },
            ],
        });
        new ec2.FlowLog(this, 'VPCFlowLogsToS3', {
            resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
            trafficType: ec2.FlowLogTrafficType.ALL,
            destination: ec2.FlowLogDestination.toS3(vpcFlowLogBucket),
        });
    }

        // NAT Gateway Subnets and NAT Gateways
        const natPublicSubnets = [];
        const natGateways = [];  // NATゲートウェイを格納する配列を追加
        const numNatGateways = props.environment === 'prd' ? 2 : 1;

        for (let i = 0; i < numNatGateways; i++) {
            const natPublicSubnet = new ec2.Subnet(this, `NATPublicSubnet${i + 1}`, {
                vpcId: vpc.vpcId,
                cidrBlock: i === 0 ? props.NATPublicSubnetCIDR1 : props.NATPublicSubnetCIDR2,
                availabilityZone: cdk.Fn.select(i, cdk.Fn.getAzs(cdk.Stack.of(this).region)),
                mapPublicIpOnLaunch: false,
            });
            Tags.of(natPublicSubnet).add('Name', `${props.projectName}-${props.environment}-pub-natgw-${cdk.Fn.select(2, cdk.Fn.split('-', cdk.Fn.select(i, cdk.Fn.getAzs(cdk.Stack.of(this).region))))}`);
            Tags.of(natPublicSubnet).add('ProjectName', props.projectName);
            Tags.of(natPublicSubnet).add('Environment', props.environment);
            const natGatewayEIP = new ec2.CfnEIP(this, `NATGatewayEIP${i + 1}`, {
                domain: 'vpc',
                tags: [{ key: 'Name', value: `${props.projectName}-${props.environment}-natgw-${cdk.Fn.select(2, cdk.Fn.split('-', cdk.Fn.select(i, cdk.Fn.getAzs(cdk.Stack.of(this).region))))}-eip` },
                { key: 'ProjectName', value: props.projectName },
                { key: 'Environment', value: props.environment }],
            });
            const natGateway = new ec2.CfnNatGateway(this, `NATGateway${i + 1}`, {
                subnetId: natPublicSubnet.subnetId,
                allocationId: natGatewayEIP.attrAllocationId,
            });
            Tags.of(natGateway).add('Name', `${props.projectName}-${props.environment}-natgw-${cdk.Fn.select(2, cdk.Fn.split('-', cdk.Fn.select(i, cdk.Fn.getAzs(cdk.Stack.of(this).region))))}`);
            Tags.of(natGateway).add('ProjectName', props.projectName);
            Tags.of(natGateway).add('Environment', props.environment);
            natPublicSubnets.push(natPublicSubnet);
            natGateways.push(natGateway); // 作成したNATゲートウェイを配列に格納
        }

        // Protected Subnets and Route Tables
        const lambdaProtectedSubnet1 = new ec2.Subnet(this, 'LambdaProtectedSubnet1', {
            vpcId: vpc.vpcId,
            cidrBlock: props.LambdaProtectedSubnetCIDR1,
            availabilityZone: cdk.Fn.select(0, cdk.Fn.getAzs(cdk.Stack.of(this).region)),
            mapPublicIpOnLaunch: false,
        });
        Tags.of(lambdaProtectedSubnet1).add('Name', `${props.projectName}-${props.environment}-prot-lambda-${cdk.Fn.select(2, cdk.Fn.split('-', cdk.Fn.select(0, cdk.Fn.getAzs(cdk.Stack.of(this).region))))}`);
        Tags.of(lambdaProtectedSubnet1).add('ProjectName', props.projectName);
        Tags.of(lambdaProtectedSubnet1).add('Environment', props.environment);
        const protectedRouteTable1 = new ec2.CfnRouteTable(this, 'ProtectedRouteTable1', {
            vpcId: vpc.vpcId,
        });
        Tags.of(protectedRouteTable1).add('Name', `${props.projectName}-${props.environment}-protected-rtb-${cdk.Fn.select(2, cdk.Fn.split('-', cdk.Fn.select(0, cdk.Fn.getAzs(cdk.Stack.of(this).region))))}`);
        Tags.of(protectedRouteTable1).add('ProjectName', props.projectName);
        Tags.of(protectedRouteTable1).add('Environment', props.environment);
        new ec2.CfnSubnetRouteTableAssociation(this, 'LambdaProtectedSubnetAssociation1', {
            subnetId: lambdaProtectedSubnet1.subnetId,
            routeTableId: protectedRouteTable1.ref,
        });
        const protectedRouteTable2 = new ec2.CfnRouteTable(this, 'ProtectedRouteTable2', {
            vpcId: vpc.vpcId,
        });
        Tags.of(protectedRouteTable2).add('Name', `${props.projectName}-${props.environment}-protected-rtb-${cdk.Fn.select(2, cdk.Fn.split('-', cdk.Fn.select(1, cdk.Fn.getAzs(cdk.Stack.of(this).region))))}`);
        Tags.of(protectedRouteTable2).add('ProjectName', props.projectName);
        Tags.of(protectedRouteTable2).add('Environment', props.environment);
        const lambdaProtectedSubnet2 = new ec2.Subnet(this, 'LambdaProtectedSubnet2', {
            vpcId: vpc.vpcId,
            cidrBlock: props.LambdaProtectedSubnetCIDR2,
            availabilityZone: cdk.Fn.select(1, cdk.Fn.getAzs(cdk.Stack.of(this).region)),
            mapPublicIpOnLaunch: false,
        });
        Tags.of(lambdaProtectedSubnet2).add('Name', `${props.projectName}-${props.environment}-prot-lambda-${cdk.Fn.select(2, cdk.Fn.split('-', cdk.Fn.select(1, cdk.Fn.getAzs(cdk.Stack.of(this).region))))}`);
        Tags.of(lambdaProtectedSubnet2).add('ProjectName', props.projectName);
        Tags.of(lambdaProtectedSubnet2).add('Environment', props.environment);
        new ec2.CfnSubnetRouteTableAssociation(this, 'LambdaProtectedSubnetAssociation2', {
            subnetId: lambdaProtectedSubnet2.subnetId,
            routeTableId: protectedRouteTable2.ref,
        });

        // Public Route Table
        const publicRouteTable = new ec2.CfnRouteTable(this, 'PublicRouteTable', {
            vpcId: vpc.vpcId,
        });
        Tags.of(publicRouteTable).add('Name', `${props.projectName}-${props.environment}-public-rtb`);
        Tags.of(publicRouteTable).add('ProjectName', props.projectName);
        Tags.of(publicRouteTable).add('Environment', props.environment);
        new ec2.CfnRoute(this, 'PublicRoute', {
            routeTableId: publicRouteTable.attrRouteTableId,
            destinationCidrBlock: '0.0.0.0/0',
            gatewayId: internetGateway.ref,
        }).addDependency(internetGatewayAttachment);

        new ec2.CfnSubnetRouteTableAssociation(this, 'NATGatewayPublicSubnetAssociation1', {
            subnetId: natPublicSubnets[0].subnetId,
            routeTableId: publicRouteTable.attrRouteTableId,
        });

        if (numNatGateways > 1) {  // NATゲートウェイが2つの場合のみ関連付け
            new ec2.CfnSubnetRouteTableAssociation(this, 'NATGatewayPublicSubnetAssociation2', {
                subnetId: natPublicSubnets[1].subnetId,
                routeTableId: publicRouteTable.attrRouteTableId,
            });
        }

        new ec2.CfnRoute(this, 'NATGatewayAssociationForProtectedRoute1', {
            routeTableId: protectedRouteTable1.attrRouteTableId,
            destinationCidrBlock: '0.0.0.0/0',
            natGatewayId: natGateways[0].attrNatGatewayId,  // 最初のNATゲートウェイを使用
        });

        if (numNatGateways > 1) {  // NATゲートウェイが2つの場合のみルートを追加
            new ec2.CfnRoute(this, 'NATGatewayAssociationForProtectedRoute2', {
                routeTableId: protectedRouteTable2.attrRouteTableId,
                destinationCidrBlock: '0.0.0.0/0',
                natGatewayId: natGateways[1].attrNatGatewayId,  // 2番目のNATゲートウェイを使用
            });
        }

        this.vpcId = vpc.vpcId;
        this.lambdaProtectedSubnet1Id = lambdaProtectedSubnet1.subnetId;
        this.lambdaProtectedSubnet2Id = lambdaProtectedSubnet2.subnetId;
        this.lambdaProtectedSubnet1 = lambdaProtectedSubnet1;
        this.lambdaProtectedSubnet2 = lambdaProtectedSubnet2;
    }
}
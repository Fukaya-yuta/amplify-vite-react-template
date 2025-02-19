import { Stack, StackProps, Fn } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface SecurityGroupStackProps extends StackProps {
    projectName: string;
    environment: string;
    VPCID: string;
    NATGatewayCIDR: string;
}
    
export class SecurityGroupStack extends Stack {
    public readonly lambdaSgId: string;   
    public readonly lambdaSg: ec2.ISecurityGroup;
    
    constructor(scope: Construct, id: string, props: SecurityGroupStackProps) {
        super(scope, id, props);
        
        const vpc = ec2.Vpc.fromVpcAttributes(this, 'VPC', {
            vpcId: props.VPCID,
            availabilityZones: [Fn.select(0, Fn.getAzs(Stack.of(this).region)),
                                Fn.select(1, Fn.getAzs(Stack.of(this).region))],
            privateSubnetIds: []
        })
    
        const lambdaSG = new ec2.SecurityGroup(this, 'LambdaSG', {
            securityGroupName: `${props.projectName}-${props.environment}-lambda-sg`,
            vpc: vpc,
            description: 'Security group for Lambda functions',
            allowAllOutbound: true,
        });
    
        lambdaSG.addIngressRule(ec2.Peer.ipv4(props.NATGatewayCIDR), ec2.Port.tcp(443), 'Allow inbound from NAT Gateway');
        this.lambdaSgId = lambdaSG.securityGroupId;
        this.lambdaSg = lambdaSG;
    }
}

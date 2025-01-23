import { CfnOutput、Stack、StackProps、Duration } from  'aws-cdk-lib' ; 
import { Construct } from  'constructs' ; 
import * as lambda from  'aws-cdk-lib/aws-lambda' ; 
import * as path from  'path' ; 

export  class  HelloWorldLambdaStack  extends  Stack { 
    constructor ( scope: Construct, id: string , props?: StackProps ) { 
        super (scope, id, props); 

    // Lambda 関数を定義します
    const helloWorldFunction = new lambda. Function ( this , 'HelloWorldFunction' , { 
      runtime : lambda. Runtime . PYTHON_3_9 , // ランタイムを指定します
      handler : 'index.handler' ,            // ハンドラー関数を指定します
        code : lambda. Code . fromAsset ( './amplify/functions/helloworld' ), 
        functionName : 'HelloWorldFunction' , 
        description : 'This is my custom Lambda function created using CDK' , 
        timeout : Duration . seconds ( 30 ), 
        memorySize : 128 , 
        environment : { 
        TEST : 'test' , 
        }, 
    }); 

    // Lambda 関数の ARN を出力します
    new  CfnOutput ( this , 'HellowWorldFunctionArn' , { 
        value : helloWorldFunction. functionArn , 
        exportName : 'HelloWorldFunctionArn' , 
    }); 
    } 
}
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { HelloWorldLambdaStack } from  './custom-functions/resources' ; 

defineBackend({
  auth,
});

// バックエンドに HelloWorld カスタム Lambda スタックを追加します。
new  HelloWorldLambdaStack ( 
  backend.createStack ( 'HelloWorldLambdaStack' ), 'helloWorldLambdaResource' ,   {} );
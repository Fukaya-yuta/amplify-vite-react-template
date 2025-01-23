import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { sayHelloFunctionHandler } from './functions/say-hello/resource';

defineBackend({
  auth,
  sayHelloFunctionHandler,
});

import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { sayHello } from './functions/say-hello/resource';

defineBackend({
  auth,
  sayHello
});

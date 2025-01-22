import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { hogeFunctionHandler } from './functions/say-hello/resource'

defineBackend({
  auth,
  hogeFunctionHandler,
});

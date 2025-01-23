import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { hogeFunctionHandler } from './functions/say-hello/resource'; // 関数名を修正

defineBackend({
  auth,
  hogeFunctionHandler, // 関数名を修正
});

import { Construct } from 'constructs';
import { Function, FunctionProps, Runtime, Code, DockerImage } from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';
import { execSync } from 'child_process';
import * as path from 'path';
import { defineFunction } from '@aws-amplify/backend';

const functionDir = path.dirname(fileURLToPath(import.meta.url));

export const sayHelloFunctionHandler = defineFunction(
  (scope: Construct) =>
    new Function(scope, "say-hello", {
      handler: "index.handler",
      runtime: Runtime.PYTHON_3_9,
      timeout: Duration.seconds(20),
      code: Code.fromAsset(functionDir, {
        bundling: {
          image: DockerImage.fromRegistry("dummy"),
          local: {
            tryBundle(outputDir: string) {
              execSync(
                `python3 -m pip install -r ${path.join(functionDir, "requirements.txt")} -t ${path.join(outputDir)} --platform manylinux2014_x86_64 --only-binary=:all:`
              );
              execSync(`cp -r ${functionDir}/* ${path.join(outputDir)}`);
              return true;
            },
          },
        },
      }),
    } as FunctionProps)
);
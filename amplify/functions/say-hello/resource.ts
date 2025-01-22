import { Construct } from 'constructs'; // 追加
import { FunctionProps } from 'aws-cdk-lib/aws-lambda'; // 追加

export const sayHelloFunctionHandler = defineFunction(
  (scope: Construct) => // 型を指定
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
    } as FunctionProps) // 型を指定
);
import { SecretValue, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Artifact, Pipeline } from "aws-cdk-lib/aws-codepipeline";
import {
  CodeBuildAction,
  GitHubSourceAction,
} from "aws-cdk-lib/aws-codepipeline-actions";
import {
  BuildSpec,
  LinuxBuildImage,
  PipelineProject,
} from "aws-cdk-lib/aws-codebuild";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { FrontendEnvVars } from "../config";

export interface CiCdS3FrontendProps extends StackProps {
  readonly distributionId: string;
  readonly bucket: string;
  readonly repo: string;
  readonly repoOwner: string;
  readonly repoBranch: string;
  readonly gitTokenSecretPath: string;
  readonly environmentVariables: FrontendEnvVars;
  readonly account: string;
  readonly nodejs: string;
  readonly projectFolderName: string;
}

/**
 * Infrastructure that creates a CI/CD pipeline to deploy a static site to an S3 bucket.
 * The pipeline checks out the source code from a GitHub repository, builds it, deploys it to the S3 bucket and invalidates the CloudFront distribution.
 */
export class CiCdS3Frontend extends Construct {
  constructor(scope: Construct, id: string, props: CiCdS3FrontendProps) {
    super(scope, id);

    // Create the source action
    const github_token = SecretValue.secretsManager(props.gitTokenSecretPath);
    const sourceOutput = new Artifact("SourceOutput");
    const sourceAction = new GitHubSourceAction({
      actionName: "SOURCE",
      owner: props.repoOwner,
      repo: props.repo,
      branch: props.repoBranch,
      oauthToken: github_token,
      output: sourceOutput,
    });

    // Create the build action
    const webBuildProject = this.createBuildProject(
      props.bucket,
      props.distributionId,
      props.bucket,
      props.account,
      props.nodejs, // "16.x.x", "16.17.0"
      props.projectFolderName,
      props.environmentVariables
    );
    const buildAction = new CodeBuildAction({
      actionName: "BUILD_DEPLOY",
      project: webBuildProject,
      input: sourceOutput,
    });

    // Create the pipeline
    const pipelineName = `${props.bucket}-pipeline`;
    new Pipeline(this, pipelineName, {
      pipelineName: pipelineName,
      stages: [
        {
          stageName: "Source",
          actions: [sourceAction],
        },
        {
          stageName: "Build",
          actions: [buildAction],
        },
      ],
    });
  }

  private createBuildProject(
    bucketName: string,
    distributionId: string,
    staticWebsiteBucket: string,
    account: string,
    nodejs: string, // "16" ...
    projectFolderName: string,
    environmentVariables: FrontendEnvVars
  ) {
    const buildProject = new PipelineProject(
      this,
      `${bucketName}-build-project`,
      {
        environmentVariables,
        buildSpec: BuildSpec.fromObject({
          version: "0.2",
          phases: {
            install: {
              "runtime-versions": {
                nodejs,
              },
              commands: [`cd ${projectFolderName}`, "npm install"],
            },
            build: {
              commands: ["npm run build"],
            },
            post_build: {
              commands: [
                `aws s3 sync "dist" "s3://${staticWebsiteBucket}" --delete`,
                `aws cloudfront create-invalidation --distribution-id ${distributionId} --paths "/*"`,
              ],
            },
          },
        }),
        environment: {
          buildImage: LinuxBuildImage.AMAZON_LINUX_2_4,
        },
      }
    );

    const codeBuildS3ListObjectsPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        "s3:GetObject",
        "s3:GetBucketLocation",
        "s3:ListBucket",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl",
      ],
      resources: [
        `arn:aws:s3:::${staticWebsiteBucket}`,
        `arn:aws:s3:::${staticWebsiteBucket}/*`,
      ],
    });
    buildProject.role?.addToPrincipalPolicy(codeBuildS3ListObjectsPolicy);
    const codeBuildCreateInvalidationPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["cloudfront:CreateInvalidation"],
      resources: [
        `arn:aws:cloudfront::${account}:distribution/${distributionId}`,
      ],
    });
    buildProject.role?.addToPrincipalPolicy(codeBuildCreateInvalidationPolicy);

    return buildProject;
  }
}

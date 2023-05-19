import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { IBaseService, ICluster } from 'aws-cdk-lib/aws-ecs';
import { ServiceConfig } from '../config';
import { IRepository } from 'aws-cdk-lib/aws-ecr';

export interface CiCdConstructProps {
  service: ServiceConfig;
  cluster: ICluster;
  repository: IRepository;
  fargateService: IBaseService;
  envName: string;
  gitOwner: string;
  gitBranch: string;
  gitTokenSecretPath: string;
  baseRepo: IRepository;
  gitRepository: string;
}

export class CiCdConstruct extends Construct {
  constructor(scope: Construct, id: string, props: CiCdConstructProps) {
    super(scope, id);
    const {
      service,
      cluster,
      repository,
      fargateService,
      envName,
      gitOwner,
      gitBranch,
      gitTokenSecretPath,
      gitRepository
    } = props;
    // add pipeline

    const gitHubSource = codebuild.Source.gitHub({
      owner: gitOwner,
      repo: gitRepository,
      webhook: true, // optional, default: true if `webhookFilteres` were provided, false otherwise
      webhookFilters: [codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH).andBranchIs(`${gitBranch}`)] // optional, by default all pushes and Pull Requests will trigger a build
    });

    // CODEBUILD - project
    const project = new codebuild.Project(this, `${service.hostname}-project`, {
      projectName: `${envName}-${service.hostname}`,
      source: gitHubSource,
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_2,
        privileged: true
      },
      environmentVariables: {
        CLUSTER_NAME: {
          value: `${cluster.clusterName}`
        },
        ECR_REPO_URI: {
          value: `${repository.repositoryUri}`
        },
        BASE_REPO_URI: {
          value: `${props.baseRepo.repositoryUri}`
        }
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'env',
              'export TAG=${CODEBUILD_RESOLVED_SOURCE_VERSION}',
              '$(aws ecr get-login --no-include-email)'
            ]
          },
          build: {
            commands: [
              'docker pull $BASE_REPO_URI:node-alpine',
              'docker tag $BASE_REPO_URI:node-alpine node:18.14.2-alpine3.17',
              'wget https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem -O db-cert.pem',
              `docker build -t $ECR_REPO_URI:$TAG .`,
              'docker push $ECR_REPO_URI:$TAG'
            ]
          },
          post_build: {
            commands: [
              'echo "In Post-Build Stage"',
              'printf \'[{"name":"' +
                service.hostname +
                '","imageUri":"%s"}]\' $ECR_REPO_URI:$TAG > imagedefinitions.json',
              'pwd; ls -al; cat imagedefinitions.json'
            ]
          }
        },
        artifacts: {
          files: ['imagedefinitions.json']
        }
      })
    });

    props.baseRepo.grantPull(project);

    // ***PIPELINE ACTIONS***

    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'GitHub_Source',
      owner: gitOwner,
      repo: gitRepository,
      branch: gitBranch,
      oauthToken: cdk.SecretValue.secretsManager(gitTokenSecretPath),
      output: sourceOutput
    });

    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'CodeBuild',
      project: project,
      input: sourceOutput,
      outputs: [buildOutput] // optional
    });

    const manualApprovalAction = new codepipeline_actions.ManualApprovalAction({
      actionName: 'Approve'
    });

    const deployAction = new codepipeline_actions.EcsDeployAction({
      actionName: 'DeployAction',
      service: fargateService,
      imageFile: new codepipeline.ArtifactPath(buildOutput, `imagedefinitions.json`)
    });
    // PIPELINE STAGES
    new codepipeline.Pipeline(this, `${service.hostname}-pipeline`, {
      pipelineName: `${envName}-${service.hostname}-pipeline`,
      stages: [
        {
          stageName: 'Source',
          actions: [sourceAction]
        },
        {
          stageName: 'Build',
          actions: [buildAction]
        },
        // {
        //   stageName: "Approve",
        //   actions: [manualApprovalAction],
        // },
        {
          stageName: 'Deploy-to-ECS',
          actions: [deployAction]
        }
      ]
    });

    repository.grantPullPush(project.role!);
    project.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'ecs:DescribeCluster',
          'ecr:GetAuthorizationToken',
          'ecr:BatchCheckLayerAvailability',
          'ecr:BatchGetImage',
          'ecr:GetDownloadUrlForLayer'
        ],
        resources: [`${cluster.clusterArn}`]
      })
    );
  }
}

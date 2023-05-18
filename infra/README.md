# Nightfall CDK

# Prerequisites

- NodeJS
- docker
- aws cli
   1. configure ~/.aws/credentials
   ```
      [xxxxxxx] # profile name for aws credentials
      aws_access_key_id=xxxxxxx
      aws_secret_access_key=xxxxxxx
   ```
   2. configure ~/.aws/config
   ```
      [profile xxxxxxx]
      region = xxxxxxx
      output = json
   ```   
- Github token
   1. Create github token with repo access
      - select "repo"
      - select "admin:repo_hook"
   2. Configure github token with aws cli
- mongodb secrets created

# How to run
- step 1: Setup CDK
   ```
   npm i -g aws-cdk
   npm i 
   ```
- step 2: Run scripts
   1. run ./init.sh  # inits basic configuration. Creates repositoris, building image and store github token into secret manager
   2. run ./<env_name>.sh # it will load envirument variables declared in script and bootstrap application



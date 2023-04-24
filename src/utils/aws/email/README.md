# AWS SES

# when node_env set to local it will use aws sso login

## Configure AWS SSO

Prerequisite: aws-cli

```bash
$ aws configure sso
# SSO session name [None]: mvp-studio
# SSO start URL [None]: https://<your-aws-sso-url>
# SSO Region [None]: eu-central-1
# Select Your AWS Account:
# CLI default client Region [eu-central-1]: eu-central-1
# CLI default output format [json]: json


export AWS_PROFILE=mvp-studio
```

## how to use

```js
const email = new SesService();
email.sendTextEmail(['email@gmail.com', 'email1@gmail.com'], 'Test', 'Test');
```

# Dolar-Ar Slack Webhook

## Introduction

This small NodeJS script reads exchange rates from Argentine newspapers and posts them to a Slack webhook.

This version is intended to be hosted serverless in AWS Lambda.


## Testing

Required environment variables:

- `SLACK_WEBHOOK=https://slack-webhook-url/`
- `NODE_ENV=production`
- `STORE_BUCKET=s3-bucket-name`
- `STORE_KEY=file-name.json`

To test it, configure your [AWS credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) and run as follows:

```
npm i
export STORE_BUCKET=s3-bucket-name
export STORE_KEY=file-name.json
node index.js
```

## Publishing

Zip the whole thing in a .zip file and upload it to Lambda. To give permissions to the S3 bucket, you need to edit the IAM role created and add an inline policy like this:

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListAllMyBuckets",
                "s3:GetBucketLocation"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": "s3:*",
            "Resource": [
                "arn:aws:s3:::s3-bucket-name",
                "arn:aws:s3:::s3-bucket-name/*"
            ]
        }
    ]
}
```


That's it. Enjoy!

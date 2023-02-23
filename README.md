# AWS Lambda example using Serverless Framework

## Usage

### Install DynamoDB locally

``` bash
npm run dynamodb
```

### Run Serverless offline

``` bash
npm run start
```

## Deployment

In order to deploy the example, you need to run the following command:

``` bash
npm run deploy
```

## Invocation

This example uses an API Gateway endpoint to invoke the function:

``` curl
curl --request POST \
  --url http://localhost:3000/dev/generateCertificate \
  --header 'Content-Type: application/json' \
  --data '{
  "id": "f0676b43-8b44-4683-b3bd-fa190f764c1f",
  "name": "john doe",
  "grade": 10
}'
```

The response should be a JSON like this:

``` json
{
  "message": "Certificate generated successfully",
  "filename": "f0676b43-8b44-4683-b3bd-fa190f764c1f.pdf"
}
```

The outcome of the invocation is a PDF file in the S3 bucket.

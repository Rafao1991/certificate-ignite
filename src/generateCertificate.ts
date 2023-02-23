import { APIGatewayProxyHandler } from 'aws-lambda';
import { join } from 'path';
import { readFileSync } from 'fs';
import { compile } from 'handlebars';
import { S3 } from 'aws-sdk';
import chromium from 'chrome-aws-lambda';

import { document } from './util/dynamodb.client';

export const handler: APIGatewayProxyHandler = async (event: any) => {
  const { id, name, grade } = JSON.parse(event.body) as GenerateCertificate;

  await saveData(name, id, grade);

  const pdf = await getPdf(id, name, grade);

  await uploadPdf(id, pdf);

  return {
    statusCode: 201,
    body: JSON.stringify({
      message: 'Certificate generated successfully',
      url: `https://dev-certificate-ignite.s3.amazonaws.com/${id}.pdf`,
    }),
  };
};

const generateFile = (data: Template) => {
  const filePath = join(process.cwd(), 'templates', 'certificate.hbs');
  const html = readFileSync(filePath, 'utf-8');

  return compile(html)(data);
};

const getPdf = async (id: string, name: string, grade: number) => {
  const medalPath = join(process.cwd(), 'templates', 'selo.png');
  const medal = readFileSync(medalPath, 'base64');
  const fileContent = generateFile({
    id,
    name,
    medal,
    grade: grade.toString(),
    date: new Date().toDateString(),
  });
  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
  });
  const page = await browser.newPage();
  await page.setContent(fileContent);
  const pdf = await page.pdf({
    format: 'a4',
    landscape: true,
    printBackground: true,
    preferCSSPageSize: true,
    path: process.env.IS_OFFLINE ? './certificate.pdf' : undefined,
  });

  await browser.close();
  return pdf;
};

const uploadPdf = async (id: string, pdf: Buffer) => {
  const s3 = new S3();
  await s3
    .putObject({
      Bucket: 'dev-certificate-ignite',
      Key: `${id}.pdf`,
      Body: pdf,
      ContentType: 'application/pdf',
    })
    .promise();
};

const saveData = async (name: string, id: string, grade: number) => {
  const response = await document
    .query({
      TableName: 'users_certificate',
      KeyConditionExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':id': id,
      },
    })
    .promise();

  if (!response?.Items || !response.Items[0]) {
    await document
      .put({
        TableName: 'users_certificate',
        Item: {
          id,
          name,
          grade,
          created_at: new Date().toISOString(),
        },
      })
      .promise();
  }
};

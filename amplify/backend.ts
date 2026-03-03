import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";

import { auth } from "./auth/resource";
import { generateRecipe } from "./functions/generate-recipe/resource";

const backend = defineBackend({
  auth,
  generateRecipe,
});

// Stack for the API Gateway REST API
const apiStack = backend.createStack("api-stack");

const api = new RestApi(apiStack, "RecipeApi", {
  restApiName: "recipeApi",
  deploy: true,
  deployOptions: { stageName: "dev" },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS,
    allowMethods: Cors.ALL_METHODS,
    allowHeaders: Cors.DEFAULT_HEADERS,
  },
});

// Lambda integration
const lambdaIntegration = new LambdaIntegration(backend.generateRecipe.resources.lambda);

// Cognito authorizer
const cognitoAuth = new CognitoUserPoolsAuthorizer(apiStack, "CognitoAuthorizer", {
  cognitoUserPools: [backend.auth.resources.userPool],
});

// POST /generate-recipe protected by Cognito
const generatePath = api.root.addResource("generate-recipe");
generatePath.addMethod("POST", lambdaIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuth,
});

// Allow the function to call Bedrock InvokeModel
backend.generateRecipe.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["bedrock:InvokeModel"],
    resources: ["*"], // tighten to model ARN(s) later if you want
  })
);

// Output for frontend config (custom REST APIs must be added explicitly)
backend.addOutput({
  custom: {
    API: {
      [api.restApiName]: {
        endpoint: api.url,
        region: Stack.of(api).region,
        apiName: api.restApiName,
      },
    },
  },
});
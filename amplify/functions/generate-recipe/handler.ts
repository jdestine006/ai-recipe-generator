import type { APIGatewayProxyHandler } from "aws-lambda";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

type GenerateRecipeRequest = {
  ingredients: string;
  servings?: number;
  dietaryNotes?: string;
};

type RecipeResponse = {
  title: string;
  servings: number;
  ingredients: string[];
  steps: string[];
  tips?: string[];
};

const MODEL_ID = "anthropic.claude-sonnet-4-6"; // Modern Claude on Bedrock (swap here if you choose another)

const bedrock = new BedrockRuntimeClient({});

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
  };
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body: GenerateRecipeRequest = event.body ? JSON.parse(event.body) : ({} as any);
    const ingredients = (body.ingredients ?? "").trim();

    if (!ingredients) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ message: "Please provide ingredients." }),
      };
    }

    const servings = Number.isFinite(body.servings) ? Number(body.servings) : 2;
    const dietaryNotes = (body.dietaryNotes ?? "").trim();

    const prompt = [
      "You are a helpful chef assistant.",
      "Return ONLY valid JSON (no markdown).",
      "Schema:",
      `{ "title": string, "servings": number, "ingredients": string[], "steps": string[], "tips"?: string[] }`,
      "",
      `Servings: ${servings}`,
      dietaryNotes ? `Dietary notes: ${dietaryNotes}` : "Dietary notes: none",
      `Ingredients available: ${ingredients}`,
      "",
      "Make a practical recipe using mostly these ingredients. Keep steps concise.",
    ].join("\n");

    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 900,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }],
        },
      ],
    };

    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: new TextEncoder().encode(JSON.stringify(payload)),
    });

    const result = await bedrock.send(command);
    const raw = new TextDecoder().decode(result.body);

    // Claude Messages response contains "content": [{ "type":"text","text":"..." }]
    const parsed = JSON.parse(raw);
    const text: string =
      parsed?.content?.find((c: any) => c?.type === "text")?.text ?? "";

    // The model is instructed to output JSON only; parse it.
    const recipe: RecipeResponse = JSON.parse(text);

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify(recipe),
    };
  } catch (err: any) {
    console.error(err);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ message: "Server error", detail: String(err?.message ?? err) }),
    };
  }
};
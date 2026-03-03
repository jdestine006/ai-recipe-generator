import { defineFunction } from "@aws-amplify/backend";

export const generateRecipe = defineFunction({
  name: "generate-recipe",
  entry: "./handler.ts",
});
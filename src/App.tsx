import { useMemo, useState } from "react";
import "@aws-amplify/ui-react/styles.css";
import { Authenticator } from "@aws-amplify/ui-react";
import { post } from "aws-amplify/api";

type Recipe = {
  title: string;
  servings: number;
  ingredients: string[];
  steps: string[];
  tips?: string[];
};

export default function App() {
  const [ingredients, setIngredients] = useState("");
  const [servings, setServings] = useState(2);
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => ingredients.trim().length > 0 && !loading, [ingredients, loading]);

  async function generate() {
    setLoading(true);
    setError(null);
    setRecipe(null);

    try {
      const restOp = post({
        apiName: "recipeApi",
        path: "/generate-recipe",
        options: {
          body: {
            ingredients,
            servings,
            dietaryNotes: dietaryNotes?.trim() || null,
          },
        },
      });

      const { body } = await restOp.response;
      const data = (await body.json()) as Recipe;
      setRecipe(data);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Authenticator>
      {({ signOut }) => (
        <div style={{ maxWidth: 860, margin: "40px auto", padding: 16, fontFamily: "system-ui, sans-serif" }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <h1 style={{ margin: 0 }}>AI Recipe Generator</h1>
            <button onClick={signOut}>Sign out</button>
          </header>

          <p style={{ opacity: 0.8 }}>
            Enter ingredients and generate a recipe using a modern Claude model on Amazon Bedrock.
          </p>

          <div style={{ display: "grid", gap: 12 }}>
            <label style={{ display: "grid", gap: 6 }}>
              Ingredients (comma-separated)
              <textarea
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                rows={4}
                placeholder="chicken, rice, garlic, onions, broccoli..."
              />
            </label>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <label style={{ display: "grid", gap: 6 }}>
                Servings
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                />
              </label>

              <label style={{ display: "grid", gap: 6, flex: 1, minWidth: 240 }}>
                Dietary notes (optional)
                <input
                  value={dietaryNotes}
                  onChange={(e) => setDietaryNotes(e.target.value)}
                  placeholder="gluten-free, dairy-free, high-protein..."
                />
              </label>
            </div>

            <button disabled={!canSubmit} onClick={generate}>
              {loading ? "Generating..." : "Generate recipe"}
            </button>

            {error && (
              <div style={{ padding: 12, background: "#ffecec", border: "1px solid #ffb3b3" }}>
                <strong>Error:</strong> {error}
              </div>
            )}

            {recipe && (
              <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
                <h2 style={{ marginTop: 0 }}>{recipe.title}</h2>
                <div style={{ opacity: 0.8, marginBottom: 12 }}>Serves: {recipe.servings}</div>

                <h3>Ingredients</h3>
                <ul>
                  {recipe.ingredients.map((i, idx) => (
                    <li key={idx}>{i}</li>
                  ))}
                </ul>

                <h3>Steps</h3>
                <ol>
                  {recipe.steps.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ol>

                {recipe.tips?.length ? (
                  <>
                    <h3>Tips</h3>
                    <ul>
                      {recipe.tips.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}
    </Authenticator>
  );
}
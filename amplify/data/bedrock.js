export function request(ctx) {
  var ingredients = ctx.args.ingredients || [];
  var prompt = 'Suggest a recipe using: ' + ingredients.join(', ');

  return {
    version: '2018-05-29',
    method: 'POST',
    resourcePath: '/model/arn:aws:bedrock:us-east-1::bedrock-inference-profile/claude-sonnet-4-6-20250514-v1/invoke',
    params: {
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-06-01',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ]
      })
    }
  };
}

export function response(ctx) {
  var parsedBody = JSON.parse(ctx.result.body);
  var textContent = '';
  var errorMsg = '';
  
  if (parsedBody && parsedBody.content && parsedBody.content[0] && parsedBody.content[0].text) {
    textContent = parsedBody.content[0].text;
  } else {
    errorMsg = 'Response: ' + JSON.stringify(parsedBody);
  }
  
  return {
    body: textContent,
    error: errorMsg
  };
}

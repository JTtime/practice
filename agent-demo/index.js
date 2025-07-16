const Groq = require("groq-sdk");
require('dotenv').config();

// const fetch = require('node-fetch');

// Placeholder for Groq API key
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Initialize Groq client
const groq = new Groq({ apiKey: GROQ_API_KEY });

// Function to fetch all product categories from dummyjson.com
async function getProductCategories() {
  try {
    const response = await fetch("https://dummyjson.com/products/categories");
    return await response.json();
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// Function to find the closest matching category

async function findClosestCategory(userCategory) {
  const categories = await getProductCategories();

  const lowerUserCategory = userCategory?.toString().toLowerCase?.();
  if (!lowerUserCategory) return "smartphones"; // fallback

  return (
    categories?.find((category) => {
      const lowerCategory = category?.toString().toLowerCase?.();
      return (
        lowerCategory?.includes(lowerUserCategory) ||
        lowerUserCategory?.includes(lowerCategory)
      );
    }) || "smartphones"
  );
}

// Tool definitions for Groq API
const tools = [
  {
    type: "function",
    function: {
      name: "getAllProducts",
      description: "Fetches all products from dummyjson.com",
      parameters: {},
    },
  },
  {
    type: "function",
    function: {
      name: "getProductById",
      description: "Fetches a specific product by ID from dummyjson.com",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "Product ID" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getProductsByCategory",
      description: "Fetches products in a specific category from dummyjson.com",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Product category" },
        },
        required: ["category"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "addProduct",
      description: "Adds a new product to dummyjson.com",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Product title" },
          category: { type: "string", description: "Product category" },
        },
        required: ["title", "category"],
      },
    },
  },
];

// Tool execution logic
async function executeTool(toolCall) {
  const { name, arguments: args } = toolCall;

  switch (name) {
    case "getAllProducts":
      const allProductsRes = await fetch("https://dummyjson.com/products");
      return await allProductsRes.json();

    case "getProductById":
      const productRes = await fetch(
        `https://dummyjson.com/products/${args.id}`
      );
      return await productRes.json();

    case "getProductsByCategory":
      const category = await findClosestCategory(args.category);
      const categoryRes = await fetch(
        `https://dummyjson.com/products/category/${category}`
      );
      const allProducts = await categoryRes.json();

      const topProduct = allProducts?.products?.[0]; // or custom logic like highest rating
      return topProduct || allProducts;

    case "addProduct":
      const addRes = await fetch("https://dummyjson.com/products/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: args.title,
          category: await findClosestCategory(args.category),
        }),
      });
      return await addRes.json();

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Main function to handle user prompt
async function handleUserPrompt(prompt) {
  try {
    const systemMessage = {
      role: "system",
      content: `
                    You are a helpful shopping assistant that can:
                    1. Fetch all product categories.
                    2. Fetch products in a specific category.
                    3. Fetch a specific product by its ID.
                    4. Add a product.

                    Think step-by-step. Use the available tools to answer the user query accurately.
                    If a category is mentioned, validate it before using.
                    Respond naturally once you have the necessary information.
`,
    };
    // Call Groq API with tool calling
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [systemMessage, { role: "user", content: prompt }],
      tools: tools,
      tool_choice: "auto",
    });

    const message = response.choices[0].message;

    // Check if the response includes tool calls
    if (message.tool_calls && message.tool_calls.length > 0) {
      const results = [];
      for (const toolCall of message.tool_calls) {
        const result = await executeTool(toolCall.function);
        results.push({
          tool_call_id: toolCall.id,
          result: result,
        });
      }

      // Send tool results back to Groq for final response
      const finalResponse = await groq.chat.completions.create({
        model: "meta-llama/llama-4-maverick-17b-128e-instruct",
        messages: [
          systemMessage,
          { role: "user", content: prompt },
          message,
          ...results.map((r) => ({
            role: "tool",
            content: JSON.stringify(r.result),
            tool_call_id: r.tool_call_id,
          })),
          {
            role: "system",
            content: `
                    You are a helpful shopping assistant. You have access to product data retrieved using APIs.

                    - If you received a list of products (e.g. from getProductsByCategory), pick the most relevant or top product.
                    - Show its title, price, and a short description.
                    - Do NOT return JSON.
                    - Do NOT return placeholders like <brave_search>.
                    - Just respond with the final answer as natural text.
`,
          },
        ],
      });

      console.log("Tool result:", JSON.stringify(results, null, 2));


      return finalResponse.choices[0].message.content;
    }
    else {
      return message.content;
    }
  } catch (error) {
    console.error("Error handling prompt:", error);
    return "An error occurred while processing your request.";
  }
}

// Interactive CLI for testing
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function startInteractive() {
  while (true) {
    const prompt = await new Promise((resolve) => {
      readline.question('Enter your prompt (or "exit" to quit): ', resolve);
    });

    if (prompt.toLowerCase() === "exit") {
      readline.close();
      break;
    }

    const response = await handleUserPrompt(prompt);
    console.log("Response:", response);
  }
}

// Start the interactive session
startInteractive();

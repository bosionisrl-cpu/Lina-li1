import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is not configured. Please add it to your environment secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // API Route - Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', keyAvailable: !!process.env.GEMINI_API_KEY });
  });

  // API Route - Upgrade Code via Gemini
  app.post('/api/upgrade', async (req, res): Promise<any> => {
    try {
      const { code, language, focus, additionalInstructions } = req.body;

      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Code is required and must be a string.' });
      }

      const client = getGeminiClient();

      const focusDescriptions: Record<string, string> = {
        general: 'General modernization, optimization, formatting, and structural improvements.',
        performance: 'Optimization of runtime speed, algorithmic time/space complexity, memory allocation, and list collections.',
        readability: 'Refactoring of variable name clarity, modularity, visual layouts, standard design patterns, and docstring guidelines.',
        bugs: 'Detection of structural bugs, silent error paths, boundary failures, logical oversights, and raw edge-cases.',
        typescriptify: 'Migrating codebase elements directly to fully type-safe designs with typed generic variables, structural interfaces, or proper parameters.',
        tests: 'Designing detailed unit tests, mocks, and code coverage assertions aligned to modern, robust test framework suites.'
      };

      const selectedFocus = focusDescriptions[focus] || focusDescriptions.general;

      const systemPrompt = `You are an elite, senior-level principal software engineer and expert code optimizer.
Your goal is to parse, analyze, and optimize/upgrade the user's provided code to meet the highest industry standards of production quality, reliability, and modern conventions.

Format requirements:
- Treat any provided code with ultimate preservation of core logical intent. Don't strip out functionality, but improve the code dramatically according to the requested focus.
- The user's target language was specified as: "${language || 'Auto-detect'}".
- The direct upgrades focus is: "${selectedFocus}".
${additionalInstructions ? `- Additional specific developer instructions: "${additionalInstructions}"` : ''}

You MUST return a JSON object that adheres strictly to the requested response schema.
Make sure the complexityBefore and complexityAfter fields are valid big-O notations, e.g. "O(N^2)" -> "O(N log N)".
Provide exact line numbers in the upgraded code for linesAffected.`;

      const userMessage = `Here is the code to analyze and upgrade:\n\n\`\`\`${language || ''}\n${code}\n\`\`\``;

      const modelName = 'gemini-3.5-flash';

      const response = await client.models.generateContent({
        model: modelName,
        contents: userMessage,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              upgradedCode: {
                type: Type.STRING,
                description: 'The complete revised, refactored, and upgraded source code, styled beautifully.'
              },
              explanation: {
                type: Type.STRING,
                description: 'A crisp, professional overview explaining the architectural choices and specific upgrades made.'
              },
              complexityBefore: {
                type: Type.STRING,
                description: 'Theoretical time/space complexity estimate of the original code, e.g., O(N^2).'
              },
              complexityAfter: {
                type: Type.STRING,
                description: 'Optimized complexity estimate of the upgraded code, e.g., O(N).'
              },
              improvements: {
                type: Type.ARRAY,
                description: 'Specific line-by-line or component-by-component improvements implemented.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: {
                      type: Type.STRING,
                      description: 'Type of improvement. Must strictly be one of: performance, security, readability, correctness, types.'
                    },
                    description: {
                      type: Type.STRING,
                      description: 'Very concise, informative detail description of the change.'
                    },
                    linesAffected: {
                      type: Type.STRING,
                      description: 'Lines in the NEW upgraded code affected, e.g. "Lines 3-12", "Throughout", or "Line 14".'
                    }
                  },
                  required: ['type', 'description', 'linesAffected']
                }
              },
              metrics: {
                type: Type.OBJECT,
                description: 'Production-readiness quality metrics (0-100 values) comparing original vs new aspects.',
                properties: {
                  readability: {
                    type: Type.INTEGER,
                    description: 'Readability, clean styling, naming conventions and documentation score (0-100).'
                  },
                  performanceScore: {
                    type: Type.INTEGER,
                    description: 'Algorithmic efficiency, execution speed, and compute optimization score (0-100).'
                  },
                  securityScore: {
                    type: Type.INTEGER,
                    description: 'Safety, input validation, leak-prevention, and security resilience score (0-100).'
                  }
                },
                required: ['readability', 'performanceScore', 'securityScore']
              }
            },
            required: ['upgradedCode', 'explanation', 'complexityBefore', 'complexityAfter', 'improvements', 'metrics']
          }
        }
      });

      const jsonStr = response.text ? response.text.trim() : '';
      if (!jsonStr) {
        throw new Error('Gemini returned an empty reply.');
      }

      const parsedResult = JSON.parse(jsonStr);
      res.json(parsedResult);
    } catch (error: any) {
      console.error('Code upgrade api error:', error);
      res.status(500).json({
        error: error.message || 'An unexpected error occurred during code analysis.',
        details: error.stack
      });
    }
  });

  // Mount Vite middleware in development or serve static build files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

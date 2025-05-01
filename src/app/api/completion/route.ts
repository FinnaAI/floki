import { createOpenAI } from "@ai-sdk/openai";
import { generateText, streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const openai = createOpenAI({
	apiKey: process.env.OPENROUTER_API_KEY,
	baseURL: "https://openrouter.ai/api/v1",
});

const extra_headers = {
	"HTTP-Referer": "https://flokiii.com",
	"X-Title": "Floki IDE",
};

export async function POST(req: Request) {
	const { messages } = await req.json();

	const result = streamText({
		model: openai("deepseek/deepseek-chat-v3-0324"),
		messages,
		maxTokens: 50,
		temperature: 0.2,
		headers: extra_headers,
	});

	return result.toDataStreamResponse();
}

export async function GET(req: Request) {
	const result = generateText({
		model: openai("deepseek/deepseek-chat-v3-0324"),
		messages: [
			{
				role: "user",
				content: "Hello, how are you?",
			},
		],
		maxTokens: 50,
		temperature: 0.2,
		headers: extra_headers,
	});

	console.log((await result).text);
	return new Response((await result).text);
}

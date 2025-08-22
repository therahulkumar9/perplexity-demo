import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { prompt, apiKey } = await req.json()

    if (!prompt || !apiKey) {
      return NextResponse.json(
        { error: "Prompt and API key are required." },
        { status: 400 }
      )
    }

    const result = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [{ role: "user", content: prompt }],
      }),
    })

    const data = await result.json()

    if (!result.ok) {
      return NextResponse.json(
        { error: data.error?.message || JSON.stringify(data) },
        { status: 500 }
      )
    }

    return NextResponse.json({
      answer:
        data.choices?.[0]?.message?.content ||
        data.choices?.[0]?.text ||
        "No answer received.",
    })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_CHATKIT_BASE } from "@/lib/config";

type CreateSessionRequest = {
  workflowId?: string;
  openaiApiKey?: string;
  chatkitApiBase?: string;
};

export async function POST(request: NextRequest) {
  let payload: CreateSessionRequest;
  try {
    payload = (await request.json()) as CreateSessionRequest;
  } catch (error) {
    return NextResponse.json(
      { error: "Body musí být validní JSON." },
      { status: 400 },
    );
  }

  const { workflowId, openaiApiKey, chatkitApiBase } = payload ?? {};

  if (!workflowId) {
    return NextResponse.json(
      { error: "workflowId je povinný parametr." },
      { status: 400 },
    );
  }

  if (!openaiApiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY je povinný parametr." },
      { status: 400 },
    );
  }

  const baseUrl = (chatkitApiBase && chatkitApiBase.trim()) || DEFAULT_CHATKIT_BASE;

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        workflow_id: workflowId,
      }),
    });

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Vytvoření sezení se nezdařilo.",
          details: text,
        },
        { status: response.status },
      );
    }

    try {
      const json = JSON.parse(text);
      return NextResponse.json(json, { status: 200 });
    } catch (parseError) {
      return NextResponse.json(
        {
          error: "Odpověď služby Agentkit není validní JSON.",
          details: text,
        },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("Failed to create Agentkit session", error);
    return NextResponse.json(
      { error: "Nepodařilo se kontaktovat Agentkit API." },
      { status: 500 },
    );
  }
}

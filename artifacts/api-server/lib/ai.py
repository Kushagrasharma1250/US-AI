import os
import json
import re
from openai import OpenAI
from typing import Optional

AI_BASE_URL = os.environ.get("AI_BASE_URL")
AI_API_KEY = os.environ.get("AI_API_KEY", "ollama")
AI_MODEL = os.environ.get("AI_MODEL", "llama3:8b")

_client: Optional[OpenAI] = None


def get_client() -> OpenAI:
    global _client
    if _client:
        return _client
    if not AI_BASE_URL:
        raise RuntimeError(
            "AI_BASE_URL is not set. Point it at your local Ollama via ngrok "
            "(e.g. https://abc123.ngrok.io/v1) or any OpenAI-compatible endpoint, "
            "then restart the server."
        )
    _client = OpenAI(base_url=AI_BASE_URL, api_key=AI_API_KEY)
    return _client


SYSTEM_PROMPT = """You are an expert analyst. Analyze the provided file contents and synthesize them into a structured JSON output.

You MUST respond with ONLY valid JSON matching this exact schema — no markdown, no explanation, just the JSON object:

{
  "title": "short descriptive title for this analysis",
  "summary": "2-4 sentence executive summary of all content",
  "keyPoints": ["4-8 key insights as strings"],
  "keyMetrics": [
    { "label": "metric name", "value": "metric value with units" }
  ],
  "nodes": [
    {
      "id": "root",
      "label": "Central Theme",
      "type": "root",
      "value": null,
      "children": [
        {
          "id": "topic1",
          "label": "Topic Name",
          "type": "topic",
          "value": "brief explanation",
          "children": []
        }
      ]
    }
  ]
}

Node types: root (1 only), topic (main sections), metric (numeric facts), insight (interpretations), detail (sub-points).
Create 3-6 top-level topics, each with 2-5 children. Include metrics as nodes where appropriate."""


def analyze_content(
    file_contents: list[dict],
    custom_prompt: Optional[str] = None,
) -> dict:
    """
    Call the LLM and return parsed analysis JSON.
    file_contents: list of {"name": str, "type": str, "content": str}
    """
    files_text = "\n\n".join(
        f"=== File: {f['name']} ({f['type']}) ===\n{f['content']}"
        for f in file_contents
    )

    user_message = (
        f"Analyze these files with special focus on: {custom_prompt}\n\n{files_text}"
        if custom_prompt
        else f"Analyze the following file contents:\n\n{files_text}"
    )

    response = get_client().chat.completions.create(
        model=AI_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        temperature=0.3,
    )

    raw = response.choices[0].message.content or ""
    # Strip markdown fences if the model wraps in ```json
    cleaned = re.sub(r"^```(?:json)?\n?", "", raw, flags=re.MULTILINE)
    cleaned = re.sub(r"\n?```$", "", cleaned, flags=re.MULTILINE).strip()

    return json.loads(cleaned)

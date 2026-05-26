"""One-shot script to generate the 4 missing recipe illustrations.

Output:
  /app/frontend/public/img/recipe-eggs.png
  /app/frontend/public/img/recipe-pasta.png
  /app/frontend/public/img/recipe-beans.png
  /app/frontend/public/img/recipe-saucepan.png

Style: bold, brutalist arcade — to match existing fried-rice and sushi assets.
Run with:  python /app/backend/scripts/gen_recipe_images.py
"""

import asyncio
import base64
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv("/app/backend/.env")

API_KEY = os.getenv("EMERGENT_LLM_KEY")
OUT_DIR = Path("/app/frontend/public/img")
MODEL = "gemini-3.1-flash-image-preview"

STYLE = (
    "Square format. Bold brutalist arcade illustration, "
    "thick black outlines, flat colours, retro pixel-art-inspired but clean vector style. "
    "Palette: warm yellows, deep reds, cream, charcoal black background. "
    "Centered subject, dramatic single-light feel, no text, no words, no logos."
)

JOBS = [
    ("recipe-eggs.png",
     f"Soft scrambled eggs piled on a slice of toast on a plate. {STYLE}"),
    ("recipe-pasta.png",
     f"A bowl of penne pasta with bright red tomato sauce and grated yellow cheese on top, a fork tucked in. {STYLE}"),
    ("recipe-beans.png",
     f"Classic British baked beans in tomato sauce poured over a slice of buttered toast on a plate. {STYLE}"),
    ("recipe-saucepan.png",
     f"A red saucepan on a hob with steam rising and a wooden spoon resting in it. {STYLE}"),
]


async def gen_one(filename: str, prompt: str):
    chat = LlmChat(api_key=API_KEY, session_id=f"recipe-img-{filename}", system_message="You generate single illustrated images.")
    chat.with_model("gemini", MODEL).with_params(modalities=["image", "text"])
    msg = UserMessage(text=prompt)
    text, images = await chat.send_message_multimodal_response(msg)
    if not images:
        print(f"FAIL {filename}: no images returned. Text={text[:200]}")
        return False
    img_bytes = base64.b64decode(images[0]["data"])
    out_path = OUT_DIR / filename
    out_path.write_bytes(img_bytes)
    print(f"OK   {filename}: {len(img_bytes)} bytes -> {out_path}")
    return True


async def main():
    if not API_KEY:
        print("ERROR: EMERGENT_LLM_KEY not set")
        sys.exit(1)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    # Generate sequentially to be polite to the API
    results = []
    for fn, prompt in JOBS:
        ok = await gen_one(fn, prompt)
        results.append((fn, ok))
    print("\nSummary:")
    for fn, ok in results:
        print(f"  {'OK ' if ok else 'FAIL'} {fn}")


if __name__ == "__main__":
    asyncio.run(main())

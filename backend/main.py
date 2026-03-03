from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from pydantic import BaseModel
from bedrock_service import generate_content, save_progress
from bedrock_service import generate_content, save_progress, get_user_progress
from bedrock_service import calculate_next_level
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TopicRequest(BaseModel):
    topic: str
    language: str
    level: str

class ProgressRequest(BaseModel):
    user_id: str
    topic: str
    language: str
    level: str
    score: int

@app.post("/generate")
def generate(request: TopicRequest):

    if not request.topic or request.topic.strip() == "":
        return {
            "error": "Topic cannot be empty. Please provide a valid topic."
        }

    user_id = "currentUser"

    adaptive_level = calculate_next_level(user_id)

    return generate_content(
        request.topic,
        request.language,
        adaptive_level
    )

@app.post("/save-progress")
def save_user_progress(request: ProgressRequest):
    save_progress(
        request.user_id,
        request.topic,
        request.language,
        request.level,
        request.score
    )
    return {"status": "Progress saved successfully"}
@app.get("/progress/{user_id}")
def fetch_progress(user_id: str):
    return get_user_progress(user_id)
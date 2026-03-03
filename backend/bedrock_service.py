import datetime
import boto3
import json
import random
from boto3.dynamodb.conditions import Key

# ==============================
# AWS CLIENTS
# ==============================

bedrock = boto3.client(
    service_name="bedrock-runtime",
    region_name="us-east-1"
)

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
table = dynamodb.Table("SmartLearnProgress")

# ==============================
# AI CONTENT GENERATION
# ==============================

def generate_content(topic, language, level):
    try:

        # 🎯 Adaptive Difficulty Instructions
        if level.lower() == "beginner":
            difficulty_instruction = "Explain in very simple terms using easy language and relatable examples."
        elif level.lower() == "intermediate":
            difficulty_instruction = "Explain clearly with moderate technical depth and practical examples."
        elif level.lower() == "advanced":
            difficulty_instruction = "Provide deep technical explanation including time complexity, edge cases, and optimization discussion."
        else:
            difficulty_instruction = "Explain clearly."

        prompt = f"""
You are an educational AI assistant.

Topic: {topic}
Difficulty Level: {level}

IMPORTANT:
The entire response MUST be written strictly in {language} language.

Instructions:
{difficulty_instruction}

Generate:
1. A clear explanation
2. A short summary
3. 3 high-quality multiple choice questions
4. Briefly explain where this concept originates from (its field or parent concept).

QUIZ RULES:
- Each question must have 4 FULL descriptive options.
- Do NOT return just A, B, C, D.
- Each option must contain complete descriptive text.
- The answer must match the full correct option text exactly.

Return STRICT JSON only in this format:

{{
  "explanation": "...",
  "summary": "...",
  "origin": "..."
  "quiz": [
    {{
      "question": "...",
      "options": [
        "Full option text 1",
        "Full option text 2",
        "Full option text 3",
        "Full option text 4"
      ],
      "answer": "Exact correct full option text"
    }}
  ]
}}

Do not return anything outside JSON.
"""

        body = {
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ],
            "max_tokens": 1500,
            "temperature": 0.7
        }

        response = bedrock.invoke_model(
            modelId="nvidia.nemotron-nano-12b-v2",
            body=json.dumps(body),
            contentType="application/json",
            accept="application/json"
        )

        result = json.loads(response["body"].read())
        content = result["choices"][0]["message"]["content"]

        # ✅ Safe JSON extraction
        try:
            start = content.find("{")
            end = content.rfind("}") + 1
            clean_json = content[start:end]

            parsed = json.loads(clean_json)

            # Shuffle options
            for question in parsed["quiz"]:
                random.shuffle(question["options"])

            return parsed

        except Exception:
            return {
                "error": "Model response formatting issue. Please try again.",
                "raw_output": content
            }

    except Exception as e:
        return {
            "error": f"Bedrock Error: {str(e)}"
        }

# ==============================
# SAVE USER PROGRESS
# ==============================

def save_progress(user_id, topic, language, level, score):
    try:
        table.put_item(
            Item={
                "user_id": user_id,
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "topic": topic,
                "language": language,
                "level": level,
                "score": score
            }
        )
    except Exception as e:
        print("DynamoDB Save Error:", e)

# ==============================
# FETCH USER PROGRESS + INSIGHTS
# ==============================

def get_user_progress(user_id):
    try:
        response = table.query(
            KeyConditionExpression=Key("user_id").eq(user_id)
        )

        items = response.get("Items", [])

        if not items:
            return {
                "total_attempts": 0,
                "average_score": 0,
                "latest_level": None,
                "performance_status": "No Data",
                "strength_category": "None",
                "recommendation": "Start practicing to build your learning profile.",
                "history": []
            }

        # Sort chronologically
        items.sort(key=lambda x: x["timestamp"])

        total_attempts = len(items)
        total_score = sum(item["score"] for item in items)
        average_score = total_score / total_attempts
        latest_level = items[-1]["level"]

        # 🧠 Insight Engine
        if average_score >= 2.5:
            performance_status = "Strong Performance"
            recommendation = "You are performing very well. Consider moving to more advanced topics."
            strength = "High"

        elif average_score >= 1.5:
            performance_status = "Moderate Performance"
            recommendation = "You are progressing steadily. Focus on strengthening weak areas."
            strength = "Medium"

        else:
            performance_status = "Needs Improvement"
            recommendation = "You may need to revisit foundational concepts before advancing."
            strength = "Low"

        return {
            "total_attempts": total_attempts,
            "average_score": round(average_score, 2),
            "latest_level": latest_level,
            "performance_status": performance_status,
            "strength_category": strength,
            "recommendation": recommendation,
            "history": items
        }

    except Exception as e:
        return {
            "error": f"DynamoDB Fetch Error: {str(e)}"
        }

# ==============================
# ADAPTIVE LEVEL CALCULATION
# ==============================

def calculate_next_level(user_id):
    progress = get_user_progress(user_id)

    if progress["total_attempts"] == 0:
        return "Beginner"

    avg = progress["average_score"]
    current_level = progress["latest_level"]

    if avg >= 2.5:
        if current_level == "Beginner":
            return "Intermediate"
        elif current_level == "Intermediate":
            return "Advanced"
        else:
            return "Advanced"

    elif avg <= 1.5:
        if current_level == "Advanced":
            return "Intermediate"
        elif current_level == "Intermediate":
            return "Beginner"
        else:
            return "Beginner"

    return current_level
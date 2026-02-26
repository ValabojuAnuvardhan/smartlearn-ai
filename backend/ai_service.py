import random

def generate_content(topic, language):
    explanation = f"{topic} is explained in simple terms in {language}. It helps learners understand the concept clearly."

    summary = f"{topic} is an important concept used in technology."

    quiz = [
        {
            "question": f"What is {topic}?",
            "options": ["Definition", "Algorithm", "Database", "Network"],
            "answer": "Definition"
        },
        {
            "question": f"Why is {topic} important?",
            "options": ["Speed", "Efficiency", "Security", "Design"],
            "answer": "Efficiency"
        },
        {
            "question": f"Where is {topic} used?",
            "options": ["Programming", "Cooking", "Driving", "Painting"],
            "answer": "Programming"
        }
    ]

    return {
        "explanation": explanation,
        "summary": summary,
        "quiz": quiz
    }
"""
AWS Lambda Function for SmartLearn AI
Optimized for production deployment
"""

import json
import boto3
import os
from datetime import datetime
from boto3.dynamodb.conditions import Key

# Initialize AWS clients
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table(os.environ.get('DYNAMODB_TABLE', 'SmartLearnProgress'))

def lambda_handler(event, context):
    """Main Lambda handler"""
    try:
        # Handle CORS preflight
        if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
            return cors_response(200, {'message': 'OK'})
        
        # Parse request
        path = event.get('rawPath', '/')
        method = event.get('requestContext', {}).get('http', {}).get('method', 'POST')
        
        # Parse body
        body = {}
        if event.get('body'):
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        
        # Route requests
        if path == '/generate' or path == '/api/generate':
            return handle_generate(body)
        elif path == '/save-progress' or path == '/api/save-progress':
            return handle_save_progress(body)
        elif '/progress/' in path:
            user_id = path.split('/')[-1]
            return handle_get_progress(user_id)
        elif path == '/health':
            return cors_response(200, {'status': 'healthy'})
        else:
            return cors_response(404, {'error': 'Not found'})
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return cors_response(500, {'error': str(e)})

def handle_generate(body):
    """Generate learning content"""
    try:
        topic = body.get('topic', '').strip()
        if not topic:
            return cors_response(400, {'error': 'Topic required'})
        
        language = body.get('language', 'English')
        level = body.get('level', 'Beginner')
        
        # Generate content using Bedrock
        result = generate_content(topic, language, level)
        
        if 'error' in result:
            return cors_response(500, result)
        
        return cors_response(200, result)
        
    except Exception as e:
        return cors_response(500, {'error': str(e)})

def generate_content(topic, language, level):
    """Generate content using Amazon Bedrock with Nova"""
    try:
        # Build prompt based on level
        if level.lower() == 'beginner':
            difficulty = "Explain in simple terms with easy examples."
        elif level.lower() == 'intermediate':
            difficulty = "Explain with moderate technical depth."
        else:
            difficulty = "Provide deep technical explanation."
        
        prompt = f"""You are an educational AI assistant.

Topic: {topic}
Level: {level}
Language: {language}

Instructions:
{difficulty}
The entire response MUST be in {language} language.

Generate:
1. Clear explanation
2. Short summary
3. 3 multiple choice questions with 4 full options each

Return ONLY valid JSON in this format:
{{
  "explanation": "...",
  "summary": "...",
  "quiz": [
    {{
      "question": "...",
      "options": ["Full option 1", "Full option 2", "Full option 3", "Full option 4"],
      "answer": "Exact correct option text"
    }}
  ]
}}"""

        # Call Bedrock with Nova model
        response = bedrock.converse(
            modelId="amazon.nova-lite-v1:0",
            messages=[
                {
                    "role": "user",
                    "content": [{"text": prompt}]
                }
            ],
            inferenceConfig={
                "maxTokens": 2000,
                "temperature": 0.7
            }
        )
        
        # Parse response
        content = response["output"]["message"]["content"][0]["text"]
        
        # Extract JSON
        start = content.find('{')
        end = content.rfind('}') + 1
        clean_json = content[start:end]
        parsed = json.loads(clean_json)
        
        return parsed
        
    except Exception as e:
        print(f"Bedrock error: {str(e)}")
        return {'error': f'AI service error: {str(e)}'}

def handle_save_progress(body):
    """Save user progress"""
    try:
        user_id = body.get('user_id', 'demo_user')
        
        table.put_item(
            Item={
                'user_id': user_id,
                'timestamp': datetime.utcnow().isoformat(),
                'topic': body.get('topic', ''),
                'language': body.get('language', 'English'),
                'level': body.get('level', 'Beginner'),
                'score': body.get('score', 0)
            }
        )
        
        return cors_response(200, {'status': 'saved'})
        
    except Exception as e:
        return cors_response(500, {'error': str(e)})

def handle_get_progress(user_id):
    """Get user progress"""
    try:
        response = table.query(
            KeyConditionExpression=Key('user_id').eq(user_id)
        )
        
        items = response.get('Items', [])
        
        if not items:
            return cors_response(200, {
                'total_attempts': 0,
                'average_score': 0,
                'latest_level': None,
                'history': []
            })
        
        total = len(items)
        avg_score = sum(item['score'] for item in items) / total
        latest_level = items[-1]['level']
        
        return cors_response(200, {
            'total_attempts': total,
            'average_score': round(avg_score, 2),
            'latest_level': latest_level,
            'history': items
        })
        
    except Exception as e:
        return cors_response(500, {'error': str(e)})

def cors_response(status_code, body):
    """Return CORS-enabled response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        'body': json.dumps(body)
    }

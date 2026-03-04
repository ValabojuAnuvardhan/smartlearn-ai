# 🧠 SmartLearn AI

AI-powered adaptive learning platform with interactive quizzes and progress tracking.

## 🌟 Features

- **AI-Powered Learning**: Generate personalized lessons using Amazon Bedrock (Claude 3 Haiku)
- **Adaptive Difficulty**: Automatically adjusts to your learning level
- **Interactive Quizzes**: Test your knowledge with AI-generated questions
- **Progress Tracking**: Monitor your learning journey with DynamoDB
- **Multi-Language Support**: English, Hindi, and Telugu
- **Modern UI**: Dark theme with smooth animations

## 🏗️ Architecture

- **Frontend**: HTML, CSS, JavaScript (hosted on S3)
- **Backend**: AWS Lambda (Python)
- **AI**: Amazon Bedrock (Claude 3 Haiku)
- **Database**: DynamoDB
- **Hosting**: S3 Static Website

## 🚀 Live Demo

- **GitHub Pages**: [https://valabojuanuvardhan.github.io/smartlearn-ai/](https://valabojuanuvardhan.github.io/smartlearn-ai/)
- **S3 Hosting**: [http://smartlearn-ai-demo.s3-website-us-east-1.amazonaws.com](http://smartlearn-ai-demo.s3-website-us-east-1.amazonaws.com)

## 📁 Project Structure

```
smartlearn-ai/
├── backend/
│   ├── main.py              # FastAPI backend (local dev)
│   ├── bedrock_service.py   # AWS Bedrock integration
│   └── requirements.txt
├── local/                   # Local development files
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── deploy/                  # AWS deployment files
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── lambda_function.py       # AWS Lambda function
└── README.md
```

## 🛠️ Local Development

### Prerequisites
- Python 3.11+
- AWS Account with Bedrock access
- DynamoDB table: `SmartLearnProgress`

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/smartlearn-ai.git
cd smartlearn-ai
```

2. **Install backend dependencies**
```bash
cd backend
pip install -r requirements.txt
```

3. **Configure AWS credentials**
```bash
aws configure
```

4. **Start backend server**
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

5. **Start frontend server**
```bash
cd local
python -m http.server 8080
```

6. **Open in browser**
```
http://localhost:8080
```

## ☁️ AWS Deployment

### Deploy Lambda Function

1. Go to AWS Lambda Console
2. Create function: `SmartLearnAI`
3. Runtime: Python 3.11
4. Copy code from `lambda_function.py`
5. Configure:
   - Memory: 512 MB
   - Timeout: 30 seconds
   - Environment variable: `DYNAMODB_TABLE=SmartLearnProgress`
6. Add permissions:
   - AmazonBedrockFullAccess
   - AmazonDynamoDBFullAccess
7. Create Function URL with CORS enabled

### Deploy Frontend to S3

1. Create S3 bucket
2. Enable static website hosting
3. Upload files from `deploy/` folder:
   - index.html
   - styles.css
   - app.js
4. Make bucket public
5. Add bucket policy for public read access

## 💰 Cost Estimate

- **Lambda**: ~$0.20 per 1M requests
- **S3**: ~$0.023 per GB storage
- **Bedrock**: ~$0.00025 per 1K tokens
- **DynamoDB**: Free tier (25 GB)

**Total**: < $5 for demo/hackathon

## 🎯 Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Python, FastAPI
- **Cloud**: AWS Lambda, S3, DynamoDB, Bedrock
- **AI Model**: Claude 3 Haiku
- **Fonts**: Inter, DM Mono

## 📊 Features in Detail

### Adaptive Learning
- Beginner → Intermediate → Advanced progression
- Based on quiz performance
- Personalized difficulty adjustment

### AI-Generated Content
- Explanations tailored to your level
- Concise summaries
- Multiple-choice quizzes with 4 options

### Progress Tracking
- Total attempts
- Average score
- Learning history
- Performance insights

## 🔒 Security

- No user authentication (demo version)
- All data stored in AWS DynamoDB
- CORS enabled for cross-origin requests
- Public read-only S3 bucket

## 📝 License

MIT License - feel free to use for learning and hackathons!

## 👨‍💻 Author

Built for hackathon demonstration

## 🙏 Acknowledgments

- AWS Bedrock for AI capabilities
- Anthropic Claude 3 Haiku model
- Inter and DM Mono fonts

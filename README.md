# AI-Powered Candidate Search

An AI-powered candidate profile search application built with Next.js, OpenAI, and Typesense. This application allows users to search for candidates using natural language queries, which are then parsed by AI to extract structured filters and keywords for efficient searching.

## Features

- **AI-Powered Search**: Use natural language to search for candidates
- **Real-time Parsing**: OpenAI GPT-4o parses user prompts into structured filters
- **Interactive UI**: Animated filter chips show how AI understood your query
- **Fast Search**: Typesense search index for quick and efficient candidate lookup
- **S3 Integration**: Direct ETL process from S3 JSONL files to Typesense index
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, SCSS Modules
- **Backend**: Next.js API Routes
- **Search Engine**: Typesense
- **AI**: OpenAI GPT-4o with function calling
- **Storage**: AWS S3 (for source data)
- **Animations**: Framer Motion

## Prerequisites

- Node.js 18+ and npm
- Typesense server (local or cloud)
- OpenAI API key
- AWS credentials with S3 access (for initial data import)

## Setup Instructions

### 1. Clone the repository and install dependencies

```bash
git clone <repository-url>
cd profile-search
npm install
```

### 2. Set up environment variables

Copy the env.template file to .env.local and fill in your credentials:

```bash
cp env.template .env.local
```

Update the following variables in .env.local:

- `TYPESENSE_HOST`, `TYPESENSE_PORT`, `TYPESENSE_PROTOCOL`, `TYPESENSE_API_KEY`: Your Typesense instance details
- `OPENAI_API_KEY`: Your OpenAI API key
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`: Your AWS credentials

### 3. Start Typesense (if running locally)

```bash
docker run -p 8108:8108 -v /tmp/typesense-data:/data typesense/typesense:0.25.2 --data-dir /data --api-key=xyz --enable-cors
```

### 4. Run the ETL process to import data from S3 to Typesense

Make a POST request to the ETL endpoint to create the Typesense collection and import data:

```bash
curl -X POST http://localhost:3000/api/etl
```

Alternatively, navigate to `http://localhost:3000/api/etl` in your browser after starting the development server.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## Usage

1. Enter a natural language search query in the search box (e.g., "ServiceNow developers in Pune with Python or JavaScript, Deloitte background")
2. Submit the search
3. Review the "AI understood" filter chips to see how your query was parsed
4. Browse the search results
5. Use pagination to navigate through additional results

## Data Structure

The application expects candidate data in JSONL format with the following fields:

- `first_name`, `last_name`: Candidate's name
- `title`: Current job title
- `summary`: Professional summary
- `expertise`: Comma-separated list of skills
- `country`, `city`: Location information
- `functional_area`, `current_industry`: Professional categorization
- `experience`: Array of work experiences with company names and employee counts
- `education`: Array of education records
- `linkedin_url`: LinkedIn profile URL

## Development

To modify the application:

- UI components are in the `components/search` directory
- API endpoints are in `src/app/api` directory
- Search logic is in `lib/typesense.js`
- AI parsing logic is in `lib/openai.js`
- ETL process is in `lib/s3-to-typesense.js`

## Deployment

Deploy the application on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

## License

MIT

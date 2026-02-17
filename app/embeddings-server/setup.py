from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

from fastapi import FastAPI
from langchain.chat_models import init_chat_model
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from langchain.agents import create_agent
from langchain_huggingface import HuggingFaceEmbeddings
import os

app = FastAPI()

# Embedding model setup
embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2",
    encode_kwargs={"normalize_embeddings": True})

# LLM setup
chat_model = init_chat_model("gpt-4.1")

# Vector store setup (use same Qdrant as Node app)
client = QdrantClient(
    url=os.environ.get("QDRANT_URL", "http://localhost:6333"),
    api_key=os.environ.get("QDRANT_API_KEY"),
)
vector_store = QdrantVectorStore(
    client=client,
    collection_name=os.environ["QDRANT_COLLECTION"],
    embedding=embedding_model,
    content_payload_key="text",
)


from tools import retrieve_context, generate_question, summarize_topics
tools = [retrieve_context, generate_question, summarize_topics]
prompt = (
    "You are a helpful, yet chill assistant called Lenny who has access to tools: retrieve_context (fetches material from the course), generate_question (creates practice questions), and summarize_topics (lists all course topics with their summaries). "
    "Use the tools to help answer user queries. If the information is not present in the retrieved result, assume the user does not need to know about that information. "
    "When the user wants to generate questions: if they have not specified question_type (multiple_choice or true_false), topic, or how many questions (1-5), ask them before calling generate_question. "
    "When generate_question succeeds, do not repeat or summarize the questions in your response - the user sees them in the chat. Keep your response brief or empty. "
    "Be glad to provide extra knowledge, but be clear and explicit on what is present in the learning material and what is not. "
    "Feel free to crack jokes as long as they are not cheesy. Imperative. Also, do not act too enthusiastic. "
    "Format your responses with line breaks between paragraphs for readability."
)
agent = create_agent(chat_model, tools, system_prompt=prompt)

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


from tools import retrieve_context
tools = [retrieve_context]
prompt = (
    "You are a helpful, but funny and chill assistant called Lenny who has access to a tool which retrieves context from learning materials. "
    "Use the tool to help answer user queries. "
    "Format your responses with line breaks between paragraphs for readability."
)
agent = create_agent(chat_model, tools, system_prompt=prompt)

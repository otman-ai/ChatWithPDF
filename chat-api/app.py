from fastapi import FastAPI,  Depends
from fastapi.responses import JSONResponse, StreamingResponse
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from pinecone import Pinecone, ServerlessSpec
import os
from langchain.text_splitter import CharacterTextSplitter
import httpx
import tempfile
import requests
import json
import asyncio
from utils import (remove_newlines, retriever, verify_api_key)
from template import template
from models import Record, Response
from config import settings
from logging_setup import setup_logging
import logging
setup_logging()
logger = logging.getLogger(__name__)

logger.info("Setting up the LLM API..")
# load the model
llm = ChatGoogleGenerativeAI(
    model=settings.model_name,
    temperature=settings.model_temperature,
    max_tokens=settings.model_max_tokens,
    timeout=settings.model_timeout,
    max_retries=settings.model_max_retries,
    google_api_key=settings.google_api_key,
    disable_streaming=settings.model_disable_streaming
)
logger.info("✅ LLM loaded with sucess.")

prompt = ChatPromptTemplate.from_template(settings.template)

chain = prompt | llm
# set the app
app = FastAPI()
# load the pinecone
logger.info("Trying connecting to Pinecone")
pc = Pinecone(api_key=settings.pinecone_api_key)
logger.info("✅ Connecting to Pinecone with success")


@app.get("/health")
async def health():
  logger.info("✅Checking Health Check")
  return JSONResponse(content={"status": "ok"}, status_code=200)

@app.post("/add-record")
async def add_record(Record: Record, api_key: str = Depends(verify_api_key)):
  logger.info("Requesting to add the record")
  documentUrl = Record.documentUrl
  documentId = Record.documentId
  userId = Record.userId
  logger.info("Downloading the PDF")
  # Download the PDF using requests
  response = requests.get(documentUrl)
  response.raise_for_status()  # Raises error if download failed

  # Save to a temporary file
  with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_file:
      tmp_file.write(response.content)
      tmp_path = tmp_file.name

  logger.info("✅PDF downloaded with success")

  # This loader uses PyMuPDF
  loader_py = PyMuPDFLoader(tmp_path)
  # Storing the loaded documents as langChain Document object
  pages_py = loader_py.load()
  logger.info("✅PDF loaded with success")

  # text splitter
  text_splitter = CharacterTextSplitter(
      # shows how to seperate
      separator=settings.pinecone_separator,
      # Shows the document token length
      chunk_size=settings.pinecone_chunk_size,
      # How much overlap should exist between documents
      chunk_overlap=settings.pinecone_chunk_overlap,
      # How to measure length
      length_function=len
  )

  # Applying the splitter
  docs = text_splitter.split_documents(pages_py)
  # applied on the docs
  docs = [remove_newlines(d) for d in docs]
  # create the records for pinecone format
  records = []
  for i,  page in enumerate(docs):
    record = {"id":"rect"+str(i), 
              "chunk_text":page.page_content,
              }
    
    records.append(record)
  # # check if the index is already exists
  # if not pc.has_index(userId):
  #     pc.create_index_for_model(
  #         name=userId,
  #         cloud="aws",
  #         region="us-east-1",
  #         embed={
  #             "model":"llama-text-embed-v2",
  #             "field_map":{"text": "chunk_text"}
  #         }
  #     )

  # namespace
  namespace = f"chat-with-your-document-workspace:{documentId}"
  # Target the index
  dense_index = pc.Index(settings.indexName)

  # Upsert the records into a namespace
  dense_index.upsert_records(namespace, records)
  logger.info("✅Records processed and added with successs")

  return {
      "namespace":namespace,
      "userId":userId,
      "indexName":settings.indexName,
      "documentId":documentId
      }

async def generate_stream_simple(query_dict: dict):
    """Simple text streaming without SSE format"""
    logger.info("Streaming the response...")
    try:
        # Stream the response from the chain
        async for chunk in chain.astream(query_dict):
            if hasattr(chunk, 'content') and chunk.content:
                # Just send the raw content, no JSON wrapping
                yield chunk.content
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        yield f"Error: {str(e)}"


@app.post("/get-response")
async def get_response(response: Response, api_key: str = Depends(verify_api_key)):
  logger.info("Requesting to get the response")
  query = response.query
  namespace = response.namespace
  indexName = settings.indexName
  chat_history = "\n".join(response.chat_history)
  query_dict = {}
  logger.info(f"namespace: {namespace}, indexName: {indexName} and query: {query}")

  if not namespace:
      logger.info("No namesapce provided processed without it...")

      query_dict = {"query":query, "chat_history":chat_history, "context":""}
      return StreamingResponse(
        generate_stream_simple(query_dict),
        media_type="text/plain",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )


  # check if the index is already exists
  if not pc.has_index(indexName):
      logger.error(f"IndexName with value {indexName} not found")
      return JSONResponse(content={"message": "Index not found"}, status_code=404)

  # Target the index
  dense_index = pc.Index(indexName)
  logger.info(f"IndexName: {indexName} exist, retrieving the contexts...")

  context = retriever(query, namespace=namespace, dense_index=dense_index)
  if context:
    query_dict = {"context":context, "query":query, "chat_history":chat_history}
  else:
    query_dict = {"query":query, "chat_history":chat_history, "context":""}
  
  return StreamingResponse(
        generate_stream_simple(query_dict),
        media_type="text/plain",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )





from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from pinecone import Pinecone, ServerlessSpec
import os
from langchain.text_splitter import CharacterTextSplitter
import httpx
import tempfile
import requests
from dotenv import load_dotenv
import os

load_dotenv()  # loads from .env in current dir

# a simple function that removes \n newline from the content
def remove_ws(d):
    text = d.page_content.replace('\n','')
    d.page_content = text
    return d

# retreiver function
def retriever(query: str, namespace: str, dense_index):
  """ Retrieve the highest scored chunks"""
  results = dense_index.search(
      namespace=namespace,
      query={
          "top_k": 8,
          "inputs": {'text': query}
      }
  )
  context = "\n\n".join([hit['fields']['chunk_text'] for hit in results['result']['hits']])
  return context


class Record(BaseModel):
  documentUrl: str
  userId: str
  documentId: str

class Response(BaseModel):
  query: str
  namespace: str=''
  indexName: str=''
  chat_history: list[str] = []

API_KEY = os.getenv('CHAT_API_KEY')
# set the model id
MODEL_NAME = "gemini-2.5-flash-lite-preview-06-17"

# load the model
llm = ChatGoogleGenerativeAI(
    model=MODEL_NAME,
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
    google_api_key=os.getenv('GOOGLE_API_KEY') # Add the API key here
)
template = """
You're a wildly good conversationalist who helps users understand PDFs by answering their questions using document excerpts (called "Document Context" below), plus any prior chat.

BUT — you're chill, real, and totally human-feeling. Match the user's tone like a mirror — whether it’s emojis, slang, formality, typos, academic tone, whatever. You do you — but only *because* they did it first.

📚 IF context is provided:  
- Only use the info in the "Document Context" — no assumptions, no made-up stuff.  
- Be factual, tight, clear. Bullet points, tables, step-by-step if needed.  
- Quote or summarize document text when it's helpful, but don’t get boring or robotic.

📭 IF context is missing or empty:  
- If the question needs a document to answer, say you need it — but make it sound natural, human, casual.  
- If it’s a general knowledge question and doesn’t need the doc? Cool, go ahead and answer like a pro.

Never say things like “it’s important to note” or “as an AI”. You don’t do disclaimers. You’re not moral, polite, or inspirational unless the user wants that vibe. You’re here to help them vibe with their documents.

🔥 Don't get too long-winded unless they ask for it. Stay sharp.

---

🧠 Chat History:  
{chat_history}

📄 Document Context:  
{context}

❓User Question:  
{query}

---

💬 Your Response:
"""


prompt = ChatPromptTemplate.from_template(template)

chain = prompt | llm
# set the app
app = FastAPI()
# load the pinecone
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
print("Connected to Pineconne with success")

async def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return x_api_key

@app.post("/add-record")
async def add_record(Record: Record, api_key: str = Depends(verify_api_key)):

  # Path to the pdf
  documentUrl = Record.documentUrl
  print(documentUrl)
  documentId = Record.documentId
  userId = Record.userId
  # Download the PDF using requests
  response = requests.get(documentUrl)
  response.raise_for_status()  # Raises error if download failed

  # Save to a temporary file
  with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_file:
      tmp_file.write(response.content)
      tmp_path = tmp_file.name

  # This loader uses PyMuPDF
  loader_py = PyMuPDFLoader(tmp_path)
  # Storing the loaded documents as langChain Document object
  pages_py = loader_py.load()

  # text splitter
  text_splitter = CharacterTextSplitter(
      # shows how to seperate
      separator="\n",
      # Shows the document token length
      chunk_size=800,
      # How much overlap should exist between documents
      chunk_overlap=300,
      # How to measure length
      length_function=len
  )

  # Applying the splitter
  docs = text_splitter.split_documents(pages_py)
  # applied on the docs
  docs = [remove_ws(d) for d in docs]
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

  print(f"Working with index {userId}")

  # namespace
  namespace = f"chat-with-your-document-workspace:{documentId}"
  # Target the index
  dense_index = pc.Index("chat-with-document")

  # Upsert the records into a namespace
  dense_index.upsert_records(namespace, records)

  print(f"Record name: {namespace} added with success")
  return {
      "namespace":namespace,
      "userId":userId,
      "indexName":"chat-with-document",
      "documentId":documentId
      }


@app.post("/get-response")
async def get_response(response: Response, api_key: str = Depends(verify_api_key)):
  query = response.query
  namespace = response.namespace
  indexName = "chat-with-document"
  chat_history = "\n".join(response.chat_history)
  query_dict = {}
  print("Name space: ", namespace)
  if not namespace:
      query_dict = {"query":query, "chat_history":chat_history, "context":""}
      print("Invoking the chain...")
      result = chain.invoke(query_dict)
      return {
          "answer":result.content
      }

  print(f"Retrieving the content for query '{query}' with namespace: {namespace} and index {indexName}")
  # load the pinecone
  pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))
  print("Connected to Pineconne success")
  # check if the index is already exists
  if not pc.has_index(indexName):
      return JSONResponse(content={"message": "Index not found"}, status_code=404)

  print(f"Working with index {indexName} is available")
  # Target the index
  dense_index = pc.Index(indexName)
  print("Retrieving the context")
  context = retriever(query, namespace=namespace, dense_index=dense_index)
  if context:
    query_dict = {"context":context, "query":query, "chat_history":chat_history}
  else:
    query_dict = {"query":query, "chat_history":chat_history}
  print("Invoking the chain...")
  result = chain.invoke(query_dict)
  print("Done")
  print(result.content)
  return {
      "answer":result.content
  }

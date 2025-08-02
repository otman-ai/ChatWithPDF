from typing import TYPE_CHECKING
from fastapi import  Header
from config import settings

if TYPE_CHECKING:
    from pinecone import Index
    from langchain.text_splitter import CharacterTextSplitter

async def verify_api_key(x_api_key: str = Header(...)) -> str:
    """
    Verify the API key from the request header
    Args:
        x_api_key (str): The API key from the request header.
    Returns:
        x_api_key (str): The verified API key.
    """
    from fastapi import HTTPException

    if x_api_key != settings.chat_api_key:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return x_api_key

def remove_newlines(doc: "CharacterTextSplitter") -> "CharacterTextSplitter":
    """
    Remove new lines from the doc.
    Args:
        doc (CharacterTextSplitter) : document to process
    Returns:
        doc  (CharacterTextSplitter) : updated document with new lines removed
    """
    text = doc.page_content.replace('\n','')
    doc.page_content = text
    return doc

def retriever(query: str, namespace: str, dense_index: "Index") -> str:

    """
    Retrieve the highest scored chunks.
    Args:
        query (str) : the search query
        namespace (str) : the namespace to retrieve its document
        dense_index (Index) : the pinecone index to search in
    Returns:
        context (str) : context contains chunk text with highest score  
    """
    results = dense_index.search(
        namespace=namespace,
          query={
              "top_k": 8,
              "inputs": {'text': query}
          }
    )
    context = "\n\n".join([hit['fields']['chunk_text'] for hit in results['result']['hits']])
    return context



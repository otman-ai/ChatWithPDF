from pydantic import BaseModel

class Record(BaseModel):
  documentUrl: str
  userId: str
  documentId: str

class Response(BaseModel):
  query: str
  namespace: str=''
  indexName: str=''
  chat_history: list[str] = []
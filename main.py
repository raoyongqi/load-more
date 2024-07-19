from fastapi import FastAPI, Query
from typing import List, Dict
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

fake_db = [f"Item {i}" for i in range(1, 101)]
origins = [
    "http://localhost",
    "http://localhost:3000",
    "*",  # 允许所有源访问
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/items")
def read_items(page: int = 1, page_size: int = 10) -> Dict[str, List[str]]:
    start = (page - 1) * page_size
    end = start + page_size
    return {"items": fake_db[start:end]}

from fastapi import FastAPI, Query
from typing import List, Dict
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException

import os
app = FastAPI()

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


 

# 文件夹路径
FOLDER_PATH = "cliped_folder"  # 设置为你的基础目录路径

# app.py
from fastapi import FastAPI, HTTPException, Path, Query

@app.get("/files/", response_model=List[str])
def list_files(skip: int = Query(0), limit: int = Query(1)):
    try:
        files = os.listdir(FOLDER_PATH)
        files = sorted(files)  # 按名称排序
        return files[skip: skip + limit]
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Folder not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/all_files/", response_model=List[str])
def list_all_files():
    try:
        files = os.listdir(FOLDER_PATH)
        files = sorted(files)  # 按名称排序
        return files
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Folder not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

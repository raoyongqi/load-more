from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os

app = FastAPI()

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 允许的来源
    allow_credentials=True,
    allow_methods=["*"],  # 允许的HTTP方法
    allow_headers=["*"],  # 允许的HTTP头
)

# 文件夹路径
FOLDER_PATH = "cliped_folder"  # 设置为你的基础目录路径

@app.get("/files", response_model=List[str])
def list_files(skip: int = Query(0), limit: int = Query(1)):
    try:
        files = os.listdir(FOLDER_PATH)
        files = sorted(files)  # 按名称排序
        selected_files = files[skip: skip + limit]
        return selected_files
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Folder not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tiff/{filename}")
def get_tiff(filename: str):
    tiff_path = os.path.join(FOLDER_PATH, filename)
    if os.path.exists(tiff_path):
        return FileResponse(tiff_path, media_type='image/tiff', filename=filename)
    else:
        raise HTTPException(status_code=404, detail="TIFF file not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

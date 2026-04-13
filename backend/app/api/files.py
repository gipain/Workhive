import uuid
import os
import shutil

from fastapi import APIRouter, UploadFile, File

from app.api.deps import CurrentUser
from app.core.config import settings
from app.core.exceptions import BadRequestError

router = APIRouter(prefix="/files", tags=["Файли"])

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".zip", ".rar", ".txt", ".pptx", ".xlsx"}


@router.post("/upload")
def upload_file(file: UploadFile = File(...), current_user: CurrentUser = None):
    if not file.filename:
        raise BadRequestError("Файл не обрано")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise BadRequestError(f"Тип файлу {ext} не дозволений. Дозволені: {', '.join(ALLOWED_EXTENSIONS)}")

    content = file.file.read()
    if len(content) > settings.max_file_size_bytes:
        raise BadRequestError(f"Файл перевищує {settings.MAX_FILE_SIZE_MB}MB")

    upload_dir = settings.upload_path / str(current_user.id)
    upload_dir.mkdir(parents=True, exist_ok=True)

    safe_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = upload_dir / safe_filename

    with open(file_path, "wb") as f:
        f.write(content)

    file_url = f"/files/uploads/{current_user.id}/{safe_filename}"
    return {"url": file_url, "filename": file.filename, "size": len(content)}

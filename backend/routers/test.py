from fastapi import APIRouter
from backend.utils.email_sender import send_email

router = APIRouter()

@router.get("/test-mail")
def test_mail():
    ok = send_email(
        to_email="senacoskunyurek@gmail.com",
        subject="Test Mail",
        body="<b>Email sistemi çalışıyor</b>"
    )
    return {"success": ok}

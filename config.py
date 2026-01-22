import os
from dotenv import load_dotenv

load_dotenv()

# API Keys
ZAI_API_KEY = os.getenv("ZAI_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = "thai_constitution_db"

# API Endpoint for Pro Plan (Coding Plan)
# IMPORTANT: Adjust this if the specific endpoint for Coding Plan differs.
# Based on chat history, it might be https://open.bigmodel.cn/api/coding/paas/v4 or standard.
# For zhipuai SDK, we usually just need the API Key, but if we need to override the base URL:
ZAI_BASE_URL = "https://open.bigmodel.cn/api/paas/v4/"

# Categories (18 categories as per spec)
CATEGORIES = {
    "preamble": "คำปรารภ",
    "general": "บททั่วไป (เอกราช, อาณาเขต, ศาสนา)",
    "monarchy": "พระมหากษัตริย์/องคมนตรี",
    "rights_duties": "สิทธิเสรีภาพและหน้าที่ของคนไทย",
    "state_policies": "หน้าที่/แนวนโยบายของรัฐ",
    "reform": "การปฏิรูปประเทศ",
    "legislative": "อำนาจนิติบัญญัติ (ส.ส., ส.ว., การเลือกตั้ง)",
    "executive": "อำนาจบริหาร (ครม., นายกฯ)",
    "judicial": "อำนาจตุลาการ (ศาลยุติธรรม, ศาลปกครอง, ศาลทหาร)",
    "conflict_interest": "การขัดกันของผลประโยชน์",
    "independent_orgs": "องค์กรอิสระ (กกต., ป.ป.ช., สตง.)",
    "const_court": "ตุลาการ/ศาลรัฐธรรมนูญ",
    "ethics": "จริยธรรมของผู้ดำรงตำแหน่ง",
    "local_admin": "การปกครองส่วนท้องถิ่น",
    "amendment": "การแก้ไขเพิ่มเติมรัฐธรรมนูญ",
    "coup_power": "อำนาจคณะรัฐประหาร (นิรโทษกรรม, ม.17, ม.44)",
    "final_provisions": "บทสุดท้าย",
    "transitory": "บทเฉพาะกาล",
}

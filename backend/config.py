import os
from dotenv import load_dotenv

load_dotenv()

# --- 🔑 API KEYS ---
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
TYPHOON_OCR_API_KEY = os.getenv("TYPHOON_OCR_API_KEY")

# --- ⚙️ PROJECT SETTINGS ---
TARGET_CONST_ID = "con2560"  #

# --- 📂 PATH CONFIGURATION ---
# โฟลเดอร์ต้นทาง
IMAGE_FOLDER = "images_raw"
LEGACY_JSON = os.path.join("legacy_json", "constitutions.json")

# โฟลเดอร์ปลายทาง
OUTPUT_DIR_CLEAN = os.path.join("json_output", "clean")
OUTPUT_DIR_FINAL = os.path.join("json_output", "final")

# ชื่อไฟล์ต่างๆ (สร้างอัตโนมัติตาม ID)
CHECKPOINT_FILE = f"{TARGET_CONST_ID}_checkpoint.json"
FILE_CLEAN = os.path.join(OUTPUT_DIR_CLEAN, f"{TARGET_CONST_ID}_clean.json")
FILE_FINAL_SUMMARY = os.path.join(OUTPUT_DIR_FINAL, f"{TARGET_CONST_ID}_full_summary.json")

# OCR Settings
IMAGES_PER_BATCH = 3

# --- 📚 CATEGORIES ---
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

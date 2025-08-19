import logging
from logging.handlers import RotatingFileHandler
import os
import sys
from dotenv import load_dotenv

load_dotenv()

# config with ENV
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()  # INFO/DEBUG/WARNING/ERROR
LOG_TO_FILE = os.getenv("LOG_TO_FILE", "false").lower() == "true"
LOG_FORMAT = "%(asctime)s.%(msecs)03d [%(levelname)s] [%(filename)s:%(lineno)d - %(funcName)s()] %(message)s"
DATE_FORMAT = "%d-%m-%Y %H:%M:%S"

# reset root logger
root = logging.getLogger()
root.handlers.clear()
root.setLevel(LOG_LEVEL)

# STDOUT handler default for kubernetes
console_handler = logging.StreamHandler(stream=sys.stdout)
console_handler.setFormatter(logging.Formatter(fmt=LOG_FORMAT, datefmt=DATE_FORMAT))
root.addHandler(console_handler)

# additional option for save in file
if LOG_TO_FILE:
    os.makedirs("logs", exist_ok=True)
    file_handler = RotatingFileHandler("logs/workbridge.log", maxBytes=5_000_000, backupCount=3)
    file_handler.setFormatter(logging.Formatter(fmt=LOG_FORMAT, datefmt=DATE_FORMAT))
    file_handler.setLevel(LOG_LEVEL)
    root.addHandler(file_handler)

# uvicorn/fastapi logger compatibility
for name in ("uvicorn", "uvicorn.error", "uvicorn.access", "fastapi"):
    lg = logging.getLogger(name)
    lg.setLevel(LOG_LEVEL)
    lg.propagate = True









os.makedirs("logs", exist_ok=True)

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

log_file = "logs/workbridge.log"




# Configure request logger handlers
#logFormatter = logging.Formatter(fmt='%(asctime)s.%(msecs)03d %(levelname)s: %(name)s %(message)s',  datefmt='%d-%m-%Y %H:%M:%S')
# Log format: includes filename, line number, and function name
logFormatter = logging.Formatter(
    fmt="%(asctime)s.%(msecs)03d [%(levelname)s] [%(filename)s:%(lineno)d - %(funcName)s()] %(message)s",
    datefmt="%d-%m-%Y %H:%M:%S"
)


#File handler
logger_file_handler = RotatingFileHandler(log_file, maxBytes=5000000, backupCount=3)
logger_file_handler.setFormatter(logFormatter)
logger_file_handler.setLevel(logging.INFO)


logger.addHandler(logger_file_handler)

# Console handler (for dev output)
consoleHandler = logging.StreamHandler()
consoleHandler.setFormatter(logFormatter)
logger.addHandler(consoleHandler)

# Avoid duplicate handlers
if not logger.handlers:
    logger.addHandler(logger_file_handler)
    logger.addHandler(consoleHandler)



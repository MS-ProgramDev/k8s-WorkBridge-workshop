import logging
from logging.handlers import RotatingFileHandler
import os
import sys

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



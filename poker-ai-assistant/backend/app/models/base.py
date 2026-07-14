from sqlalchemy.orm import declarative_base
from sqlalchemy.types import TypeDecorator, JSON, String
import uuid as uuid_pkg

class UUID(TypeDecorator):
    impl = String
    cache_ok = True
    def process_bind_param(self, value, dialect):
        if value is None: return value
        return str(value)
    def process_result_value(self, value, dialect):
        if value is None: return value
        return uuid_pkg.UUID(value)

class JSONB(TypeDecorator):
    impl = JSON
    cache_ok = True

Base = declarative_base()

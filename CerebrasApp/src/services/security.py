from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from src.core.config import settings
from src.models.schemas import User
from src.services.supabase import supabase

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 setup
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class SecurityService:
    def __init__(self):
        self.secret_key = settings.SECRET_KEY
        self.algorithm = settings.ALGORITHM
        self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        """Generate password hash."""
        return pwd_context.hash(password)

    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate a user and return user object if valid."""
        try:
            user = await supabase.table("users").select("*").eq("email", email).single().execute()
            if not user.data:
                return None
            if not self.verify_password(password, user.data["encrypted_password"]):
                return None
            return User(**user.data)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Authentication error: {str(e)}"
            )

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token."""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)

    async def get_current_user(self, token: str = Depends(oauth2_scheme)) -> User:
        """Get current user from JWT token."""
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            email: str = payload.get("sub")
            if email is None:
                raise credentials_exception
        except JWTError:
            raise credentials_exception

        user = await supabase.table("users").select("*").eq("email", email).single().execute()
        if not user.data:
            raise credentials_exception
        return User(**user.data)

    def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data using Fernet."""
        from cryptography.fernet import Fernet
        key = settings.ENCRYPTION_KEY
        f = Fernet(key)
        return f.encrypt(data.encode()).decode()

    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data using Fernet."""
        from cryptography.fernet import Fernet
        key = settings.ENCRYPTION_KEY
        f = Fernet(key)
        return f.decrypt(encrypted_data.encode()).decode()

    def sanitize_data_for_gdpr(self, data: dict) -> dict:
        """Remove or mask sensitive data for GDPR compliance."""
        sensitive_fields = ["password", "credit_card", "ssn", "phone"]
        for field in sensitive_fields:
            if field in data:
                data[field] = "***REDACTED***"
        return data

    def log_data_access(self, user_id: str, data_type: str, action: str):
        """Log data access for GDPR compliance."""
        supabase.table("access_logs").insert({
            "user_id": user_id,
            "data_type": data_type,
            "action": action,
            "timestamp": datetime.utcnow().isoformat(),
            "ip_address": request.client.host
        }).execute()
from fastapi import APIRouter, Depends, HTTPException, status
from src.models.schemas import UserCreate, User, Token
from src.services.auth import AuthService
from src.services.user import UserService
from src.core.config import settings

router = APIRouter()
auth_service = AuthService()
user_service = UserService()

@router.post("/signup", response_model=Token)
async def create_user(user_data: UserCreate):
    user = await user_service.create_user(user_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Add free credits for new user
    await user_service.add_credits(user.id, settings.NEW_USER_CREDITS)
    
    # Create access token
    access_token = auth_service.create_access_token(data={"sub": user.email})
    return Token(access_token=access_token)

@router.post("/login", response_model=Token)
async def login(user_data: UserCreate):
    user = await auth_service.authenticate_user(user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = auth_service.create_access_token(data={"sub": user.email})
    return Token(access_token=access_token)

@router.get("/me", response_model=User)
async def get_current_user(current_user: User = Depends(auth_service.get_current_user)):
    return current_user

@router.get("/credits")
async def get_user_credits(current_user: User = Depends(auth_service.get_current_user)):
    credits = await user_service.get_credits(current_user.id)
    return {"credits": credits}
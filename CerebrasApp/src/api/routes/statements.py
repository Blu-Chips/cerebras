from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from src.models.schemas import StatementAnalysis, User
from src.services.auth import AuthService
from src.services.statement import StatementService
from src.services.user import UserService

router = APIRouter()
auth_service = AuthService()
statement_service = StatementService()
user_service = UserService()

@router.post("/upload")
async def upload_statement(
    file: UploadFile = File(...),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Upload a bank statement PDF file"""
    # Check if user has credits
    credits = await user_service.get_credits(current_user.id)
    if credits <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Insufficient credits"
        )
    
    # Validate file
    if not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed"
        )
    
    # Process statement
    result = await statement_service.process_statement(file, current_user.id)
    
    # Deduct credit
    await user_service.deduct_credit(current_user.id)
    
    return result

@router.get("/analysis/{file_id}", response_model=StatementAnalysis)
async def get_analysis(
    file_id: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get analysis results for a specific statement"""
    analysis = await statement_service.get_analysis(file_id, current_user.id)
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    return analysis

@router.get("/download/{file_id}")
async def download_excel(
    file_id: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Download Excel version of the statement"""
    excel_file = await statement_service.get_excel_file(file_id, current_user.id)
    if not excel_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    return excel_file
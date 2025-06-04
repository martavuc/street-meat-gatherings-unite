# backend/schemas/auth.py
from pydantic import BaseModel, EmailStr, constr

# ---------- INPUT DTOs ----------

class SignupIn(BaseModel):
    name: str
    email: EmailStr
    password: constr(min_length=8)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


# ---------- OUTPUT DTOs ----------

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        orm_mode = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

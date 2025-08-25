from setuptools import setup, find_packages

setup(
    name="nyay_setu_backend",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        'fastapi>=0.68.0',
        'uvicorn>=0.15.0',
        'python-multipart>=0.0.5',
        'python-jose[cryptography]>=3.3.0',
        'passlib[bcrypt]>=1.7.4',
        'python-dotenv>=0.19.0',
        'sqlalchemy>=1.4.0',
        'pydantic>=1.8.0',
        'alembic>=1.7.0',
        'psycopg2-binary>=2.9.0',
    ],
)

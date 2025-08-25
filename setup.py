from setuptools import setup, find_packages

setup(
    name="nyay_setu",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        # List your main dependencies here
        'fastapi>=0.68.0',
        'uvicorn>=0.15.0',
    ],
)

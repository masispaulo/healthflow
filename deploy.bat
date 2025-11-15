@echo off
set /p PROJECT_ID="Enter your Google Cloud Project ID: "
set /p SERVICE_NAME="Enter your Cloud Run Service Name (e.g., healthflow): "
set /p REGION="Enter the region (e.g., us-central1): "

echo.
echo Using the following configuration:
echo Project ID: %PROJECT_ID%
echo Service Name: %SERVICE_NAME%
echo Region: %REGION%
echo.

set IMAGE_NAME=gcr.io/%PROJECT_ID%/%SERVICE_NAME%

echo --- Building the container image... ---
gcloud builds submit --tag %IMAGE_NAME% .

if %errorlevel% neq 0 (
    echo.
    echo !!! Build failed. Please check the error messages above.
    goto :eof
)

echo.
echo --- Deploying to Cloud Run... ---
gcloud run deploy %SERVICE_NAME% --image %IMAGE_NAME% --platform managed --region %REGION% --allow-unauthenticated

if %errorlevel% neq 0 (
    echo.
    echo !!! Deploy failed. Please check the error messages above.
    goto :eof
)

echo.
echo --- Deployment successful! ---
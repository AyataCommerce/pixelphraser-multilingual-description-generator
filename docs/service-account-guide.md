# Steps to Enable Cloud Vision API and Generate Access Credentials

## 1. Enable Cloud Vision API
- Go to **Google Cloud Console** > **APIs & Services** > **Library**
- Search for **"Cloud Vision API"**
- Click **Enable**

## 2. Create a Service Account
- Go to **IAM & Admin** > **Service accounts** > **+ Create Service Account**
- Enter the required details
- Optionally, grant the **"Cloud Vision API User"** role (recommended)
- Click **Done**

## 3. Create an Access Key
- Go to **IAM & Admin** > **Service accounts**
- Select your service account
- Go to the **"Keys"** tab
- Click **"Add Key"** > **"Create new key"**
- Choose **"JSON"**, then click **Create**
- Securely store the downloaded JSON file

## 4. Convert the JSON Key File to Base64


# PixelPhraser - CommerceTools Connector for Product Description Generation

<p align="center">
  <a href="https://commercetools.com/">
    <img alt="commercetools logo" src="https://unpkg.com/@commercetools-frontend/assets/logos/commercetools_primary-logo_horizontal_RGB.png">
  </a></br>
  <a href="https://pixelphraser-ct-connector.s3.us-east-1.amazonaws.com/PixelPhraser.jpeg">
    <img alt="pixel-phraser-logo" src="https://pixelphraser-ct-connector.s3.us-east-1.amazonaws.com/PixelPhraser.jpeg">
  </a><br>
</p>

# PixelPhraser - CommerceTools Connector 
The PixelPhraser – CommerceTools Connector automates the creation of product descriptions by leveraging Google Cloud Vision AI and Generative AI. These technologies analyze product images to generate detailed, relevant, and engaging descriptions. The connector includes a Custom Application within the CommerceTools platform, enabling users to efficiently review and manage these AI-generated descriptions.

Additionally, the generated descriptions are automatically translated into multiple languages. The target languages can be configured directly within the Merchant Center Custom Application, allowing for seamless localization and a tailored experience for global markets.

---

## Table of Contents
1. [Introduction](#introduction)
2. [Features](#features)
3. [Functional Overview](#architecture-diagram)
4. [Architecture Diagram](#functional-overview)
5. [Application Workflow](#application-workflow)
6. [Technology Stack](#technology-stack)
7. [Key Components](#key-components)
8. [Prerequisites and Setup](#prerequisites-and-setup)
9. [Running the Application Locally](#running-the-application-locally)
10. [Uninstalling the Connector](#uninstalling-the-connector)
11. [References](#references)
12. [Demonstration](#demonstration)

---

## <a id="introduction"></a> 1. Introduction
The PixelPhraser – CommerceTools Connector automates product description creation, leveraging Google Cloud Vision AI and Generative AI to analyze product images and generate detailed, engaging, and SEO-friendly descriptions. This solution intelligently interprets product images by identifying objects, colors, and sentiments, transforming this data into informative content that resonates with customers and improves search visibility.

A Custom Application within the CommerceTools platform empowers users to review, approve, or reject these AI-generated descriptions, ensuring brand consistency and high content quality. This streamlined process significantly enhances operational efficiency while improving the accuracy and appeal of product information.

Additionally, the generated descriptions are automatically translated into multiple languages, with the target languages configurable within the Merchant Center Custom Application. This enables effortless localization, helping merchants deliver a personalized shopping experience across global markets—ultimately driving sales and increasing customer satisfaction.

## <a id="features"></a> 2. Features
- **Automated Event-Driven Processing**
- **Advanced Image Analysis with Vision AI**
- **Generative AI-Powered Product Description Generation**
- **Temporary Storage Management**
- **Custom Application for Review**

## <a id="functional-overview"></a> 3. Functional Overview
This connector is designed to automate the generation of product descriptions based on product creation events. Below is a step-by-step breakdown of its functionality:

1. **Receiving Event Triggers:**
   - The connector listens for product creation events to initiate the description generation process.
2. **Checking Attribute:**
   - It checks if the `generateDescription` attribute is set to `true`. 
   - If `true`, the connector proceeds with the description generation; if `false`, the process is skipped.
3. **Analyzing Product Images:**
   - The connector interprets product images using Vision AI.
   - It captures various attributes such as labels, colors, text, objects, and web entities from the images.
4. **Generating Descriptions:**
   - High-quality, detailed descriptions are generated based on the analyzed image data using Google Generative AI.
5. **Translate Descriptions:**
   - These generated descriptions are then translated into the configured languages.
6. **Updating Custom Objects:**
   - The generated descriptions are stored temporarily in CommerceTools Custom Objects for customer review.
7. **User  Interface for Review and Configuration:**
   - Customers can search for descriptions, view associated images, and accept or reject the generated content through a user-friendly interface. Additionally, this Custom Application allows customers to seamlessly configure the languages into which the descriptions are translated.

## <a id="architecture-diagram"></a> 4. Architecture Diagram
![Architecture Diagram](docs/architecture-diagram.png)

## <a id="application-workflow"></a> 5. Application Workflow
- PixelPhraser Workflow
![Workflow](docs\demonstration_gif\pixelphraser-workflow-gif.gif)

1. **Product Event Trigger**  
   When a product is created or updated in **Commercetools** **[A]**, events such as `ProductCreated`, `ProductImageAdded`, or `ProductVariantAdded` are triggered. These events produce a message that is sent to a configured **Pub/Sub** **[B]**.
2. **Message Forwarding**  
   The message from **Commercetools** **[A]** is forwarded by **Pub/Sub** **[B]** to the **Connector Controller** **[C]**.
3. **Image URL Extraction & Vision AI Processing**  
   The **Connector Controller** **[C]** extracts the image URL from the message data and sends it to **Vision AI** **[D]** for analysis.
4. **Description Generation with Gemini**  
   The analysis results from **Vision AI** **[D]** are sent to **Gemini** **[E]**, which generates product descriptions in the configured languages.
5. **Storing Descriptions in Custom Objects**  
   The generated descriptions from **Gemini** **[E]** are stored in **Commercetools Custom Objects** **[F]**.
6. **Review in Merchant Center**  
   Descriptions from **Custom Objects** **[F]** are fetched and displayed in the **Merchant Center Custom Application** **[G]** for review.
7. **Final Save to Product Catalog**  
   Once reviewed in the **Merchant Center Custom Application** **[G]**, the final descriptions are saved into the **Commercetools Product Catalog** **[H]**.

## <a id="technology-stack"></a> 6. Technology Stack
- Node.js  
- TypeScript  
- Google Cloud Pub/Sub  
- Gemini  
- Vision AI  
- React.js  

## <a id="key-components"></a> 7. Key Components
### Event Listener
- **Functionality:** Listens for product publication events in CommerceTools. Receives the event payload, parses product details, and checks if the "generateDescription" flag is true. If the attribute is present and true, it triggers description generation; otherwise, it skips the process.
### Image Analysis with Vision AI
- **Module:** `productAnalysis`
- **Functionality:** Analyzes product image URLs, extracting key visual elements such as labels, objects, colors, text, and web entities.
- **Outputs:** Structured image data providing foundational information for description generation. 
### Description Generation and Translation with Generative AI
- **Module:** `generateProductDescription`, `translateProductDescription`
- **Functionality:** Generates product descriptions based on the structured image data. Ensures descriptions are relevant and engaging for e-commerce use, then translate the descriptions into the configured languages.
- **Outputs:** Fully generated multilingual product description ready for integration in CommerceTools.
### Temporary Storage in CommerceTools
- **Creation:** Initializes a custom object with placeholder metadata and description data.
- **Update:** Finalizes the object by adding generated description and relevant metadata, preparing it for customer review.
### User  Interface for Review and Configuration
- **Functionality:** Allows customers to review and approve or reject these AI-generated descriptions. Additionally, this Custom Application allows customers to seamlessly configure the languages into which the descriptions are translated.

## <a id="prerequisites-and-setup"></a> 8. Prerequisites and Setup
### 8.1 CommerceTools Account and API Keys
1. Navigate to **Settings > Developer settings > Create new API client**.
2. Capture the following details:
   - `PROJECT_KEY`
   - `CLIENT_SECRET`
   - `CLIENT_ID`
   - `AUTH_URL`
   - `API_URL`
   - `SCOPE`
   - `REGION`

### 8.2 Google Cloud Platform (GCP) Setup
1. Create a project in GCP and enable Vision API and Generative AI.
2. Required credentials:
   - **Base64-encoded Service Account:** `BASE64_ENCODED_GCP_SERVICE_ACCOUNT`
   - **Generative AI API Key and Model:** `GENERATIVE_AI_API_KEY`, `GEMINI_MODEL`

### 8.3 Environment Configuration
Configure your `.env` file with the following details:
#### Event Application
```plaintext
# CommerceTools Credentials
PROJECT_KEY=[Commercetools Composable Commerce project key]
CLIENT_SECRET=[Commercetools Composable Commerce client secret]
CLIENT_ID=[Commercetools Composable Commerce client ID]
AUTH_URL=[https://auth.commercetools.com/oauth/token]
API_URL=[https://api.commercetools.com]
SCOPE=[manage_project:PROJECT_KEY]
REGION=[Commercetools Composable Commerce API region]

# Google Cloud Platform Credentials
BASE64_ENCODED_GCP_SERVICE_ACCOUNT=[GCP Service Account in Base64 encoded format]
GEMINI_MODEL=[GEMINI_MODEL, example; [gemini-1.5-flash, gemini-2.0-pro]]
GENERATIVE_AI_API_KEY=[GENERATIVE AI API KEY to access Gemini]

#Commercetools Event Trigger 
EVENT_TRIGGER_NAME=[Set the event trigger name. If there are multiple, separate them with commas. Supported triggers; [ProductVariantAdded, ProductImageAdded, ProductPublished]]
```
#### Merchant Center Custom Application
```plaintext
CUSTOM_APPLICATION_ID=[The Custom Application ID from the Merchant Center] 
CLOUD_IDENTIFIER=[The Cloud Identifier for the application ]
ENTRY_POINT_URI_PATH=[The Application entry point URI path ] 
ENABLE_NEW_JSX_TRANSFORM=["true"] 
FAST_REFRESH=["true" ]
```

## <a id="running-the-application-locally"></a> 9. Running the Application Locally
To set up and run PixelPhraser on your local machine:
1. **Clone the Repository:**
   ```bash
   git clone https://github.com/amal-thomson/pixelphraser.git
   ```
2. **Navigate to the Project Directory:**
   ```bash
   cd pixelphraser/event-pixelphraser #for event application
   or
   cd pixelphraser/mc-pixelphraser #for custom application
   ```
3. **Install Dependencies:**
   ```bash
   yarn install
   ```
4. **Configure Environment Variables:** Ensure the `.env` file is updated as described above.
5. **Start the Application in Development Mode:**
   ```bash
   yarn start:dev #for event application
   or
   yarn start #for custom application
   ```
This command initializes the application, enabling it to listen for product events and process them according to the setup flow.

## <a id="uninstalling-the-connector"></a> 10. Uninstalling the Connector
To uninstall the PixelPhraser Connector from your CommerceTools project:
### Method 1: Using the CommerceTools API
- Send a DELETE request to the Custom Object's API endpoint. Refer to the [API Documentation for DELETE Requests](https://docs.commercetools.com/api/projects/subscriptions#delete-subscription).
### Method 2: Through Merchant Center
- Navigate to **Settings > Developer settings** and remove the API client associated with PixelPhraser.

## <a id="references"></a> 11. References
- [CommerceTools Documentation](https://docs.commercetools.com/)
- [Google Cloud Documentation](https://cloud.google.com/docs)

## <a id="demonstration"></a> 12. Demonstration
Explore the visual and video materials that showcase how the **PixelPhraser – CommerceTools Connector** works in action.

- Image Demonstrations
Browse the collection of sample images in [`demonstration_images`](docs/demonstration_images) directory.

- Video Demonstration
Watch the full walkthrough located in the [`demonstration_gif`](docs/demonstration_gif) directory. 

- PixelPhraser Configuration
![Configuration](docs\demonstration_gif\pixelphraser-configuration-gif.gif)
- First
![](docs\demonstration_gif\pixelphraser-configuration-gif.gif)
- Second
![](docs/demonstration_gif/pixelphraser-configuration-gif.gif)

- PixelPhraser Workflow
![Workflow](docs\demonstration_gif\pixelphraser-workflow-gif.gif)


---

This documentation provides a structured guide for setting up, operating, and uninstalling the PixelPhraser Connector for efficient product description automation in CommerceTools.

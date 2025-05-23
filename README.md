# PixelPhraser
## CommerceTools Connector for Product Description Generation

<p align="center">
  <a href="https://commercetools.com/">
    <img alt="commercetools logo" src="https://unpkg.com/@commercetools-frontend/assets/logos/commercetools_primary-logo_horizontal_RGB.png">
  </a></br>
  <a href="https://pixelphraser-ct-connector.s3.us-east-1.amazonaws.com/PixelPhraser.jpeg">
    <img alt="pixel-phraser-logo" src="https://pixelphraser-ct-connector.s3.us-east-1.amazonaws.com/PixelPhraser.jpeg">
  </a><br>
</p>

The PixelPhraser - Commercetools Connector automates product description creation, leveraging Google Cloud Vision AI and Generative AI to analyze product images and generate detailed, engaging descriptions. This solution interprets images to identify objects, colors, and sentiments, transforming this data into informative and SEO-friendly descriptions. A custom application within the Commercetools platform allows customers to review and approve or reject these AI-generated descriptions, ensuring quality and consistency. This streamlines the description creation process, enhancing efficiency and improving the accuracy and engagement of product content, ultimately driving sales and boosting customer satisfaction.

Additionally, the connector supports translation of product descriptions into multiple locales. These translations can be easily configured and managed directly from the Commercetools Merchant Center, allowing businesses to effortlessly scale content across regions and languages.


## Commercetools Connector Workflow

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


## Technology Stack

- Node.js  
- TypeScript  
- Google Cloud Pub/Sub  
- Gemini  
- Vision AI  
- React.js  

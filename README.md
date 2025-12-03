Welcome to COSC310 Netflix & Coding Online Web Shopping Platform! We hope you find this system useful and efficient.

Team Members:
Kithe Kisia
Coran McColm 
Fraser Muller
Harrison Kayihura

    Installation Instructions: Step-by-step setup procedures for running the system using Docker:
Running the system using docker requires a few steps. BLAH BLAH BLAH. You must then run the following commands:
Docker compose up -d

    Dependencies: A complete list of required tools, libraries, and services (with version details):
For a full list of requirements for the system, please see requirements.txt . We recommend running:
pip3 install -r "requirements.txt"
upon loading the system into a virtual environment.

        Maintenance Requirements: Details on ongoing maintenance, including:

    Account credentials (if applicable):
Admin user login details:
email:admin@example.com
password:AdminPass1
The user dashboard/account can be switched to using the login feature - once logged out, when you try to process an add to cart or add to feature process, you will be prompted to login.
Example User login credentials:
email:user@gmail.com
password:User@123.com

    Database management procedures:
In our systems configuration, all read and writes from or two any of our JSON files includle checks for duplicates and safety checks for removals. We recommend using the built in functions to create or remove any data entries from the database. However, if you wish to add entries manually, please follow the HashMap/Dict structure of the files. We have a key (either the product or user code depending) which relates to data entries 'under' the umbrella of what the key represents. This changed depending on case but is evident when reading the file with this given background knowledge.

    Configuration of external APIs or service:
We have used two External APIs in the development.

Base Currency Layer for currency conversion: "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/{base_currency_lower}.json"
This layer is configured in the external files (ie external_service, external_router etc.). The way it works is first we call through this API to return the most recent exchange rate. Once this function has executed we then call a price conversion function using this previously obtained conversion rate to calculate local prices. We have shortened the available currencies to GBP CAD EUR USD, from the data native Rupees.

Image Scaper: Creates a mimick request to amazon, finding the necessary image from a provided product link from the database. From this image, the scaper obtains the URL landing image which is transfered back into the database to refresh the image. The scraper is configured in two parts: image_scraper_service to do the work and admin router.post where we require ADMIN permissions to request all photo refreshes. This is largely beneficial as amazon natively has an image expiry. Our approach navigates around this.
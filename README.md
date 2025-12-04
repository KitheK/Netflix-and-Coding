# COSC310 Netflix & Coding Online Web Shopping Platform

A containerized web shopping platform developed As the Main project for COSC 310

## Team Members

- Kithe Kisia
- Coran McColm
- Fraser Muller
- Harrison Kayihura

## Installation Instructions

The system is fully containerized and requires Docker Desktop to run. Follow these steps to set up and run the application.

### Prerequisites

- Docker Desktop installed on your system
- Git installed on your system
- Terminal or command prompt access

### Setup Steps

**Step 1: Clone the Repository**

```bash
git clone https://github.com/KitheK/Netflix-and-Coding.git
cd Netflix-and-Coding
```

**Step 2: Checkout Main Branch**

The main branch is checked out by default, but you can verify with:

```bash
git checkout main
```

**Step 3: Build and Start the Application**

This command will build and start both the frontend and backend containers:

```bash
docker compose up --build
```

**Step 4: Stopping the Application**

To shut down the system:

```bash
docker compose down
```

## Dependencies

A complete list of required packages and libraries is available in `requirements.txt`.

### Setting Up a Virtual Environment (Optional)

If you prefer to run the application outside of Docker, we recommend using a virtual environment to avoid package conflicts:

```bash
pip3 install -r requirements.txt
```

Note: Instructions for initializing a virtual environment vary by operating system and are outside the scope of this documentation.

## Account Credentials

### Administrator Account

- **Email:** admin@example.com
- **Password:** AdminPass1

### Example User Account

- **Email:** user@gmail.com
- **Password:** User@123.com

### Switching Accounts

You can switch between user accounts using the login feature. When logged out, attempting to add items to your cart or favorites will prompt you to log in.

## Maintenance Requirements

### Database Management

The system uses JSON files for data storage. All read and write operations include built-in duplicate checks and safety validations.

#### Recommended Approach

Use the built-in functions provided by the system to create or remove database entries.

#### Manual Data Entry

If you need to manually edit the JSON files, follow these guidelines:

- The database uses a HashMap/Dictionary structure
- Each file uses a key (either product code or user code) that maps to related data entries
- The key serves as an umbrella for all associated data
- Review the file structure carefully before making manual changes to understand the specific schema

### External APIs and Services

The system integrates two external APIs:

#### 1. Currency Conversion API

**Endpoint:** `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/{base_currency_lower}.json`

**Implementation:**
- Configured in external service files (`external_service`, `external_router`)
- Retrieves the most recent exchange rates
- Converts prices from native Rupees to target currencies
- Supported currencies: GBP, CAD, EUR, USD

**Workflow:**
1. API call retrieves current exchange rate
2. Price conversion function applies the rate to calculate local prices

#### 2. Image Scraper

**Purpose:** Automatically refreshes product images to avoid Amazon's native image expiry.

**Implementation:**
- **Service Layer:** `image_scraper_service` handles the scraping logic
- **API Endpoint:** `admin_router.post` (requires administrator permissions)

**Functionality:**
- Creates a mimicked request to Amazon using product links from the database
- Extracts the URL of the landing page image
- Updates the database with the new image URL
- Requires admin permissions to request image refreshes for all products

**Workflow:**
1. Scraper retrieves product link from database
2. Mimics request to Amazon product page
3. Extracts current image URL
4. Updates database with refreshed image link

## Repository

GitHub: [https://github.com/KitheK/Netflix-and-Coding](https://github.com/KitheK/Netflix-and-Coding)

## Support

For issues or questions, please refer to the repository's issue tracker or contact the development team.

# Image Scraper Service: Scrape Amazon product images

import re
from typing import Optional
from urllib.parse import urlparse, urljoin
import httpx
from bs4 import BeautifulSoup


class ImageScraperService:
    """Service for scraping Amazon product images from product pages"""
    
    def __init__(self):
        # Amazon headers to mimic a real browser request
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        self.timeout = 30.0  # 30 second timeout
    
    def fetch_image_url(self, product_link: str) -> Optional[str]:
        """
        Fetch the main product image URL from an Amazon product page.
        
        Args:
            product_link: URL to the Amazon product page
            
        Returns:
            Clean, stable image URL or None if not found/error
        """
        try:
            # Use httpx to fetch the page
            with httpx.Client(headers=self.headers, timeout=self.timeout, follow_redirects=True) as client:
                response = client.get(product_link)
                response.raise_for_status()
                
                # Parse HTML with BeautifulSoup
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Try to find the landingImage element
                landing_img = soup.find('img', {'id': 'landingImage'})
                
                if landing_img:
                    # Get the src attribute
                    img_url = landing_img.get('src') or landing_img.get('data-src')
                    
                    if img_url:
                        # Clean the URL - remove query parameters that might cause issues
                        cleaned_url = self._clean_image_url(img_url)
                        return cleaned_url
                
                # Fallback: Try to find other common image selectors
                # Amazon sometimes uses different structures
                img_selectors = [
                    ('img', {'id': 'landingImage'}),
                    ('img', {'id': 'main-image'}),
                    ('div', {'id': 'main-image-container'}),
                    ('img', {'class': re.compile(r'product-image', re.I)}),
                ]
                
                for selector, attrs in img_selectors:
                    element = soup.find(selector, attrs)
                    if element:
                        if selector == 'img':
                            img_url = element.get('src') or element.get('data-src')
                        else:
                            img_tag = element.find('img')
                            if img_tag:
                                img_url = img_tag.get('src') or img_tag.get('data-src')
                            else:
                                continue
                        
                        if img_url:
                            cleaned_url = self._clean_image_url(img_url)
                            return cleaned_url
                
                return None
                
        except httpx.HTTPError as e:
            # Network or HTTP errors
            print(f"HTTP error fetching image from {product_link}: {e}")
            return None
        except Exception as e:
            # Any other errors (parsing, etc.)
            print(f"Error fetching image from {product_link}: {e}")
            return None
    
    def _clean_image_url(self, url: str) -> str:
        """
        Clean and normalize the image URL.
        Removes unnecessary query parameters and ensures proper format.
        """
        if not url:
            return url
        
        # Parse the URL
        parsed = urlparse(url)
        
        # For Amazon images, we want to keep the core path but clean query params
        # Amazon image URLs typically look like:
        # https://m.media-amazon.com/images/I/[IMAGE_ID]._AC_SL1500_.jpg
        
        # Remove common problematic query parameters but keep essential ones
        # Build clean URL
        clean_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
        
        # If it's a relative URL, try to make it absolute
        if not parsed.netloc:
            clean_url = urljoin("https://www.amazon.in", url)
            parsed = urlparse(clean_url)
            clean_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
        
        return clean_url


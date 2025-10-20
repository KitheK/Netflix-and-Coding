##convert amazon.csv to .json for easier use. because FastAPI returns and recieves json.
#amazon.csv -> Products.json

import pandas as pd
from pathlib import Path

csv_path = Path("app/data/amazon.csv")
json_path = Path("app/data/Products.json")

df = pd.read_csv(csv_path)
df.to_json(json_path, orient="records", indent=4) 

print(f"converted {csv_path} to {json_path} successfully.")

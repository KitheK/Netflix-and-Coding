from app.repositories.ProductRepo import ProductRepository


def test_load_products():
    # tests loading products from JSON
    repo = ProductRepository("app/data/Products.json")
    products = repo.load_products()
    assert len(products) > 0

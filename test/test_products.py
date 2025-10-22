from app.repositories.FileProductRepository import FileProductRepository


def test_load_products():
    # tests loading products from JSON
    repo = FileProductRepository("app/data/Products.json")
    products = repo.load_products()
    assert len(products) > 0

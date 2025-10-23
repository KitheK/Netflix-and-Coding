from abc import ABC, abstractmethod

class IProductRepository(ABC):
    @abstractmethod
    def load_products(self):
        pass

    @abstractmethod
    def save_products(self, products):
        pass

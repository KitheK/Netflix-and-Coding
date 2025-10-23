import json

class FileStorageManager:
    def read_json(self, path):
        with open(path, "r") as file:
            return json.load(file)

    def write_json(self, path, data):
        with open(path, "w") as file:
            json.dump(data, file, indent=4)

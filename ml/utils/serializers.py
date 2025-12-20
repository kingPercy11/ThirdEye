# Helper to convert ObjectId to string
def serialize_document(doc):
    doc["_id"] = str(doc["_id"])
    return doc

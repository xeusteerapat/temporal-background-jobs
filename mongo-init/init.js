// MongoDB initialization script
// This runs in MongoDB's JavaScript engine during container startup
db = db.getSiblingDB('applications');

// Create applications collection with initial data structure
db.createCollection('applications');

// Create indexes for better performance
db.applications.createIndex({ "applicationId": 1 }, { unique: true });
db.applications.createIndex({ "status": 1 });
db.applications.createIndex({ "createdAt": 1 });

// Insert sample application data
db.applications.insertMany([
  {
    applicationId: "app-001",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    applicationData: {
      type: "loan",
      amount: 50000,
      documents: ["id", "income_proof"]
    },
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    applicationId: "app-002",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    applicationData: {
      type: "mortgage",
      amount: 250000,
      documents: ["id", "income_proof", "property_docs"]
    },
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// print() is a MongoDB shell function - this is correct for this context
print("Applications database initialized successfully!");
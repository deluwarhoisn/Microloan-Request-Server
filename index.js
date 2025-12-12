const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.syckqzu.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

async function run() {
  try {
    // await client.connect();
    const db = client.db("microLoanRequestDB");

    const LoanCollection = db.collection("LoanRequests");
    const LoanApplicationsCollection = db.collection("LoanApplications");
    const UsersCollection = db.collection("Users");

    console.log("Connected to MongoDB!");

    // ---------------- LOANS ----------------
    app.get("/LoanRequests", async (req, res) => {
      const loans = await LoanCollection.find().limit(6).toArray();
      res.send(loans);
    });

    app.get("/AllLoans", async (req, res) => {
      const loans = await LoanCollection.find().toArray();
      res.send(loans);
    });

    app.get("/loan-details/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const loan = await LoanCollection.findOne({ _id: new ObjectId(id) });
        if (!loan) return res.status(404).send({ success: false, message: "Loan not found" });
        res.send({ success: true, loan });
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    app.post("/LoanRequests", async (req, res) => {
      const newLoan = req.body;
      const result = await LoanCollection.insertOne(newLoan);
      res.send(result);
    });

    app.delete("/loans/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await LoanCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    app.put("/loans/:id/home", async (req, res) => {
      try {
        const { showOnHome } = req.body;
        const result = await LoanCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: { showOnHome } }
        );
        res.send(result);
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    // ---------------- LOAN APPLICATIONS ----------------
    app.post("/loan-application", async (req, res) => {
      try {
        const applicationData = req.body;
        const result = await LoanApplicationsCollection.insertOne(applicationData);
        res.send({ success: true, message: "Loan Application Submitted", result });
      } catch (error) {
        res.send({ success: false, message: error.message });
      }
    });

    app.get("/loan-applications", async (req, res) => {
      const result = await LoanApplicationsCollection.find().toArray();
      res.send(result);
    });

    // User-specific loans
    app.get("/my-loans/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const loans = await LoanApplicationsCollection.find({ email }).toArray();
        res.send({ success: true, loans });
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    // Cancel loan application (only pending)
    app.delete("/loan-applications/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const loan = await LoanApplicationsCollection.findOne({ _id: new ObjectId(id) });

        if (!loan) return res.status(404).send({ success: false, message: "Loan not found" });
        if (loan.status !== "Pending")
          return res.status(400).send({ success: false, message: "Only pending loans can be canceled" });

        const result = await LoanApplicationsCollection.deleteOne({ _id: new ObjectId(id) });
        res.send({ success: true, message: "Loan application canceled", result });
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    // Update loan application status (Admin)
    app.put("/loan-applications/:id/status", async (req, res) => {
      try {
        const { status } = req.body;
        const result = await LoanApplicationsCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: { status } }
        );
        res.send({ success: true, result });
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    // Approved loans
    app.get("/approved-loans", async (req, res) => {
      try {
        const loans = await LoanApplicationsCollection.find({ status: "Approved" }).toArray();
        res.send({ success: true, loans });
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    // ---------------- USERS ----------------
    app.get("/users", async (req, res) => {
      const users = await UsersCollection.find().toArray();
      res.send(users);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const existing = await UsersCollection.findOne({ email: user.email });
      if (existing) {
        return res.status(400).send({ success: false, message: "User already exists" });
      }
      const result = await UsersCollection.insertOne({ ...user, status: "active" });
      res.send(result);
    });

    app.put("/users/:id/role", async (req, res) => {
      const { role } = req.body;
      const result = await UsersCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { role } }
      );
      res.send(result);
    });

    app.put("/users/:id/status", async (req, res) => {
      const { status } = req.body;
      const result = await UsersCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status } }
      );
      res.send(result);
    });

  } finally {
    // Keep connection alive
  }
}

run().catch(console.dir);

// Root route
app.get("/", (req, res) => {
  res.send("Microloan-Request-Server is running...");
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

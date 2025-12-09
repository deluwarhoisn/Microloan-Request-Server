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
    await client.connect();
    const db = client.db("microLoanRequestDB");

    const LoanCollection = db.collection("LoanRequests");
    const LoanApplicationsCollection = db.collection("LoanApplications");

    // 🚀 Loan Routes
    app.get("/LoanRequests", async (req, res) => {
      const loans = await LoanCollection.find().limit(6).toArray();
      res.send(loans);
    });

    app.get("/AllLoans", async (req, res) => {
      const loans = await LoanCollection.find().toArray();
      res.send(loans);
    });

    // 🚀 Loan Details Route
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

    // 🚀 Loan Application Routes
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

    app.get("/loan-applications/:email", async (req, res) => {
      const email = req.params.email;
      const result = await LoanApplicationsCollection.find({ email }).toArray();
      res.send(result);
    });

    console.log("Connected to MongoDB!");
  } finally {
    // keep connection alive
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Microloan-Request-Server is running...");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
  
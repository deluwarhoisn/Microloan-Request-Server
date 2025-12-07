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

    // GET all loan requests (limit to 6 for landing page)
    app.get("/LoanRequests", async (req, res) => {
      const loans = await LoanCollection.find().limit(6).toArray();
      res.send(loans);
    });

    // GET single loan by ID
    app.get("/LoanRequests/:id", async (req, res) => {
      const id = req.params.id;
      const loan = await LoanCollection.findOne({ _id: new ObjectId(id) });
      res.send(loan);
    });

    // POST new loan
    app.post("/LoanRequests", async (req, res) => {
      const newLoanRequest = req.body;
      const result = await LoanCollection.insertOne(newLoanRequest);
      res.send(result);
    });

    console.log("Connected to MongoDB!");
  } finally {
    // await client.close(); // keep connection alive
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Microloan-Request-Server is running...");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

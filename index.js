const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5500;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.q8lcz01.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    const sliderCollection = client.db("unitedSports").collection("slider");
    const usersCollection = client.db("unitedSports").collection("users");
    const classesCollection = client.db("unitedSports").collection("classes");
    const bookedClassCollection = client
      .db("unitedSports")
      .collection("bookedClasses");

    // slider data
    app.get("/slider", async (req, res) => {
      const sliderData = await sliderCollection.find().toArray();
      res.send(sliderData);
    });

    // Users data
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const users = req.body;
      const query = { email: email };
      const options = {
        upsert: true,
      };
      const updateDocs = {
        $set: users,
      };
      const result = await usersCollection.updateOne(
        query,
        updateDocs,
        options
      );
      res.send(result);
    });

    app.get("/users/:email", async (req, res) => {
      const filter = { email: req.params.email };
      const result = await usersCollection.findOne(filter);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // Manage User Role on Admin
    app.patch("/users/admin/:id", async (req, res) => {
      const filter = { _id: new ObjectId(req.params.id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Manage User Role on Instructor
    app.patch("/users/instructor/:id", async (req, res) => {
      const filter = { _id: new ObjectId(req.params.id) };
      const updateDoc = {
        $set: {
          role: "instructor",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Classes Data
    app.post("/classes", async (req, res) => {
      const body = req.body;
      const result = await classesCollection.insertOne(body);
      res.send(result);
    });

    // Class Update
    app.patch("/classes/:id", async (req, res) => {
      const filter = { _id: new ObjectId(req.params.id) };
      const body = req.body;
      const updateDoc = {
        $set: {
          className: body.className,
          imageUrl: body.imageUrl,
          name: body.name,
          email: body.email,
          seats: parseFloat(body.seats),
          price: parseFloat(body.price),
        },
      };
      const result = await classesCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Class status data
    app.patch("/classes/approved/:id", async (req, res) => {
      const filter = { _id: new ObjectId(req.params.id) };
      const updateDoc = {
        $set: {
          status: "approved",
        },
      };
      const result = await classesCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.patch("/classes/deny/:id", async (req, res) => {
      const filter = { _id: new ObjectId(req.params.id) };
      const updateDoc = {
        $set: {
          status: "deny",
        },
      };
      const result = await classesCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.patch("/classes/feedback/:id", async (req, res) => {
      const filter = { _id: new ObjectId(req.params.id) };
      const updateDoc = {
        $set: {
          feedback: req.body.feedback,
        },
      };
      const result = await classesCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.get("/classes", async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    });

    // Booked Class
    app.post("/booked", async (req, res) => {
      const body = req.body;
      console.log(body);
      const result = await bookedClassCollection.insertOne(body);
      res.send(result);
    });

    // Get Booked Class
    app.get("/booked", async (req, res) => {
      const result = await bookedClassCollection.find().toArray();
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("united sports is running.");
});

app.listen(port, () => {
  console.log(`united sports is running on PORT, ${port}`);
});

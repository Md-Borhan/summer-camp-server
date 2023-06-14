const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
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
    const paymentCollection = client.db("unitedSports").collection("payment");
    const reviewsCollection = client.db("unitedSports").collection("reviews");

    // slider data
    app.get("/slider", async (req, res) => {
      const sliderData = await sliderCollection.find().toArray();
      res.send(sliderData);
    });

    // Reviews Data
    app.get("/reviews", async (req, res) => {
      const reviewData = await reviewsCollection.find().toArray();
      res.send(reviewData);
    });

    // Users Data
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

    // Get Single User
    app.get("/users/:email", async (req, res) => {
      const filter = { email: req.params.email };
      console.log(filter);
      const result = await usersCollection.findOne(filter);
      res.send(result);
    });

    // Get User Role
    app.get("/users/role/:email", async (req, res) => {
      const email = { email: req.params.email };
      const user = await usersCollection.findOne(email);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      let role;
      if (user.role === "admin") {
        role = "admin";
      } else if (user.role === "student") {
        role = "student";
      } else if (user.role === "instructor") {
        role = "instructor";
      } else {
        role = "unknown";
      }
      res.json({ email: email, role: role });
    });

    // Get All User
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

    // Post Classes Data
    app.post("/classes", async (req, res) => {
      const body = req.body;
      const result = await classesCollection.insertOne(body);
      res.send(result);
    });

    // Update Class
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

    // Update Class Status
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

    // Update Class Feedback
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

    // Get All Class
    app.get("/classes", async (req, res) => {
      const result = await classesCollection
        .find()
        .sort({ enrolled: -1 })
        .toArray();
      res.send(result);
    });

    // Get Single Class
    app.get("/classes/:email", async (req, res) => {
      const filter = { email: req.params.email };
      const result = await classesCollection.find(filter).toArray();
      res.send(result);
    });

    // Booked Class
    app.post("/booked", async (req, res) => {
      const body = req.body;
      const result = await bookedClassCollection.insertOne(body);
      res.send(result);
    });

    // Get Single Booked Class
    app.get("/booked/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await bookedClassCollection.findOne(query);
      res.send(result);
    });

    // Get All Booked Class
    app.get("/booked", async (req, res) => {
      const result = await bookedClassCollection.find().toArray();
      res.send(result);
    });

    // Get Booked Class By Email
    app.get("/booked/:email", async (req, res) => {
      const filter = { email: req.params.email };
      const result = await bookedClassCollection.find(filter).toArray();
      res.send(result);
    });

    // Delete Booked Class
    app.delete("/booked/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await bookedClassCollection.deleteOne(query);
      res.send(result);
    });

    // Create Payment Intent
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // Post Payment History
    app.post("/payments", async (req, res) => {
      const payment = req.body;

      // Update enrolled and availableSeats in classesCollection
      const classId = payment.classId;
      const updateResult = await classesCollection.updateOne(
        { _id: new ObjectId(classId) },
        { $inc: { enrolled: 1, seats: -1 } }
      );

      // to delete from cartCollection
      const courseIdFilter = { classId: payment.classId };
      const deleteClassCart = await bookedClassCollection.deleteOne(
        courseIdFilter
      );

      const result = await paymentCollection.insertOne(payment);
      res.send({ result, deleteClassCart, updateResult });
    });

    // Get Payment History
    app.get("/payments/:email", async (req, res) => {
      const filter = { email: req.params.email };
      const result = await paymentCollection
        .find(filter)
        .sort({ date: -1 })
        .toArray();
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

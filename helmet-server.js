const { MongoClient } = require("mongodb");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const ObjectId = require("mongodb").ObjectId;

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

// connection to mongodb

// const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.PASS}@cluster0.tx5hg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const uri = `mongodb+srv://tourism:OuM7iIgBMf2JT4Vk@cluster0.tx5hg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const run = async () => {
  try {
    await client.connect();

    const database = client.db("helmetShop");
    const helmetCollection = database.collection("helmets");
    const orderCollection = database.collection("orders");
    const reviewCollection = database.collection("reviews");

    // creating a helmet api
    app.post("/helmets", async (req, res) => {
      const newHelmet = req.body;

      const result = await helmetCollection.insertOne(newHelmet);
      res.json(result);
    });

    // get api for read all helmet
    app.get("/helmets", async (req, res) => {
      const cursor = helmetCollection.find({});
      const helmets = await cursor.toArray();
      res.json(helmets);
    });

    // api for getting specific helmet by id
    app.get("/helmets/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };

      const helmet = await helmetCollection.findOne(query);
      res.json(helmet);
    });

    // api for delete a helmet
    app.delete("helmets/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };

      const result = await helmetCollection.deleteOne(query);
      res.json(result);
    });

    // api for orders

    // creating api for inserting a new order
    app.post("/orders", async (req, res) => {
      const newOrder = req.body;
      const result = await orderCollection.insertOne(newOrder);

      res.json(result);
    });

    // getting all orders api
    app.get("/orders", async (req, res) => {
      const cursor = orderCollection.find({});
      const orders = await cursor.toArray();
      res.json(orders);
    });

    // getting a specific booking by id
    app.get("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const order = await orderCollection.findOne(query);
      res.json(order);
    });

    // getting multiple orders by filtering email
    app.get(`/:email/orders`, async (req, res) => {
      const email = req.params.email;

      const query = { email: email };

      const cursor = orderCollection.find(query);
      const orders = await cursor.toArray();
      res.json(orders);
    });

    // update the status of an order
    app.put("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const updatedOrder = req.body;
      const filter = { _id: ObjectId(id) };

      const options = { upsert: true };
      // create a document that sets the status of the bookingCollection
      const updateDoc = {
        $set: {
          status: updatedOrder.status,
        },
      };

      const result = await orderCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    // api for delete a booking

    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.json(result);
    });

    // api for reviews
    // api for create a review
    app.post("/reviews", async (req, res) => {
      const newReview = req.body;

      const result = await reviewCollection.insertOne(newReview);
      res.json(result);
    });

    // api for getting all reviews
    app.get("/reviews", async (req, res) => {
      const cursor = reviewCollection.find({});
      const reviews = await cursor.toArray();
      res.json(reviews);
    });
  } finally {
    // await client.close();
  }
};
run().catch(console.dir);

// get api for home route

app.get("/", (req, res) => {
  res.send("Hello from helmet market node server");
});

app.listen(port, () => {
  console.log("listening to port : ", port);
});
const { MongoClient } = require("mongodb");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const ObjectId = require("mongodb").ObjectId;
const { v4: uuid } = require("uuid");
const stripe = require("stripe")(process.env.stripe_key);

const app = express();
// const SSLCommerzPayment = require("sslcommerz-lts");
// const SSLCommerzPayment = require("sslcommerz-lts");
// const SSLCommerzPayment = require("sslcommerz");

// const store_id = "abcco619207ad9f014";
// const store_passwd = "abcco619207ad9f014@ssl";
// const is_live = false; //true for live, false for sandbox

// middlewares
app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 5000;

// connection to mongodb

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.PASS}@cluster0.tx5hg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

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
    const userCollection = database.collection("users");

    // creating a helmet api
    app.post("/helmets", async (req, res) => {
      const newHelmet = { ...req.body };

      newHelmet.rating = parseFloat(newHelmet.rating);
      newHelmet.price = parseFloat(newHelmet.price);

      const imageData = req.files.image.data;
      const encodedImage = imageData.toString("base64");
      const imageBuffer = Buffer.from(encodedImage, "base64");

      newHelmet.image = imageBuffer;
      // console.log("New Helmet = ", newHelmet);

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
    app.delete("/helmets/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: ObjectId(id) };

      const result = await helmetCollection.deleteOne(query);
      res.json(result);
    });

    // api for update helmet
    app.put("/helmets/:id", async (req, res) => {
      const id = req.params.id;
      // const newHelmet = req.body;
      const query = { _id: ObjectId(id) };

      const newHelmet = { ...req.body };

      newHelmet.rating = parseFloat(newHelmet.rating);
      newHelmet.price = parseFloat(newHelmet.price);

      const imageData = req.files.image.data;
      const encodedImage = imageData.toString("base64");
      const imageBuffer = Buffer.from(encodedImage, "base64");

      newHelmet.image = imageBuffer;

      const updateDoc = {
        $set: newHelmet,
      };

      const result = await helmetCollection.updateOne(query, updateDoc);

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

    // getting a specific order by id
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

    // update the payment status of an order
    app.put("/orders/payment/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      // create a document that sets the status of the bookingCollection
      const updateDoc = {
        $set: {
          paid: true,
        },
      };

      const result = await orderCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    // api for delete a order

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

    // api for users

    // api for creating a new user
    // creating a user api
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const user = await userCollection.insertOne(newUser);
      res.json(user);
    });

    app.put("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const options = { upsert: true };

      const updateDoc = {
        $set: user,
      };

      const result = await userCollection.updateOne(query, updateDoc, options);

      res.json(result);
    });

    // update a user to isAdmin api
    app.put("/:email/users/admin", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };

      const user = await userCollection.findOne(query);

      if (user == null) {
        res
          .status(401)
          .json({ message: "User Not Found ! Please Register first" });
      } else {
        const updateDoc = {
          $set: {
            role: "admin",
          },
        };

        const result = await userCollection.updateOne(query, updateDoc);
        res.json(result);
      }
    });

    // get a single user by email
    app.get("/:email/users", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      res.json(user);
    });

    // siripe payment api
    app.post("/payment/stripe", async (req, res) => {
      const order = req.body;

      try {
        const session = await stripe.checkout.sessions.create({
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: order?.product,
                },
                unit_amount: order?.price * 100,
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `http://localhost:3000/payment/success/${order._id}`,
          cancel_url: "http://localhost:3000/",
        });

        res.json({ url: session.url });
      } catch (error) {
        res.json({ error: error.message });
      }
    });

    // ssl commerz payment api
    // app.post("/sslcommerz", (req, res) => {
    //   const order = req.body;
    //   console.log(order);

    //   const data = {
    //     total_amount: order.price,
    //     currency: "BDT",
    //     tran_id: uuid(), // use unique tran_id for each api call
    //     success_url: `http://localhost:5000/success`,
    //     fail_url: "http://localhost:5000/fail",
    //     cancel_url: "http://localhost:5000/cancel",
    //     ipn_url: "http://localhost:5000/ipn",
    //     shipping_method: "Courier",
    //     product_name: order.product,
    //     product_category: "Helmet",
    //     product_profile: "general",
    //     cus_name: "Customer Name",
    //     cus_email: "customer@example.com",
    //     cus_add1: "Dhaka",
    //     cus_add2: "Dhaka",
    //     cus_city: "Dhaka",
    //     cus_state: "Dhaka",
    //     cus_postcode: "1000",
    //     cus_country: "Bangladesh",
    //     cus_phone: "",
    //     cus_fax: "",
    //     ship_name: "Customer Name",
    //     ship_add1: "Dhaka",
    //     ship_add2: "Dhaka",
    //     ship_city: "Dhaka",
    //     ship_state: "Dhaka",
    //     ship_postcode: 1000,
    //     ship_country: "Bangladesh",
    //   };
    //   // const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    //   const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    //   // console.log(store_id, store_passwd);
    //   sslcz
    //     .init(data)
    //     .then((apiResponse) => {
    //       // Redirect the user to payment gateway
    //       console.log("api response = ", apiResponse);
    //       let GatewayPageURL = apiResponse.GatewayPageURL;
    //       console.log("Redirecting to: ", GatewayPageURL);
    //       res.json({ url: GatewayPageURL });
    //     })
    //     .catch((error) => {
    //       res.json({ error: error.message });
    //     });
    // });

    // app.post("/sslcommerz", (req, res) => {
    //   const data = {
    //     total_amount: 100,
    //     currency: "EUR",
    //     tran_id: "REF123",
    //     success_url: "http://localhost:5000/success",
    //     fail_url: "http://localhost:5000/fail",
    //     cancel_url: "http://localhost:5000/cancel",
    //     ipn_url: "http://localhost:5000/ipn",
    //     shipping_method: "Courier",
    //     product_name: "Computer.",
    //     product_category: "Electronic",
    //     product_profile: "general",
    //     cus_name: "Customer Name",
    //     cus_email: "cust@yahoo.com",
    //     cus_add1: "Dhaka",
    //     cus_add2: "Dhaka",
    //     cus_city: "Dhaka",
    //     cus_state: "Dhaka",
    //     cus_postcode: "1000",
    //     cus_country: "Bangladesh",
    //     cus_phone: "01711111111",
    //     cus_fax: "01711111111",
    //     ship_name: "Customer Name",
    //     ship_add1: "Dhaka",
    //     ship_add2: "Dhaka",
    //     ship_city: "Dhaka",
    //     ship_state: "Dhaka",
    //     ship_postcode: 1000,
    //     ship_country: "Bangladesh",
    //     multi_card_name: "mastercard",
    //     value_a: "ref001_A",
    //     value_b: "ref002_B",
    //     value_c: "ref003_C",
    //     value_d: "ref004_D",
    //   };
    //   const sslcommer = new SSLCommerzPayment(
    //     "abcco619207ad9f014",
    //     "abcco619207ad9f014@ssl",
    //     false
    //   ); //true for live default false for sandbox
    //   sslcommer.init(data).then((data) => {
    //     console.log("data=", data);
    //   });
    // });

    // app.post("/sslcommerz", (req, res) => {
    //   const { product } = req.body;

    //   const data = {
    //     total_amount: product.price * product.quantity,
    //     currency: "BDT",
    //     tran_id: uuid(), // use unique tran_id for each api call
    //     success_url: "https://frozen-sea-04813.herokuapp.com/success",
    //     fail_url: "https://frozen-sea-04813.herokuapp.com/fail",
    //     cancel_url: "https://frozen-sea-04813.herokuapp.com/cancel",
    //     ipn_url: "https://frozen-sea-04813.herokuapp.com/ipin",
    //     shipping_method: "Courier",
    //     product_name: product.name,
    //     product_category: "Electronic",
    //     product_profile: "general",
    //     cus_name: "Customer Name",
    //     cus_email: "customer@example.com",
    //     cus_add1: "Dhaka",
    //     cus_add2: "Dhaka",
    //     cus_city: "Dhaka",
    //     cus_state: "Dhaka",
    //     cus_postcode: "1000",
    //     cus_country: "Bangladesh",
    //     cus_phone: "01711111111",
    //     cus_fax: "01711111111",
    //     ship_name: "Customer Name",
    //     ship_add1: "Dhaka",
    //     ship_add2: "Dhaka",
    //     ship_city: "Dhaka",
    //     ship_state: "Dhaka",
    //     ship_postcode: 1000,
    //     ship_country: "Bangladesh",
    //   };
    //   const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    //   sslcz
    //     .init(data)
    //     .then((apiResponse) => {
    //       // Redirect the user to payment gateway
    //       let GatewayPageURL = apiResponse.GatewayPageURL;

    //       res.json(GatewayPageURL);
    //       console.log("Redirecting to: ", GatewayPageURL);
    //     })
    //     .catch((error) => {
    //       res.json(error);
    //     });
    // });

    // app.post("/success", async (req, res) => {
    // const id = req.params.id;

    // const filter = { _id: ObjectId(id) };
    // const options = { upsert: true };
    // // create a document that sets the status of the bookingCollection
    // const updateDoc = {
    //   $set: {
    //     paid: true,
    //   },
    // };

    // const result = await orderCollection.updateOne(
    //   filter,
    //   updateDoc,
    //   options
    // );

    //   res.redirect("http://localhost:3000/dashboard/myorders");
    // });

    // app.post("/cancel", (req, res) => {
    //   res.redirect("http://localhost:3000/dashboard/myorders");
    // });

    // app.post("/fail", (req, res) => {
    //   res.redirect("http://localhost:3000/dashboard/myorders");
    // });
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

const express = require('express')
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtokwn');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7uhwv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const productCollection= client.db('carpenter_hub').collection('products');
        const orderCollection= client.db('carpenter_hub').collection('orders');
        const userCollection= client.db('carpenter_hub').collection('users');

        //all products

        app.get('/product',async(req,res)=>{
            const query={};
            const cursor=productCollection.find(query);
            const products=await cursor.toArray();
            res.send(products);

        })
        // per product
        app.get('/product/:id',async(req,res)=>{
            const id= req.params.id;
            const query={_id:ObjectId(id)};
            const product= await productCollection.findOne(query);
            res.send(product);
        })
        // post order

        app.post('/order',async(req,res)=>{
            const order=req.body;
            const result=await orderCollection.insertOne(order);
            res.send(result);
        })
        //get orders from a user
        app.get('/order',async(req,res)=>{
            const customer=req.query.customer;
            const query={customer:customer};
            const orders=await orderCollection.find(query).toArray();
            res.send(orders);
        })
        //user

        app.put('/user/:email',async(req,res)=>{
            const email=req.params.email;
            const user= req.body;
            const filter={email:email};
            const options={upsert:true};
            const updateDoc={
                $set: user
            };
            const result= await userCollection.updateOne(filter,updateDoc,options);
            res.send(result);
        })


    }
    finally{}
}

run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Hello Carpenter!')
})

app.listen(port, () => {
  console.log(`Carpenters listening on port ${port}`)
})
const express = require('express')
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7uhwv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


    function verifyJWT(req,res,next){
        const authHeader= req.headers.authorization;
        if(!authHeader){
            return res.status(401).send({message:'Unauthorized access'})
        }
        const token=authHeader.split(' ')[1];
        jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,function(err,decoded){
            if(err){
                res.status(403).send({message:'Forbidden access'})
            }
            req.decoded=decoded;
            next();
        });
    }


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
        app.get('/order',verifyJWT,async(req,res)=>{
            const customer=req.query.customer;
           const decodedEmail=req.decoded.email;
           if(customer===decodedEmail){
            
            const query={customer:customer};
            const orders=await orderCollection.find(query).toArray();
                return res.send(orders);
           }
           else{
               return res.status(403).send({message:'forbidden access'})
           }
            
        })

        // all users

        app.get('/user',verifyJWT,async(req,res)=>{
            const users=await userCollection.find().toArray();
            res.send(users);
        });

        // check admin

        app.get('/admin/:email',async(req,res)=>{
            const email=req.params.email;
            const user= await userCollection.findOne({email:email});
            const isAdmin= user.role==='admin';
            res.send({admin:isAdmin})

        })



        //admin


        app.put('/user/:admin/:email',verifyJWT,async(req,res)=>{
            const email=req.params.email;
            const requester=req.decoded.email;
            const requesterAccount= await userCollection.findOne({email:requester});
            if(requesterAccount.role==='admin'){
                const filter={email:email};
                const updateDoc={
                    $set: {role:'admin'}
                };
                const result= await userCollection.updateOne(filter,updateDoc);
                res.send(result);
            }
            else{
                res.status(403).send({message:'forbidden'});
            }
           
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
            const token=jwt.sign({email:email},process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1d'})
            res.send({result,token});
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
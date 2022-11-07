const express = require('express');
const cors = require('cors');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;
const { MongoClient, ServerApiVersion } = require('mongodb');
// const packageName = require('packageName');

const app = express();
const port =process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.eilfw7v.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri,{ useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
try{
await client.connect();
const serviceCollection = client.db('doctors_portal').collection('services');
const bookingCollection = client.db('doctors_portal').collection('booking');




app.get('/service',async(req,res)=>{
    const query = {};
    const cursor = serviceCollection.find(query);
    const services = await cursor.toArray();
    res.send(services);
});

app.get('/available',async(req,res)=>{
  const date = req.query.date;

  //step 1: get all services

  const services = await serviceCollection.find().toArray();

  //step 2: get the booking of that  day.output:[{},{},{},{}]
  const query = {date:date};
  const bookings = await bookingCollection.find(query).toArray();

  //step 3: for each service, find booking for that service
  services.forEach(service =>{

    // step 4: find bookings for that service. output:[{},{},{},{}]
    const serviceBookings = bookings.filter(book =>book.treatment === service.name);

    // step 5:select slots for the service Bookings
    const bookedSlots = serviceBookings.map(book => book.slot);
    //step 6: select those slots that are not in bookedSlots
    const available = service.slots.filter(slot =>!bookedSlots.includes(slot));
    //step 7:set available to slots to make it easier
    service.available = available
    // const serviceBookings = bookings.filter(b => b.treatment === service.name);
    // const booked = serviceBookings.map(s =>s.slot);
    // const available = service.slots.filter(s=>booked.includes(s));
    // service.available = available;


    // service.booked = booked

    // service.booked = serviceBookings.map(s=>s.slot)

  })
  res.send(services);
})


 /**
 *API Naming Convention
 *app.get('/booking') // get all booking in this collection. or get more than one or by filter
 *app.get('/booking/:id)// get specific booking
 *app.get('/booking')//post
 *app.patch('/booking/:id')//specific update
 *app.delete('/booking/:id)//specific delete
}*/


app.get('/booking',async(req,res) =>{
  const patient = req.query.patient;
  const query = {patient:patient};
  const bookings = await bookingCollection.find(query).toArray();
  res.send(bookings);
})


app.get('/booking/:id',async(req,res)=>{
  const id = req.params.id;
  const query ={_id: ObjectId(id)}
  const booking = await bookingCollection.findOne(query);
  res.send(booking);
})

app.post('/booking',async(req,res)=>{
  const booking = req.body;
  const query = {treatment:booking.treatment,date:booking.date,patient:booking.patient}
  const exists = await bookingCollection.findOne(query);
  if(exists){
    return res.send({success:false, booking:exists})
  }
  const result = await bookingCollection.insertOne(booking);
  return res.send({success:true,result});
})
 
}
finally{

}
}

run().catch(console.dir);

console.log(uri)
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
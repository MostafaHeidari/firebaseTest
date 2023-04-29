const functions = require("firebase-functions");

// // Create and deploy your first functions
// // https://firebase.google.com/docs/functions/get-started
//

const admin = require("firebase-admin")
//const {DocumentData, DocumentData} = require("@angular/fire/compat/firestore");

admin.initializeApp({projectId:"fir-test-a8acb"})



const app =  require("express")();
const cors = require("cors");

app.use(cors());

const toxcity= require ('@tensorflow-models/toxicity');
//const {DocumentReference, DocumentData} = require("@angular/fire/compat/firestore");



const isThisMessageAllRight = async (message) => {
  const model = await toxcity.load(0.9);
  const predictions = await model.classify(message);
  let whatsWrongWithMessage = [];

  predictions.forEach(prediction=>{
    prediction.results.forEach(result =>{
      if (result.match){
        whatsWrongWithMessage.push(prediction.label);
      }
    })
  })
  return whatsWrongWithMessage;
}

app.post("/message", async (req, res) => {
  const body = req.body;
  const result =  await isThisMessageAllRight(body.messageContent);

  if (result.length===0){
    body.timestamp = new Date();
    const writeresult = await admin.firestore().collection('chat').add(body);
    return res.status(201).json(writeresult);
  }
  return res.status(400).json(
    {
      message:"you are being toxic",
      result: result
    }
  )
})



//makes some routes
/*
app.get('/whatever', (req, res)=>{
 return  res.json({key:"hello world"});
})


app.get("/someotherroute",(req,res)=> {
  res.json({someotherkey: "someothervalue"})
})
 */

exports.api = functions.https.onRequest(app)



// the user have the same ID as the user in the firestore
exports.authTriggeredFuction = functions.auth
  .user()
  .onCreate((user, context) => {
    //functions.logger.log(user)
    admin.firestore().collection('user').doc(user.uid)
      .set({
        name: user.displayName
      })
  })

//Admin SDK.
exports.firestoreTriggeredFunction = functions.firestore
  .document('chat/{document}')
  .onCreate((snapshot, context) => {
    const data = snapshot.data();
    const myFieldData = data.message;
    functions.logger.log(myFieldData);
  })








/*
//User SDK. trigger on firestore events. but we push a document path
exports.firestoreTriggeredFunction = functions.firestore
  .document('chat/{document}')
  .onCreate((snapshot, context) => {
    const data = snapshot.data();
    const myFieldData = data.message;
    functions.logger.log(myFieldData);
  })

 */



/*
// this is an HTTP callable function, so we sent an HTTP request and we get an response back witch is "Hello from Firebase"
 exports.helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

 */



/*
exports.authTriggeredFunction = functions.auth
  .user()
  .onCreate((user, context) => {
    admin.firestore().collection('myChat').doc(user.uid)
      .set({
        name: user.displayName
      })
  })

exports.firestoreTriggeredFunction = functions.firestore
  .document('chat/{document}')
  .onCreate((snapshot, context) => {})

 */




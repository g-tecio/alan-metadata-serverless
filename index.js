const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const AWS = require('aws-sdk');


const METAS_TABLE = process.env.METAS_TABLE;
const dynamoDb = new AWS.DynamoDB.DocumentClient();

app.use(bodyParser.json({ strict: false }));

app.get('/', function (req, res) {
  res.send('Hello World!')
})

// Get Metadata endpoint
app.get('/metadata/:metaId', function (req, res) {
  const params = {
    TableName: METAS_TABLE,
    Key: {
      metaId: req.params.metaId,
    },
  }

  dynamoDb.get(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not get metadata' });
    }
    if (result.Item) {
      const {metaId, name, owner_id, created_at, schema} = result.Item;
      res.json({ metaId, name });
    } else {
      res.status(404).json({ error: "Metadata not found" });
    }
  });
})

// Get all Metadata
app.get('/metadata', function (req, res) {
    const params = {
      TableName: METAS_TABLE,
    }
  
    dynamoDb.scan(params, (err, result) => {
      if (err) {
          res.send({
            success: false,
            message: 'Error: Server error'
          });
        } else {
          res.send(result.Items);
        }
      });
  })

// Create Metadata endpoint
app.post('/metadata', function (req, res) {
  const { metaId, name, owner_id, created_at, schema } = req.body;
  if (typeof metaId !== 'string') {
    res.status(400).json({ error: '"metaId" must be a string' });
  } else if (typeof name !== 'string') {
    res.status(400).json({ error: '"name" must be a string' });
  }

  const params = {
    TableName: METAS_TABLE,
    Item: {
      metaId: metaId,
      name: name,
      owner_id: owner_id,
      created_at: new Date().toString(),
      schema: schema
    },
  };

  dynamoDb.put(params, (error) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not create meta' });
    }
    res.json(params);
  });
})

module.exports.handler = serverless(app);
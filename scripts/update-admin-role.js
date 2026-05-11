const { MongoClient } = require('mongodb');

const mongoUri = 'mongodb://abhishekr474_db_user:serco%4012345x@ac-yfgplye-shard-00-00.jnafetc.mongodb.net:27017,ac-yfgplye-shard-00-01.jnafetc.mongodb.net:27017,ac-yfgplye-shard-00-02.jnafetc.mongodb.net:27017/?ssl=true&replicaSet=atlas-kvvrmb-shard-0&authSource=admin&appName=Cluster0';

const client = new MongoClient(mongoUri);

async function updateUserRole() {
  try {
    await client.connect();
    const db = client.db('python-arena');
    const result = await db.collection('users').updateOne(
      { email: 'abhishekr474@gmail.com' },
      { '$set': { role: 'admin' } }
    );
    console.log('Updated documents:', result.modifiedCount);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

updateUserRole();

import mongoose from 'mongoose';

const uri = "mongodb://abhishekr474_db_user:serco%4012345x@ac-yfgplye-shard-00-00.jnafetc.mongodb.net:27017,ac-yfgplye-shard-00-01.jnafetc.mongodb.net:27017,ac-yfgplye-shard-00-02.jnafetc.mongodb.net:27017/?ssl=true&replicaSet=atlas-kvvrmb-shard-0&authSource=admin&appName=Cluster0";

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({ username: { $regex: '1729', $options: 'i' } }).toArray();
  console.log("USERS MATCHING 1729:", users.map(u => ({ username: u.username, password: u.password, active: u.is_active })));
  process.exit(0);
}

run();

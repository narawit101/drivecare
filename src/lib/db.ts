import { Pool } from 'pg';


const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})

pool.connect()
    .then(client => {
        console.log("Database connection successful!");
        console.log(`Connection URL: ${process.env.DATABASE_URL}`);
        client.release(); 
    })
    .catch(error => {
        console.error("❌ ERROR: Cannot connect to database!", error.stack);
    });

export default pool;
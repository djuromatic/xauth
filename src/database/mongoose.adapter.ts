import { ServerConfig } from "../config/server-config";
import mongoose from "mongoose";



export function createConnection(serverConfig: ServerConfig) {

    const { host, port, dbName, dbUser, dbPass } = serverConfig.database;

   const connection = mongoose.connect(`mongodb://${dbUser}:${dbPass}@${host}:${port}/${dbName}`, {
    
    });

    connection.then(() => {
        console.log("Connected to database");
    }
    ).catch((err) => {
        console.log("Error connecting to database", err);
    }

    )
}
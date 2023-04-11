import { ServerConfig } from "../config/server-config";
import mongoose, { Collection } from "mongoose";

export function createConnection(serverConfig: ServerConfig) {
  const { host, port, dbName, dbUser, dbPass } = serverConfig.database;

  const connection = mongoose.connect(
    `mongodb://${dbUser}:${dbPass}@${host}:${port}/${dbName}`,
    {}
  );

  connection
    .then(() => {
      console.log("Connected to database");
    })
    .catch((err) => {
      console.log("Error connecting to database", err);
    });
}

export class MongoAdapter {
  private name: string;
  private collection: Collection;

  constructor(name: string) {
    this.name = name;
    this.collection = mongoose.connection.collection(name);
  }

  async upsert(_id: string, payload: any, expiresIn: number) {
    let expiresAt;

    if (expiresIn) {
      expiresAt = new Date(Date.now() + expiresIn * 1000);
    }

    await this.collection.updateOne(
      { _id: _id as any },
      { $set: { payload, ...(expiresAt ? { expiresAt } : undefined) } as any },
      { upsert: true }
    );
  }

  async find(_id: string): Promise<any | undefined> {
    const result: any = await this.collection.findOne({ _id: _id as any }, {
      payload: 1,
    } as any);

    if (!result) return undefined;
    return result.payload ? result.payload : {};
  }

  async findByUserCode(userCode: string): Promise<any | undefined> {
    const result: any = await this.collection.findOne(
      { "payload.userCode": userCode as any },
      { payload: 1 } as any
    );

    if (!result) return undefined;
    return result.payload;
  }

  async findByUid(uid: string): Promise<any | undefined> {
    const result: any = await this.collection.findOne(
      { "payload.uid": uid as any },
      { payload: 1 } as any
    );

    if (!result) return undefined;
    return result.payload;
  }

  async destroy(_id: string) {
    await this.collection.deleteOne({ _id: _id as any });
  }

  async revokeByGrantId(grantId: string) {
    await this.collection.deleteMany({ "payload.grantId": grantId as any });
  }

  async consume(_id: string) {
    await this.collection.findOneAndUpdate({ _id: _id as any }, {
      $set: { "payload.consumed": Math.floor(Date.now() / 1000) },
    } as any);
  }
}

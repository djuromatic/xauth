import { ServerConfig } from '../config/server-config';
import mongoose, { Collection, ConnectOptions } from 'mongoose';
import { Logger } from '../utils/winston.js';
import fileDirName from '../helpers/file-dir-name.js';
import path from 'path';
const logger = new Logger('Database');

const { __dirname } = fileDirName(import.meta);

export function createConnection(serverConfig: ServerConfig) {
  const { connectionString, dbUser, dbPass } = serverConfig.database;

  const dbOptions: ConnectOptions = {};

  //TODO add tls support
  // if (serverConfig.database.tlsPath) {
  //   dbOptions['tlsCAFile'] = path.join(__dirname, serverConfig.database.tlsPath);
  // }
  // logger.info(`options ${JSON.stringify(dbOptions)}`);

  const connection = mongoose.connect(`mongodb+srv://${dbUser}:${dbPass}@${connectionString}`);
  connection
    .then(() => {
      logger.info('Connected to database');
    })
    .catch((err) => {
      logger.error(err);
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
    try {
      let expiresAt;

      if (expiresIn) {
        expiresAt = new Date(Date.now() + expiresIn * 1000);
      }

      let doc = await this.collection.findOne({ _id: _id as any });

      if (doc) {
        // If document exists, replace it
        await this.collection.updateOne(
          { _id: _id as any },
          { $set: { payload, ...(expiresAt ? { expiresAt } : {}) } }
        );
      } else {
        // If document does not exist, insert it
        await this.collection.insertOne({ _id: _id as any, payload, ...(expiresAt ? { expiresAt } : {}) });
      }
    } catch (err) {
      logger.error(err);
    }
  }

  async find(_id: string): Promise<any | undefined> {
    try {
      const result: any = await this.collection.findOne({ _id: _id as any }, {
        payload: 1
      } as any);

      if (!result) return undefined;
      return result.payload ? result.payload : {};
    } catch (err) {
      logger.error(err);
    }
  }

  async findByUserCode(userCode: string): Promise<any | undefined> {
    try {
      const result: any = await this.collection.findOne({ 'payload.userCode': userCode as any }, { payload: 1 } as any);

      if (!result) return undefined;
      return result.payload;
    } catch (err) {
      logger.error(err);
    }
  }

  async findByUid(uid: string): Promise<any | undefined> {
    try {
      const result: any = await this.collection.findOne({ 'payload.uid': uid as any }, { payload: 1 } as any);

      if (!result) return undefined;
      return result.payload;
    } catch (err) {
      logger.error(err);
    }
  }

  async destroy(_id: string) {
    try {
      await this.collection.deleteOne({ _id: _id as any });
    } catch (err) {
      logger.error(err);
    }
  }

  async revokeByGrantId(grantId: string) {
    try {
      await this.collection.deleteMany({ 'payload.grantId': grantId as any });
    } catch (err) {
      logger.error(err);
    }
  }

  async consume(_id: string) {
    try {
      await this.collection.findOneAndUpdate({ _id: _id as any }, {
        $set: { 'payload.consumed': Math.floor(Date.now() / 1000) }
      } as any);
    } catch (err) {
      logger.error(err);
    }
  }
}

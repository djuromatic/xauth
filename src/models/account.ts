import mongoose, { Schema } from "mongoose";


export interface AccountDocument {
    accountId: string;
    profile: ProfileDocument;
    createdAt: Date;
    updatedAt: Date;
}

export interface EmailPasswordAccountDocument extends AccountDocument {
    password: string;
}

export interface ProfileDocument {
    sub: string, // it is essential to always return a sub claim
    email: string,
    email_verified: boolean,
    family_name: string
    given_name: string
    locale: string
}


const accountSchema = new Schema<AccountDocument | EmailPasswordAccountDocument>({
    accountId: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    profile: {
        sub: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        email_verified: { type: Boolean, required: true },
        family_name: { type: String, required: true },
        given_name: { type: String, required: true },
        locale: { type: String, required: true },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }, //todo change to detect this only on update
});

//export model user with UserSchema
export default mongoose.model<AccountDocument>("Account", accountSchema);
import mongoose, { Schema } from 'mongoose';

export interface IServer {
  _id?: string;
  url: string;
  username: string;
  password: string;
  createdAt: Date;
}

const ServerSchema = new Schema<IServer>({
  url: { 
    type: String, 
    required: true 
  },
  username: { 
    type: String, 
    required: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export const Server = mongoose.models.Server || mongoose.model<IServer>('Server', ServerSchema);
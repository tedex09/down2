import mongoose, { Schema } from 'mongoose';

export interface IServer {
  _id?: string;
  url: string;
  username: string;
  password: string;
  name?: string;
  isFavorite?: boolean;
  isM3U?: boolean;
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
  name: {
    type: String,
    required: false
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  isM3U: {
    type: Boolean,
    default: false
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export const Server = mongoose.models.Server || mongoose.model<IServer>('Server', ServerSchema);
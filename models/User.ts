import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
  _id?: string;
  username: string;
  password: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: { 
    type: String, 
    required: true,
    unique: true
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

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

// Cria usuário padrão se não existir
/* (async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!); // ajuste a URI se necessário

    const existingUser = await User.findOne({ username: 'central' });
    if (!existingUser) {
      const defaultUser = new User({
        username: 'central',
        password: 'blazevods@',
        createdAt: new Date()
      });
      await defaultUser.save();
      console.log('Usuário padrão criado: central');
    } else {
      console.log('Usuário padrão já existe');
    }
  } catch (err) {
    console.error('Erro ao criar usuário padrão:', err);
  }
})(); */

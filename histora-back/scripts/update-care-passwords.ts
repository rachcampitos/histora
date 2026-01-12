import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../src/users/schema/user.schema';
import * as bcrypt from 'bcrypt';

async function updatePasswords() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get<Model<User>>(getModelToken(User.name));

  const emails = [
    'paciente@care.test',
    'enfermera1@care.test',
    'enfermera2@care.test',
    'enfermera3@care.test',
  ];

  const newPassword = await bcrypt.hash('test1234', 10);

  for (const email of emails) {
    const result = await userModel.updateOne(
      { email },
      { $set: { password: newPassword } }
    );
    if (result.modifiedCount > 0) {
      console.log(email + ': Updated');
    } else {
      console.log(email + ': Not found or unchanged');
    }
  }

  console.log('\nPasswords updated to: test1234');
  await app.close();
}

updatePasswords()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });

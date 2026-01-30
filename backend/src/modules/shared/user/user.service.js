import { User } from '../../../models/index.js';

export const createUser = async (data) => {
  return await User.create(data);
};

export const getAllUsers = async () => {
  return await User.findAll();
};

export const getUserById = async (id) => {
  return await User.findByPk(id);
};

export const getUserByEmail = async (email) => {
  return await User.findOne({
    where: { email }
  })
}
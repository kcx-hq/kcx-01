import { Client, User } from '../../models/index.js';

export const createClient = async (data) => {
  return await Client.create(data);
};

export const getAllClients = async () => {
  return await Client.findAll({ include: { model: User, as: 'users' } });
};

export const getClientById = async (id) => {
  return await Client.findByPk(id, { include: { model: User, as: 'users' } });
};

export const getClientByEmail = async (email) => {
  return Client.findOne({ where: { email } });
};
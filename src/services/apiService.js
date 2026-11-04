import axios from "axios";

// Fetch data
export const fetchData = async (endpoint) => {
  const response = await axios.get(`/api/v1${endpoint}`);
  return response.data;
};


// Create data
export const createData = async (endpoint, newData) => {
  const response = await axios.post(`/api/v1${endpoint}`, newData);
  return response.data;
};

// Update data
export const updateData = async (endpoint, id, updatedData) => {
  const response = await axios.put(`/api/v1/${endpoint}/${id}`, updatedData);
  return response.data;
};

// Delete data
export const deleteData = async (endpoint, id) => {
  const response = await axios.delete(`/api/v1${endpoint}/${id}`);
  return response.data;
};

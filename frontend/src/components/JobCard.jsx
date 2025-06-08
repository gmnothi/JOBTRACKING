import React from 'react';

export default function JobCard({ job }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
      <h2 className="text-xl font-semibold text-gray-800">{job.title}</h2>
      <p className="text-gray-600">{job.company}</p>
      <p className="text-sm text-gray-400 mt-1">Applied on: {job.date}</p>
      <p className="mt-2 text-sm font-medium text-blue-500">Status: {job.status}</p>
    </div>
  );
}
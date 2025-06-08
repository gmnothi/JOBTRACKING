import React, { useEffect, useState } from 'react';
import axios from 'axios';
import JobCard from '../components/JobCard';

export default function JobList() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get('/api/jobs')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setJobs(res.data);
        } else {
          throw new Error("Unexpected response format");
        }
      })
      .catch((err) => {
        console.error("Error fetching jobs:", err);
        setError("⚠️ Could not load job data.");
      });
  }, []);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {jobs.map((job, index) => (
        <JobCard key={index} job={job} />
      ))}
    </div>
  );
}
